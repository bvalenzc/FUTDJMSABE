import { useEffect, useMemo, useRef, useState } from 'react'
import { FORMACIONES, sobrePorId } from '../../config/juego'
import { GRUPO_DJM, copaInfo, type EquipoLiga, type GrupoLiga } from '../../config/liga'
import { grupoPorId } from '../../config/liga'
import {
  aplicarResultadoDeFecha,
  clasificacion,
  djmEsLocal,
  rivalDeFecha,
  type LigaGuardado,
  type ResultadoPartido,
} from '../../juego/liga'
import { jugadorPorId } from '../../juego/roster'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { EscudoEquipo } from '../../components/EscudoEquipo/EscudoEquipo'
import { Minijuego } from '../../components/Minijuego/Minijuego'
import { Moneda } from '../../components/Moneda/Moneda'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import type { Jugador, StatsArquero, StatsCampo } from '../../types/jugador'
import './Partido.css'

type Recompensa = { monedas: number; packs: string[]; mvpId: string | null }

type Props = { onVolver: () => void; onFin: () => void }

type TipoEvento = 'ataque' | 'defensa' | 'tarjeta' | 'lesion'
type Evento = { minuto: number; tipo: TipoEvento; equipo: 'djm' | 'rival' }
type EventoResuelto = Evento & { exito?: boolean }

const PACKS_GANA = ['veliz', 'djm']
const PACKS_PIERDE = ['euforia', 'nuende']
/** Penalización de fuerza (sobre 99) que deja una tarjeta roja para lo que resta del partido. */
const PENALIZACION_ROJA = 9

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Curva tipo Elo: a más diferencia, más probabilidad, pero nunca 0 ni 1. */
function sigmoide(diferencia: number, sensibilidad: number): number {
  return 1 / (1 + Math.pow(10, -diferencia / sensibilidad))
}

/**
 * La media del plantel pesa más que el stat puntual del jugador de turno: un draft con
 * mejor media tiene que sentirse con más chances de ganar de punta a punta, no solo
 * cuando le toca ejecutar a su mejor carta.
 */
function probabilidadEvento(statJugador: number, rivalPoder: number, mediaEquipo: number): number {
  const diferencia = (mediaEquipo - rivalPoder) * 1.1 + (statJugador - rivalPoder) * 0.4
  return clamp(sigmoide(diferencia, 40), 0.1, 0.92)
}

/** Con qué frecuencia la chance es de DJM y no del rival: sube fuerte con la diferencia de media. */
function probabilidadChanceDjm(mediaDjm: number, rivalPoder: number): number {
  return clamp(sigmoide((mediaDjm - rivalPoder) * 1.3, 40), 0.12, 0.88)
}

/** 8 a 12 eventos por partido: la mayoría chances de gol, más alguna tarjeta o lesión. */
function generarEventos(mediaDjm: number, rivalPoder: number): Evento[] {
  const total = 8 + Math.floor(Math.random() * 5)
  const probDjm = probabilidadChanceDjm(mediaDjm, rivalPoder)
  const minutos = Array.from({ length: total }, () => 1 + Math.floor(Math.random() * 89)).sort((a, b) => a - b)
  return minutos.map((minuto) => {
    const r = Math.random()
    if (r < 0.65) {
      const equipo: 'djm' | 'rival' = Math.random() < probDjm ? 'djm' : 'rival'
      return { minuto, tipo: equipo === 'djm' ? 'ataque' : 'defensa', equipo }
    }
    const tipo: TipoEvento = r < 0.85 ? 'tarjeta' : 'lesion'
    return { minuto, tipo, equipo: Math.random() < 0.5 ? 'djm' : 'rival' }
  })
}

