import { useState } from 'react'
import {
  CATALOGO_SBC,
  FORMACIONES,
  sobrePorId,
  type PlantillaSbc,
  type RequisitoAgregado,
  type RequisitoSbc,
  type Sbc as SbcGrupo,
  type SlotFormacion,
} from '../../config/juego'
import { calcularRareza } from '../../config/rareza'
import { jugadorPorId, personaDe, posicionesDe } from '../../juego/roster'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import type { Jugador } from '../../types/jugador'
import { RAREZAS } from '../../types/jugador'
// La cancha de una plantilla con formación reutiliza tal cual el look del FUTDRAFT.
import '../Draft/Draft.css'
import './Sbc.css'

type Props = { onVolver: () => void }

/** Lleva las coordenadas de la formación al área de la cancha (igual que en Draft). */
function posicionEnCancha(slot: SlotFormacion) {
  return { x: 9 + slot.x * 0.82, y: 5 + slot.y * 0.92 }
}

function soloPersonasDe(plantilla: PlantillaSbc): string[] | null {
  const req = plantilla.requisitosAgregados?.find((r) => r.tipo === 'soloPersonas')
  return req && req.tipo === 'soloPersonas' ? req.personas : null
}

function cumpleSlot(jugador: Jugador, plantilla: PlantillaSbc, indice: number): boolean {
  const requisito: RequisitoSbc = plantilla.requisitos[indice] ?? {}
  if (requisito.jugadorId && jugador.id !== requisito.jugadorId) return false
  if (requisito.mediaMinima && jugador.media < requisito.mediaMinima) return false
  const rolFormacion = plantilla.formacion ? FORMACIONES[plantilla.formacion]?.[indice]?.role : undefined
  const posicionExigida = requisito.posicion ?? rolFormacion
  if (posicionExigida && !posicionesDe(jugador).includes(posicionExigida)) return false
  const soloPersonas = soloPersonasDe(plantilla)
  if (soloPersonas && !soloPersonas.includes(personaDe(jugador))) return false
  return true
}

function cumpleAgregado(req: RequisitoAgregado, jugadores: Jugador[]): boolean {
  if (req.tipo === 'cantidadMinima') return jugadores.length >= req.minimo
  if (req.tipo === 'mediaPromedio') {
    if (!jugadores.length) return false
    return jugadores.reduce((s, j) => s + j.media, 0) / jugadores.length >= req.minimo
  }
  if (req.tipo === 'soloPersonas') return jugadores.length > 0 && jugadores.every((j) => req.personas.includes(personaDe(j)))
  if (req.tipo === 'cantidadRareza') return jugadores.filter((j) => calcularRareza(j) === req.rareza).length >= req.minimo
  return true
}

function textoAgregado(req: RequisitoAgregado): string {
  if (req.tipo === 'cantidadMinima') return `Mínimo ${req.minimo} jugadores`
  if (req.tipo === 'mediaPromedio') return `Media general +${req.minimo}`
  if (req.tipo === 'soloPersonas') return `Solo cartas de: ${req.personas.join(', ')}`
  if (req.tipo === 'cantidadRareza') {
    const nombre = RAREZAS.find((r) => r.id === req.rareza)?.nombre ?? req.rareza
    return `Mínimo ${req.minimo} cartas ${nombre}`
  }
  return ''
}

function textoRequisitoSlot(req: RequisitoSbc): string {
  const partes: string[] = []
  if (req.jugadorId) partes.push(jugadorPorId(req.jugadorId)?.nombre ?? req.jugadorId)
  if (req.posicion) partes.push(req.posicion)
  if (req.mediaMinima) partes.push(`media ${req.mediaMinima}+`)
  return partes.length ? partes.join(' · ') : 'Cualquier carta'
}

