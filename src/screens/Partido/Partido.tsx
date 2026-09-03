import { useMemo, useRef, useState } from 'react'
import { FORMACIONES, sobrePorId } from '../../config/juego'
import { copaInfo, jornadasTotales, type EquipoLiga, type GrupoLiga } from '../../config/liga'
import { grupoPorId } from '../../config/liga'
import {
  aplicarResultadoDeFecha,
  clasificacion,
  djmEsLocal,
  rivalDeFecha,
  simularRestoDeFecha,
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

type Recompensa = { monedas: number; packs: string[] }

type Props = { onVolver: () => void; onFin: () => void }

type Evento = {
  minuto: number
  equipo: 'djm' | 'rival'
}

type EventoResuelto = Evento & { exito: boolean }

const PACKS_GANA = ['veliz', 'djm']
const PACKS_PIERDE = ['euforia', 'nuende']

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function probabilidadEvento(propio: number, rivalPoder: number, mediaEquipo: number): number {
  return clamp(0.32 + (propio - rivalPoder) / 160 + (mediaEquipo - rivalPoder) / 300, 0.14, 0.88)
}

function generarEventos(mediaDjm: number, rivalPoder: number): Evento[] {
  const total = 5 + Math.floor(Math.random() * 3)
  const probDjm = mediaDjm / (mediaDjm + rivalPoder)
  const minutos = Array.from({ length: total }, () => 1 + Math.floor(Math.random() * 89)).sort((a, b) => a - b)
  return minutos.map((minuto) => ({ minuto, equipo: Math.random() < probDjm ? 'djm' : 'rival' }))
}

export function Partido({ onVolver, onFin }: Props) {
  const { guardado, agregarMonedas, agregarSobres, guardarResultadoLiga } = useJuego()

  // Se congela todo lo necesario para jugar apenas se entra: la liga sigue viva en el
  // contexto (guardado.liga) y al terminar el partido queda con la fecha ya avanzada y
  // el equipo pendiente vacío, así que no sirve para seguir armando este mismo partido.
  const [partido] = useState(() => {
    const liga = guardado.liga
    const grupo = liga ? grupoPorId(liga.grupoId) : undefined
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
  const [recompensa, recompensaSet] = useState<Recompensa | null>(null)

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
  const atacantesPosibles = titulares
    .slice(1)
    .filter((id): id is string => !!id)
    .map((id) => jugadorPorId(id))
    .filter((j): j is Jugador => !!j)

  const jugadorDelEvento: Jugador | undefined =
    evento?.equipo === 'djm'
      ? atacantesPosibles[Math.floor(Math.random() * Math.max(1, atacantesPosibles.length))] ?? portero
      : portero

  const probabilidadDelEvento = (() => {
    if (!evento || !jugadorDelEvento) return 0.5
    if (evento.equipo === 'djm') {
      const tir = (jugadorDelEvento.stats as StatsCampo).tir ?? jugadorDelEvento.media
      return probabilidadEvento(tir, rival.poder, equipo.media)
    }
    const par = (jugadorDelEvento.stats as StatsArquero).par ?? jugadorDelEvento.media
    return probabilidadEvento(par, rival.poder, equipo.media)
  })()

  const resolverEvento = (exito: boolean) => {
    if (evento?.equipo === 'djm' && exito) golesDjmSet((g) => g + 1)
    if (evento?.equipo === 'rival' && !exito) golesRivalSet((g) => g + 1)
    historialSet((h) => [...h, { ...evento!, exito }])
    eventoActivoSet(false)
    const siguiente = indiceEvento + 1
    if (siguiente >= eventos.length) {
      faseSet('final')
    } else {
      indiceEventoSet(siguiente)
    }
  }

  const terminarYRecompensar = () => {
    if (yaRecompenso.current || !guardado.liga) return
    yaRecompenso.current = true

    const resultadoDjm: ResultadoPartido = local
      ? { jornada, local: 'djm', visita: rival.id, golesLocal: golesDjm, golesVisita: golesRival }
      : { jornada, local: rival.id, visita: 'djm', golesLocal: golesRival, golesVisita: golesDjm }
    const resto = simularRestoDeFecha(grupo, jornada)
    const nuevaLiga = aplicarResultadoDeFecha(guardado.liga, resultadoDjm, resto)
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

    recompensaSet({ monedas, packs })
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

  return (
    <Pantalla titulo={`Liga · Fecha ${jornada}`} onVolver={fase === 'recompensa' ? undefined : onVolver}>
      {fase === 'previa' && (
        <div className="partido__previa">
          <div className="partido__previa-lado">
            <EscudoEquipo equipo={{ id: 'djm', nombre: 'Don Julio De Milan', esDjm: true, poder: equipo.media }} tamano={72} />
            <strong>DJM</strong>
            <span>Media {equipo.media}</span>
          </div>
          <span className="partido__previa-vs">VS</span>
          <div className="partido__previa-lado">
            <EscudoEquipo equipo={rival} tamano={72} />
            <strong>{rival.nombre}</strong>
            <span>Nivel {rival.poder}</span>
          </div>
          <button type="button" className="boton-oro partido__comenzar" onClick={() => faseSet('jugando')}>
            COMENZAR PARTIDO
          </button>
        </div>
      )}

      {(fase === 'jugando' || fase === 'final') && (
        <>
          <div className="partido__marcador">
            <div className="partido__equipo">
              <EscudoEquipo equipo={{ id: 'djm', nombre: 'DJM', esDjm: true, poder: 0 }} tamano={30} />
              <span>DJM</span>
            </div>
            <div className="partido__goles">
              <strong>{golesDjm}</strong>
              <em>{fase === 'final' ? 'FINAL' : `${evento?.minuto ?? 90}'`}</em>
              <strong>{golesRival}</strong>
            </div>
            <div className="partido__equipo partido__equipo--rival">
              <span>{rival.nombre}</span>
              <EscudoEquipo equipo={rival} tamano={30} />
            </div>
          </div>

          <div className="partido__momentum">
            {eventos.map((e, i) => {
              const resuelto = historial[i]
              let clase = 'partido__punto'
              if (resuelto) clase += resuelto.exito ? ' partido__punto--exito' : ' partido__punto--fallo'
              clase += e.equipo === 'djm' ? ' partido__punto--djm' : ' partido__punto--rival'
              return <span key={i} className={clase} style={{ left: `${(e.minuto / 90) * 100}%` }} />
            })}
            <span className="partido__momentum-linea" />
          </div>

          {fase === 'jugando' && evento && jugadorDelEvento && !eventoActivo && (
            <div className="partido__chance tarjeta">
              <span className="eyebrow">
                {evento.equipo === 'djm' ? 'CHANCE DE GOL' : 'PELIGRO EN TU ARCO'}
              </span>
              <p>
                {evento.equipo === 'djm'
                  ? `${jugadorDelEvento.nombre} queda mano a mano con el arquero rival.`
                  : `${rival.nombre} se escapa y ${jugadorDelEvento.nombre} tiene que salir a tapar.`}
              </p>
              <button type="button" className="boton-oro" onClick={() => eventoActivoSet(true)}>
                {evento.equipo === 'djm' ? 'ATACAR' : 'DEFENDER'}
              </button>
            </div>
          )}

          {fase === 'jugando' && evento && jugadorDelEvento && eventoActivo && (
            <div className="partido__minijuego-caja tarjeta">
              <Minijuego
                modo={evento.equipo === 'djm' ? 'ataque' : 'defensa'}
                jugador={jugadorDelEvento}
                rival={rival}
                probabilidad={probabilidadDelEvento}
                onResuelto={resolverEvento}
              />
            </div>
          )}

          {fase === 'final' && (
            <div className="partido__fin tarjeta">
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
  const filas = clasificacion(grupo, liga.tabla)
  const total = jornadasTotales(grupo)
  const terminada = liga.jornada > total

  return (
    <div className="partido__recompensa">
      <p className="eyebrow">
        {golesDjm > golesRival ? 'VICTORIA' : golesDjm === golesRival ? 'EMPATE' : 'DERROTA'} ANTE {rival.nombre.toUpperCase()}
      </p>
      <strong className="partido__recompensa-marcador">
        {golesDjm} - {golesRival}
      </strong>

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

      {terminada && liga.copaAsignada && (
        <div className="liga__final" style={{ borderColor: copaInfo(liga.copaAsignada).color, marginTop: 14 }}>
          <span className="rotulo">Fase de grupos terminada</span>
          <strong style={{ color: copaInfo(liga.copaAsignada).color }}>
            Clasificaste a {copaInfo(liga.copaAsignada).nombre}
          </strong>
        </div>
      )}

      <button type="button" className="boton-oro partido__volver-inicio" onClick={onFin}>
        VOLVER A INICIO
      </button>
    </div>
  )
}