export function Partido({ onVolver, onFin }: Props) {
  const { guardado, agregarMonedas, agregarSobres, guardarResultadoLiga } = useJuego()

  // Se congela todo lo necesario para jugar apenas se entra: la liga sigue viva en el
  // contexto (guardado.liga) y al terminar el partido queda con la fecha ya avanzada y
  // el equipo pendiente vacío, así que no sirve para seguir armando este mismo partido.
  const [partido] = useState(() => {
    const liga = guardado.liga
    const grupo = liga ? grupoPorId(GRUPO_DJM) : undefined
    const rival = grupo && liga ? rivalDeFecha(grupo, liga.jornada) : null
    const equipo = liga?.equipoPendiente ?? null
    return {
      grupo,
      rival,
      equipo,
      jornada: liga?.jornada ?? 0,
      local: grupo && liga ? djmEsLocal(grupo, liga.jornada) : true,
    }
  })
  const { grupo, rival, equipo, jornada, local } = partido

  const [titulares, titularesSet] = useState<(string | null)[]>(equipo?.titulares ?? [])
  const [suplentes, suplentesSet] = useState<(string | null)[]>(equipo?.suplentes ?? [])
  const [subsAbierto, subsAbiertoSet] = useState(false)
  const [seleccionSub, seleccionSubSet] = useState<{ tipo: 'titular' | 'banco'; indice: number } | null>(null)

  const [fase, faseSet] = useState<'previa' | 'jugando' | 'final' | 'recompensa'>('previa')
  const [golesDjm, golesDjmSet] = useState(0)
  const [golesRival, golesRivalSet] = useState(0)
  const [indiceEvento, indiceEventoSet] = useState(0)
  const [eventoActivo, eventoActivoSet] = useState(false)
  const [historial, historialSet] = useState<EventoResuelto[]>([])
  const [flavor, flavorSet] = useState<string | null>(null)
  const [recompensa, recompensaSet] = useState<Recompensa | null>(null)
  const [minutoMostrado, minutoMostradoSet] = useState(0)
  const [penalDjm, penalDjmSet] = useState(0)
  const [penalRival, penalRivalSet] = useState(0)
  const [contribuciones, contribucionesSet] = useState<Record<string, number>>({})

  const eventos = useMemo(() => (equipo && rival ? generarEventos(equipo.media, rival.poder) : []), [equipo, rival])

  const yaRecompenso = useRef(false)

  if (!grupo || !rival || !equipo) {
    return (
      <Pantalla titulo="Liga" onVolver={onVolver}>
        <p className="partido__vacio">No hay ningún equipo listo. Volvé a la liga y terminá un draft primero.</p>
      </Pantalla>
    )
  }

  const evento = fase === 'jugando' ? eventos[indiceEvento] : undefined
  const slots = FORMACIONES[equipo.formacion] ?? []

  const portero = titulares[0] ? jugadorPorId(titulares[0]) : undefined
  const indicesConJugador = titulares.map((id, i) => (id ? i : -1)).filter((i) => i >= 0)

  // Un solo protagonista por evento, elegido cuando el evento aparece (no en cada
  // render): si se recalculara siempre, el reloj animándose de fondo lo cambiaría
  // varias veces por segundo mientras el jugador todavía está mirando la tarjeta.
  const jugadorDelEvento: Jugador | undefined = useMemo(() => {
    if (!evento) return undefined
    if (evento.tipo === 'defensa') return portero
    if (evento.equipo !== 'djm') return undefined
    if (evento.tipo === 'ataque') {
      const posibles = titulares
        .slice(1)
        .filter((id): id is string => !!id)
        .map((id) => jugadorPorId(id))
        .filter((j): j is Jugador => !!j)
      return posibles[Math.floor(Math.random() * Math.max(1, posibles.length))]
    }
    // tarjeta o lesión de DJM: cualquiera de la cancha
    const id = titulares[indicesConJugador[Math.floor(Math.random() * Math.max(1, indicesConJugador.length))] ?? 0]
    return id ? jugadorPorId(id) : undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceEvento, fase])

  const probabilidadDelEvento = (() => {
    if (!evento || !jugadorDelEvento) return 0.5
    const rivalPoder = rival.poder + penalRival
    if (evento.tipo === 'ataque') {
      const tir = (jugadorDelEvento.stats as StatsCampo).tir ?? jugadorDelEvento.media
      return probabilidadEvento(tir, rivalPoder, equipo.media - penalDjm)
    }
    const par = (jugadorDelEvento.stats as StatsArquero).par ?? jugadorDelEvento.media
    return probabilidadEvento(par, rivalPoder, equipo.media - penalDjm)
  })()

  // El reloj sube animado hacia el minuto del próximo evento antes de mostrar su tarjeta.
  // Con setInterval en vez de requestAnimationFrame: el rAF se pausa si la pestaña
  // pierde el foco a mitad de partido, y el reloj se quedaría trabado.
  useEffect(() => {
    if (fase !== 'jugando' || !evento) return
    const desde = minutoMostrado
    const hasta = evento.minuto
    if (desde >= hasta) return
    const inicio = Date.now()
    const duracion = clamp((hasta - desde) * 45, 250, 1200)
    const intervalo = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - inicio) / duracion)
      minutoMostradoSet(Math.round(desde + (hasta - desde) * t))
      if (t >= 1) window.clearInterval(intervalo)
    }, 40)
    return () => window.clearInterval(intervalo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceEvento, fase])

  const avanzarEvento = () => {
    const siguiente = indiceEvento + 1
    if (siguiente >= eventos.length) faseSet('final')
    else indiceEventoSet(siguiente)
    eventoActivoSet(false)
    flavorSet(null)
  }

  const resolverEvento = (exito: boolean) => {
    if (evento?.tipo === 'ataque' && exito) {
      golesDjmSet((g) => g + 1)
      if (jugadorDelEvento) contribucionesSet((c) => ({ ...c, [jugadorDelEvento.id]: (c[jugadorDelEvento.id] ?? 0) + 2 }))
    }
    if (evento?.tipo === 'defensa' && !exito) golesRivalSet((g) => g + 1)
    if (evento?.tipo === 'defensa' && exito && jugadorDelEvento) {
      contribucionesSet((c) => ({ ...c, [jugadorDelEvento.id]: (c[jugadorDelEvento.id] ?? 0) + 1 }))
    }
    historialSet((h) => [...h, { ...evento!, exito }])
    avanzarEvento()
  }

  // Tarjetas y lesiones no se juegan: se muestran solas y siguen a los pocos segundos.
  useEffect(() => {
    if (fase !== 'jugando' || !evento || evento.tipo === 'ataque' || evento.tipo === 'defensa') return
    if (minutoMostrado !== evento.minuto) return

    if (evento.tipo === 'tarjeta') {
      const roja = Math.random() < 0.35
      const quien = evento.equipo === 'djm' && jugadorDelEvento ? jugadorDelEvento.nombre : `un jugador de ${rival.nombre}`
      flavorSet(`${roja ? '🟥' : '🟨'} Tarjeta ${roja ? 'roja' : 'amarilla'} para ${quien}.`)
      if (roja) {
        if (evento.equipo === 'djm') penalDjmSet((p) => p + PENALIZACION_ROJA)
        else penalRivalSet((p) => p + PENALIZACION_ROJA)
      }
    } else {
      if (evento.equipo === 'djm' && jugadorDelEvento) {
        const indiceLesionado = titulares.indexOf(jugadorDelEvento.id)
        const indiceBanco = suplentes.findIndex((id) => !!id)
        if (indiceLesionado >= 0 && indiceBanco >= 0) {
          const entra = jugadorPorId(suplentes[indiceBanco]!)
          titularesSet((prev) => prev.map((x, i) => (i === indiceLesionado ? suplentes[indiceBanco] : x)))
          suplentesSet((prev) => prev.map((x, i) => (i === indiceBanco ? jugadorDelEvento.id : x)))
          flavorSet(`🩹 Se lesiona ${jugadorDelEvento.nombre}. Entra ${entra?.nombre ?? 'un suplente'}.`)
        } else {
          flavorSet(`🩹 ${jugadorDelEvento.nombre} queda dolorido, pero sigue jugando.`)
        }
      } else {
        flavorSet(`🩹 Se lesiona un jugador de ${rival.nombre}. Sigue en cancha.`)
      }
    }

    const espera = window.setTimeout(() => {
      historialSet((h) => [...h, evento])
      avanzarEvento()
    }, 2200)
    return () => window.clearTimeout(espera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutoMostrado, indiceEvento, fase])

  const terminarYRecompensar = () => {
    if (yaRecompenso.current || !guardado.liga) return
    yaRecompenso.current = true

    const resultadoDjm: ResultadoPartido = local
      ? { jornada, local: 'djm', visita: rival.id, golesLocal: golesDjm, golesVisita: golesRival }
      : { jornada, local: rival.id, visita: 'djm', golesLocal: golesRival, golesVisita: golesDjm }
    const nuevaLiga = aplicarResultadoDeFecha(guardado.liga, resultadoDjm, GRUPO_DJM)
    guardarResultadoLiga(nuevaLiga)

    const gano = golesDjm > golesRival
    const empato = golesDjm === golesRival
    const monedas = gano ? 20000 : empato ? 8000 : 3000
    agregarMonedas(monedas)
    const bolsa = gano ? PACKS_GANA : PACKS_PIERDE
    const cantidad = 1 + Math.floor(Math.random() * 3)
    const packs: string[] = []
    for (let i = 0; i < cantidad; i++) {
      const id = bolsa[Math.floor(Math.random() * bolsa.length)]
      agregarSobres(id, 1)
      packs.push(id)
    }

    let mvpId: string | null = null
    if (gano) {
      const entradas = Object.entries(contribuciones)
      if (entradas.length) {
        entradas.sort((a, b) => b[1] - a[1] || (jugadorPorId(b[0])?.media ?? 0) - (jugadorPorId(a[0])?.media ?? 0))
        mvpId = entradas[0][0]
      }
    }

    recompensaSet({ monedas, packs, mvpId })
    faseSet('recompensa')
  }

  const intercambiarSub = (a: { tipo: 'titular' | 'banco'; indice: number }, b: { tipo: 'titular' | 'banco'; indice: number }) => {
    const leer = (p: typeof a) => (p.tipo === 'titular' ? titulares[p.indice] : suplentes[p.indice])
    const escribir = (p: typeof a, id: string | null) => {
      if (p.tipo === 'titular') titularesSet((prev) => prev.map((x, i) => (i === p.indice ? id : x)))
      else suplentesSet((prev) => prev.map((x, i) => (i === p.indice ? id : x)))
    }
    const idA = leer(a)
    const idB = leer(b)
    escribir(a, idB)
    escribir(b, idA)
  }

  const tocarSub = (p: { tipo: 'titular' | 'banco'; indice: number }) => {
    if (!seleccionSub) {
      seleccionSubSet(p)
      return
    }
    if (seleccionSub.tipo === p.tipo && seleccionSub.indice === p.indice) {
      seleccionSubSet(null)
      return
    }
    intercambiarSub(seleccionSub, p)
    seleccionSubSet(null)
  }

  const listoParaMostrar = fase === 'jugando' && evento && minutoMostrado === evento.minuto

  return (
    <Pantalla titulo={`Liga · Fecha ${jornada}`} onVolver={fase === 'recompensa' ? undefined : onVolver}>
      {fase === 'previa' && (
        <div className="partido__previa">
          <div className="partido__previa-cesped" aria-hidden="true" />
          <div className="partido__previa-lado">
            <EscudoEquipo equipo={{ id: 'djm', nombre: 'Don Julio De Milan', esDjm: true, poder: equipo.media }} tamano={84} />
            <strong>DJM</strong>
            <span>Media {equipo.media}</span>
          </div>
          <span className="partido__previa-vs">VS</span>
          <div className="partido__previa-lado">
            <EscudoEquipo equipo={rival} tamano={84} />
            <strong>{rival.nombre}</strong>
          </div>
          <button type="button" className="boton-oro partido__comenzar" onClick={() => faseSet('jugando')}>
            COMENZAR PARTIDO
          </button>
        </div>
      )}

      {(fase === 'jugando' || fase === 'final') && (
        <>
          <div className="partido__marcador">
            <div className="partido__cesped-marcador" aria-hidden="true" />
            <div className="partido__equipo">
              <EscudoEquipo equipo={{ id: 'djm', nombre: 'DJM', esDjm: true, poder: 0 }} tamano={32} />
              <span>DJM</span>
            </div>
            <div className="partido__goles">
              <strong key={`dj-${golesDjm}`} className="partido__gol-numero">
                {golesDjm}
              </strong>
              <em>{fase === 'final' ? 'FINAL' : `${minutoMostrado}'`}</em>
              <strong key={`riv-${golesRival}`} className="partido__gol-numero">
                {golesRival}
              </strong>
            </div>
            <div className="partido__equipo partido__equipo--rival">
              <span>{rival.nombre}</span>
              <EscudoEquipo equipo={rival} tamano={32} />
            </div>
          </div>

          <div className="partido__reloj-barra">
            <span style={{ width: `${(minutoMostrado / 90) * 100}%` }} />
          </div>

          <div className="partido__momentum">
            {eventos.map((e, i) => {
              const resuelto = historial[i]
              let clase = 'partido__punto'
              if (e.tipo === 'tarjeta') clase += ' partido__punto--tarjeta'
              else if (e.tipo === 'lesion') clase += ' partido__punto--lesion'
              else if (resuelto) clase += resuelto.exito ? ' partido__punto--exito' : ' partido__punto--fallo'
              clase += e.equipo === 'djm' ? ' partido__punto--djm' : ' partido__punto--rival'
              return <span key={i} className={clase} style={{ left: `${(e.minuto / 90) * 100}%` }} />
            })}
            <span className="partido__momentum-linea" />
          </div>

          {fase === 'jugando' && listoParaMostrar && (evento!.tipo === 'ataque' || evento!.tipo === 'defensa') && jugadorDelEvento && !eventoActivo && (
            <div key={indiceEvento} className="partido__chance tarjeta partido__aparece">
              <span className="eyebrow">{evento!.tipo === 'ataque' ? 'CHANCE DE GOL' : 'PELIGRO EN TU ARCO'}</span>
              <p>
                {evento!.tipo === 'ataque'
                  ? `${jugadorDelEvento.nombre} queda mano a mano con el arquero rival.`
                  : `${rival.nombre} se escapa y ${jugadorDelEvento.nombre} tiene que salir a tapar.`}
              </p>
              <button type="button" className="boton-oro" onClick={() => eventoActivoSet(true)}>
                {evento!.tipo === 'ataque' ? 'ATACAR' : 'DEFENDER'}
              </button>
            </div>
          )}

          {fase === 'jugando' && listoParaMostrar && (evento!.tipo === 'tarjeta' || evento!.tipo === 'lesion') && flavor && (
            <div key={indiceEvento} className="partido__chance partido__chance--flavor tarjeta partido__aparece">
              <p>{flavor}</p>
            </div>
          )}

          {fase === 'jugando' && listoParaMostrar && jugadorDelEvento && eventoActivo && (
            <div className="partido__minijuego-caja tarjeta partido__aparece">
              <Minijuego
                modo={evento!.tipo === 'ataque' ? 'ataque' : 'defensa'}
                jugador={jugadorDelEvento}
                rival={rival}
                probabilidad={probabilidadDelEvento}
                onResuelto={resolverEvento}
              />
            </div>
          )}

          {fase === 'final' && (
            <div className="partido__fin tarjeta partido__aparece">
              <p className="eyebrow">PARTIDO TERMINADO</p>
              <strong>
                {golesDjm > golesRival ? 'GANASTE' : golesDjm === golesRival ? 'EMPATASTE' : 'PERDISTE'} {golesDjm}-{golesRival}
              </strong>
              <button type="button" className="boton-oro" onClick={terminarYRecompensar}>
                VER RECOMPENSA
              </button>
            </div>
          )}

          {fase === 'jugando' && (
            <button type="button" className="boton-linea partido__subs" onClick={() => subsAbiertoSet(true)}>
              3 SUBS
            </button>
          )}
        </>
      )}

      {fase === 'recompensa' && recompensa && guardado.liga && (
        <PantallaRecompensa
          golesDjm={golesDjm}
          golesRival={golesRival}
          rival={rival}
          liga={guardado.liga}
          grupo={grupo}
          recompensa={recompensa}
          onFin={onFin}
        />
      )}

      {subsAbierto && fase === 'jugando' && (
        <div className="draft__picker" onClick={() => subsAbiertoSet(false)}>
          <div className="draft__picker-caja" onClick={(e) => e.stopPropagation()}>
            <h2 className="rotulo">Cambios</h2>
            <div className="partido__subs-lista">
              {slots.map((slot, i) => {
                const jugador = titulares[i] ? jugadorPorId(titulares[i]!) : null
                const puesto = { tipo: 'titular' as const, indice: i }
                const elegido = seleccionSub?.tipo === 'titular' && seleccionSub.indice === i
                return (
                  <button
                    key={i}
                    type="button"
                    className={`partido__sub-slot${elegido ? ' partido__sub-slot--elegido' : ''}`}
                    onClick={() => tocarSub(puesto)}
                  >
                    <span className="partido__sub-num">{i + 1}</span>
                    {jugador && <Carta jugador={jugador} tamano={70} />}
                    <span className="partido__sub-rol">{slot.role}</span>
                  </button>
                )
              })}
            </div>
            <p className="rotulo" style={{ marginTop: 14 }}>
              Banco
            </p>
            <div className="partido__subs-lista">
              {suplentes.map((id, i) => {
                const jugador = id ? jugadorPorId(id) : null
                const puesto = { tipo: 'banco' as const, indice: i }
                const elegido = seleccionSub?.tipo === 'banco' && seleccionSub.indice === i
                return (
                  <button
                    key={i}
                    type="button"
                    className={`partido__sub-slot${elegido ? ' partido__sub-slot--elegido' : ''}`}
                    onClick={() => tocarSub(puesto)}
                  >
                    {jugador && <Carta jugador={jugador} tamano={70} />}
                  </button>
                )
              })}
            </div>
            <button type="button" className="boton-oro" style={{ marginTop: 14, width: '100%' }} onClick={() => subsAbiertoSet(false)}>
              LISTO
            </button>
          </div>
        </div>
      )}
    </Pantalla>
  )
}