export function Sbc({ onVolver }: Props) {
  const { guardado, quitarCartas, agregarMonedas, agregarSobres, agregarCartas, marcarPlantilla, marcarSbcReclamado } =
    useJuego()

  const [grupoActivo, grupoActivoSet] = useState<SbcGrupo | null>(null)
  const [plantillaActiva, plantillaActivaSet] = useState<PlantillaSbc | null>(null)
  const [asignados, asignadosSet] = useState<(string | null)[]>([])
  const [eligiendo, eligiendoSet] = useState<number | null>(null)
  const [requisitosAbierto, requisitosAbiertoSet] = useState(false)
  const [aviso, avisoSet] = useState<string | null>(null)

  const mostrarAviso = (texto: string, ms = 1800) => {
    avisoSet(texto)
    window.setTimeout(() => avisoSet(null), ms)
  }

  const abrirPlantilla = (plantilla: PlantillaSbc) => {
    plantillaActivaSet(plantilla)
    asignadosSet(Array(plantilla.requisitos.length).fill(null))
    requisitosAbiertoSet(false)
  }

  const cerrarPlantilla = () => {
    plantillaActivaSet(null)
    requisitosAbiertoSet(false)
    eligiendoSet(null)
  }

  const candidatos = (indice: number): Jugador[] => {
    if (!plantillaActiva) return []
    const usadosEnOtros = asignados.filter((id, i) => id && i !== indice) as string[]
    return Object.entries(guardado.coleccion)
      .map(([id, cantidad]) => ({ jugador: jugadorPorId(id), cantidad }))
      .filter((x) => x.jugador && cumpleSlot(x.jugador, plantillaActiva, indice))
      // Una SBC solo gasta copias de más: la última de cada carta no se ofrece.
      .filter((x) => x.cantidad > usadosEnOtros.filter((u) => u === x.jugador!.id).length + 1)
      .map((x) => x.jugador!)
      .sort((a, b) => b.media - a.media)
  }

  const jugadoresAsignados = (): Jugador[] =>
    asignados
      .filter((x): x is string => !!x)
      .map((id) => jugadorPorId(id))
      .filter((j): j is Jugador => !!j)

  const agregados = plantillaActiva?.requisitosAgregados ?? []
  const jugadores = jugadoresAsignados()
  const agregadosOk = agregados.every((r) => cumpleAgregado(r, jugadores))
  const completa = !!plantillaActiva && asignados.every(Boolean) && agregadosOk

  const confirmar = () => {
    if (!plantillaActiva || !completa) return
    const ids = asignados.filter((x): x is string => !!x)
    if (!quitarCartas(ids)) {
      mostrarAviso('Te faltan cartas para completarla')
      return
    }
    agregarMonedas(plantillaActiva.recompensaMonedas)
    plantillaActiva.recompensaSobres.forEach((r) => agregarSobres(r.sobreId, r.cantidad))
    marcarPlantilla(plantillaActiva.id)
    mostrarAviso(`¡Plantilla completa! +${plantillaActiva.recompensaMonedas.toLocaleString('es-CL')}`, 2400)
    cerrarPlantilla()
  }

  const reclamarGrupo = (sbc: SbcGrupo) => {
    agregarMonedas(sbc.recompensaMonedas)
    sbc.recompensaSobres.forEach((r) => agregarSobres(r.sobreId, r.cantidad))
    if (sbc.cartaEspecialId) agregarCartas([sbc.cartaEspecialId])
    marcarSbcReclamado(sbc.id)
    mostrarAviso(`¡${sbc.nombre} completo!`, 2400)
  }

  // Plantilla abierta: cancha real si tiene formación, si no la fila genérica de siempre.
  if (plantillaActiva) {
    const slots = plantillaActiva.formacion ? FORMACIONES[plantillaActiva.formacion] ?? [] : []
    const usaCancha = slots.length > 0

    return (
      <Pantalla titulo={plantillaActiva.nombre} onVolver={cerrarPlantilla} sinScroll={usaCancha}>
        {usaCancha ? (
          <div className="draft__cancha-envoltorio">
            <div className="draft__cancha sbc__cancha">
              <div className="draft__cesped" aria-hidden="true" />

              {slots.map((slot, i) => {
                const id = asignados[i]
                const jugador = id ? jugadorPorId(id) : null
                return (
                  <button
                    key={i}
                    type="button"
                    className="draft__slot"
                    style={{ left: `${posicionEnCancha(slot).x}%`, top: `${posicionEnCancha(slot).y}%` }}
                    onClick={() => eligiendoSet(i)}
                  >
                    {jugador ? <Carta jugador={jugador} tamano={64} /> : <span className="draft__slot-vacio">{slot.role}</span>}
                  </button>
                )
              })}

              <button
                type="button"
                className={`draft__lengueta sbc__lengueta-requisitos${requisitosAbierto ? ' draft__lengueta--abierta' : ''}`}
                onClick={() => requisitosAbiertoSet(!requisitosAbierto)}
                aria-expanded={requisitosAbierto}
              >
                REQUISITOS
              </button>

              {completa && (
                <button type="button" className="sbc__lengueta-enviar" onClick={confirmar}>
                  SEND VELIZ
                </button>
              )}

              <div className={`draft__banco sbc__panel-requisitos${requisitosAbierto ? ' draft__banco--abierto' : ''}`}>
                {agregados.map((req, i) => {
                  const ok = cumpleAgregado(req, jugadores)
                  return (
                    <div key={i} className="sbc__requisito-fila">
                      <span className={`sbc__requisito-circulo${ok ? ' sbc__requisito-circulo--ok' : ''}`}>{ok ? '✓' : ''}</span>
                      <span>{textoAgregado(req)}</span>
                    </div>
                  )
                })}
                {agregados.length === 0 && (
                  <div className="sbc__requisito-fila">
                    <span className="sbc__requisito-circulo sbc__requisito-circulo--ok">✓</span>
                    <span>Completá los {slots.length} puestos de la formación.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="sbc__intro">
              Asigná una repetida a cada requisito. Al confirmar se consumen; la única copia de una carta nunca se
              ofrece acá.
            </p>

            <div className="sbc__requisitos">
              {plantillaActiva.requisitos.map((req, i) => {
                const id = asignados[i]
                const jugador = id ? jugadorPorId(id) : null
                return (
                  <button key={i} type="button" className="sbc__requisito" onClick={() => eligiendoSet(i)}>
                    {jugador ? <Carta jugador={jugador} tamano={96} /> : <span className="sbc__hueco">+</span>}
                    <span className="sbc__req-texto">{textoRequisitoSlot(req)}</span>
                  </button>
                )
              })}
            </div>

            <button type="button" className="boton-oro sbc__confirmar" disabled={!completa} onClick={confirmar}>
              CONFIRMAR PLANTILLA
            </button>
          </>
        )}

        <div className="sbc__premio">
          <span>Recompensa</span>
          <strong>{plantillaActiva.recompensaMonedas.toLocaleString('es-CL')} monedas</strong>
          {plantillaActiva.recompensaSobres.map((r) => (
            <em key={r.sobreId}>
              {r.cantidad}× {sobrePorId(r.sobreId)?.nombre}
            </em>
          ))}
        </div>

        {eligiendo !== null && (
          <div className="sbc__picker" onClick={() => eligiendoSet(null)}>
            <div className="sbc__picker-caja" onClick={(e) => e.stopPropagation()}>
              <h2>{usaCancha ? slots[eligiendo]?.role : textoRequisitoSlot(plantillaActiva.requisitos[eligiendo])}</h2>
              <div className="sbc__picker-grilla">
                {candidatos(eligiendo).map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      const nuevos = [...asignados]
                      nuevos[eligiendo] = j.id
                      asignadosSet(nuevos)
                      eligiendoSet(null)
                    }}
                  >
                    <Carta jugador={j} tamano={104} />
                  </button>
                ))}
                {candidatos(eligiendo).length === 0 && (
                  <p className="sbc__picker-vacio">No tenés cartas repetidas que cumplan este requisito.</p>
                )}
              </div>
              {asignados[eligiendo] && (
                <button
                  type="button"
                  className="sbc__quitar"
                  onClick={() => {
                    const nuevos = [...asignados]
                    nuevos[eligiendo] = null
                    asignadosSet(nuevos)
                    eligiendoSet(null)
                  }}
                >
                  Quitar del slot
                </button>
              )}
            </div>
          </div>
        )}

        {aviso && <div className="aviso-toast">{aviso}</div>}
      </Pantalla>
    )
  }

  // Un grupo de SBC abierto: la grilla de plantillas que hay que completar.
  if (grupoActivo) {
    const hechas = grupoActivo.plantillas.filter((p) => guardado.plantillasHechas[p.id]).length
    const todasHechas = hechas === grupoActivo.plantillas.length
    const reclamado = !!guardado.sbcReclamados[grupoActivo.id]

    return (
      <Pantalla titulo={grupoActivo.nombre} onVolver={() => grupoActivoSet(null)}>
        <section className="sbc__cabecera">
          <p>{grupoActivo.descripcion}</p>
        </section>

        {todasHechas && !reclamado && (
          <div className="sbc__reclamo tarjeta">
            {grupoActivo.cartaEspecialId && jugadorPorId(grupoActivo.cartaEspecialId) && (
              <Carta jugador={jugadorPorId(grupoActivo.cartaEspecialId)!} tamano={110} />
            )}
            <button type="button" className="boton-oro" onClick={() => reclamarGrupo(grupoActivo)}>
              RECLAMAR RECOMPENSA FINAL
            </button>
          </div>
        )}

        <div className="sbc__grid">
          {grupoActivo.plantillas.map((plantilla) => {
            const hecha = !!guardado.plantillasHechas[plantilla.id]
            return (
              <button
                key={plantilla.id}
                type="button"
                className={`sbc-plantilla${hecha ? ' sbc-plantilla--hecha' : ''}`}
                onClick={() => !hecha && abrirPlantilla(plantilla)}
              >
                {hecha && <span className="sbc-plantilla__check">✓</span>}
                <span className="sbc-plantilla__dificultad">{plantilla.dificultad}</span>
                <h4>{plantilla.nombre}</h4>
                <div className="sbc-plantilla__premios">
                  {plantilla.recompensaSobres.map((r) => (
                    <em key={r.sobreId}>
                      {r.cantidad}× {sobrePorId(r.sobreId)?.nombre}
                    </em>
                  ))}
                  <span>{plantilla.recompensaMonedas.toLocaleString('es-CL')}</span>
                </div>
              </button>
            )
          })}
        </div>

        {aviso && <div className="aviso-toast">{aviso}</div>}
      </Pantalla>
    )
  }

  // Lista de SBCs: los no completados primero, los ya reclamados abajo y opacos.
  const grupos = [...CATALOGO_SBC].sort((a, b) => {
    const aHecho = guardado.sbcReclamados[a.id] ? 1 : 0
    const bHecho = guardado.sbcReclamados[b.id] ? 1 : 0
    return aHecho - bHecho
  })

  return (
    <Pantalla titulo="SBC" onVolver={onVolver}>
      <div className="sbc__grupos">
        {grupos.map((sbc) => {
          const hechas = sbc.plantillas.filter((p) => guardado.plantillasHechas[p.id]).length
          const reclamado = !!guardado.sbcReclamados[sbc.id]
          return (
            <button
              key={sbc.id}
              type="button"
              className={`sbc-grupo${reclamado ? ' sbc-grupo--hecho' : ''}`}
              onClick={() => !reclamado && grupoActivoSet(sbc)}
            >
              <div className="sbc-grupo__texto">
                <h3>{sbc.nombre}</h3>
                <p>{sbc.descripcion}</p>
                <span className="sbc-grupo__progreso">
                  {reclamado ? 'COMPLETO' : `${hechas}/${sbc.plantillas.length} plantillas`}
                </span>
              </div>
              <div className="sbc-grupo__premio">
                {sbc.cartaEspecialId && jugadorPorId(sbc.cartaEspecialId) && (
                  <Carta jugador={jugadorPorId(sbc.cartaEspecialId)!} tamano={56} />
                )}
                <strong>{sbc.recompensaMonedas.toLocaleString('es-CL')}</strong>
              </div>
            </button>
          )
        })}
      </div>

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </Pantalla>
  )
}