function PantallaRecompensa({
  golesDjm,
  golesRival,
  rival,
  liga,
  grupo,
  recompensa,
  onFin,
}: {
  golesDjm: number
  golesRival: number
  rival: EquipoLiga
  liga: LigaGuardado
  grupo: GrupoLiga
  recompensa: Recompensa
  onFin: () => void
}) {
  const filas = clasificacion(grupo, liga.tablas[grupo.id])
  const terminada = liga.fase === 'copas'
  const copaDjm = liga.copas?.['djm']
  const mvp = recompensa.mvpId ? jugadorPorId(recompensa.mvpId) : null

  return (
    <div className="partido__recompensa">
      <p className="eyebrow">
        {golesDjm > golesRival ? 'VICTORIA' : golesDjm === golesRival ? 'EMPATE' : 'DERROTA'} ANTE {rival.nombre.toUpperCase()}
      </p>
      <strong className="partido__recompensa-marcador">
        {golesDjm} - {golesRival}
      </strong>

      {mvp && (
        <div className="partido__mvp">
          <span className="eyebrow">MVP DEL PARTIDO</span>
          <Carta jugador={mvp} tamano={120} />
        </div>
      )}

      <div className="partido__recompensa-premios tarjeta">
        <span className="partido__recompensa-monedas">
          <Moneda tamano={20} /> +{recompensa.monedas.toLocaleString('es-CL')}
        </span>
        <div className="partido__recompensa-packs">
          {recompensa.packs.map((id, i) => {
            const sobre = sobrePorId(id)
            return (
              <span key={i} className={`partido__recompensa-pack sobre-item--${sobre?.tema}`}>
                {sobre?.nombre}
              </span>
            )
          })}
        </div>
      </div>

      <p className="rotulo" style={{ marginTop: 18 }}>
        Tabla · Grupo {grupo.nombre}
      </p>
      <div className="tarjeta partido__tabla-mini">
        {filas.map((fila, i) => (
          <div key={fila.id} className={`partido__tabla-mini-fila${fila.equipo.esDjm ? ' partido__tabla-mini-fila--djm' : ''}`}>
            <span>{i + 1}</span>
            <EscudoEquipo equipo={fila.equipo} tamano={18} />
            <span className="partido__tabla-mini-nombre">{fila.equipo.nombre}</span>
            <span className="partido__tabla-mini-pts">{fila.pts} pts</span>
          </div>
        ))}
      </div>

      {terminada && copaDjm && (
        <div className="liga__final" style={{ borderColor: copaInfo(copaDjm).color, marginTop: 14 }}>
          <span className="rotulo">Fase de grupos terminada</span>
          <strong style={{ color: copaInfo(copaDjm).color }}>Clasificaste a {copaInfo(copaDjm).nombre}</strong>
        </div>
      )}

      <button type="button" className="boton-oro partido__volver-inicio" onClick={onFin}>
        VOLVER A INICIO
      </button>
    </div>
  )
}
