import { useState } from 'react'
import { CATALOGO_SBC, sobrePorId, type PlantillaSbc, type RequisitoSbc } from '../../config/juego'
import { jugadorPorId, posicionesDe } from '../../juego/roster'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import type { Jugador } from '../../types/jugador'
import './Sbc.css'

type Props = { onVolver: () => void }

export function Sbc({ onVolver }: Props) {
  const { guardado, quitarCartas, agregarMonedas, agregarSobres, marcarPlantilla } = useJuego()
  const [plantillaActiva, plantillaActivaSet] = useState<PlantillaSbc | null>(null)
  const [asignados, asignadosSet] = useState<(string | null)[]>([])
  const [eligiendo, eligiendoSet] = useState<number | null>(null)
  const [aviso, avisoSet] = useState<string | null>(null)

  const sbc = CATALOGO_SBC[0]

  const abrirPlantilla = (plantilla: PlantillaSbc) => {
    plantillaActivaSet(plantilla)
    asignadosSet(Array(plantilla.requisitos.length).fill(null))
  }

  const cumple = (jugador: Jugador, requisito: RequisitoSbc): boolean => {
    if (requisito.jugadorId && jugador.id !== requisito.jugadorId) return false
    if (requisito.mediaMinima && jugador.media < requisito.mediaMinima) return false
    if (requisito.posicion && !posicionesDe(jugador).includes(requisito.posicion)) return false
    return true
  }

  const candidatos = (indice: number): Jugador[] => {
    if (!plantillaActiva) return []
    const requisito = plantillaActiva.requisitos[indice]
    const usadosEnOtros = asignados.filter((id, i) => id && i !== indice) as string[]
    return Object.entries(guardado.coleccion)
      .map(([id, cantidad]) => ({ jugador: jugadorPorId(id), cantidad }))
      .filter((x) => x.jugador && cumple(x.jugador, requisito))
      .filter((x) => x.cantidad > usadosEnOtros.filter((u) => u === x.jugador!.id).length)
      .map((x) => x.jugador!)
      .sort((a, b) => b.media - a.media)
  }

  const completa = plantillaActiva && asignados.every(Boolean)

  const confirmar = () => {
    if (!plantillaActiva || !completa) return
    const ids = asignados.filter((x): x is string => !!x)
    if (!quitarCartas(ids)) {
      avisoSet('Te faltan cartas para completarla')
      window.setTimeout(() => avisoSet(null), 1800)
      return
    }
    agregarMonedas(plantillaActiva.recompensaMonedas)
    plantillaActiva.recompensaSobres.forEach((r) => agregarSobres(r.sobreId, r.cantidad))
    marcarPlantilla(plantillaActiva.id)
    avisoSet(`¡Plantilla completa! +${plantillaActiva.recompensaMonedas.toLocaleString('es-CL')}`)
    window.setTimeout(() => avisoSet(null), 2400)
    plantillaActivaSet(null)
  }

  if (plantillaActiva) {
    return (
      <Pantalla titulo={plantillaActiva.nombre} onVolver={() => plantillaActivaSet(null)}>

        <p className="sbc__intro">Asigná una carta tuya a cada requisito. Al confirmar se consumen.</p>

        <div className="sbc__requisitos">
          {plantillaActiva.requisitos.map((req, i) => {
            const id = asignados[i]
            const jugador = id ? jugadorPorId(id) : null
            return (
              <button key={i} type="button" className="sbc__requisito" onClick={() => eligiendoSet(i)}>
                {jugador ? <Carta jugador={jugador} tamano={96} /> : <span className="sbc__hueco">+</span>}
                <span className="sbc__req-texto">{textoRequisito(req)}</span>
              </button>
            )
          })}
        </div>

        <div className="sbc__premio">
          <span>Recompensa</span>
          <strong>{plantillaActiva.recompensaMonedas.toLocaleString('es-CL')} monedas</strong>
          {plantillaActiva.recompensaSobres.map((r) => (
            <em key={r.sobreId}>
              {r.cantidad}× {sobrePorId(r.sobreId)?.nombre}
            </em>
          ))}
        </div>

        <button type="button" className="boton-oro sbc__confirmar" disabled={!completa} onClick={confirmar}>
          CONFIRMAR PLANTILLA
        </button>

        {eligiendo !== null && (
          <div className="sbc__picker" onClick={() => eligiendoSet(null)}>
            <div className="sbc__picker-caja" onClick={(e) => e.stopPropagation()}>
              <h2>{textoRequisito(plantillaActiva.requisitos[eligiendo])}</h2>
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
                  <p className="sbc__picker-vacio">No tenés cartas que cumplan este requisito.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {aviso && <div className="aviso-toast">{aviso}</div>}
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo="SBC" onVolver={onVolver}>

      <section className="sbc__cabecera">
        <h2>{sbc.nombre}</h2>
        <p>{sbc.descripcion}</p>
      </section>

      <div className="sbc__lista">
        {sbc.plantillas.map((plantilla) => {
          const hecha = !!guardado.plantillasHechas[plantilla.id]
          return (
            <button
              key={plantilla.id}
              type="button"
              className={`sbc__plantilla${hecha ? ' sbc__plantilla--hecha' : ''}`}
              onClick={() => !hecha && abrirPlantilla(plantilla)}
            >
              <div>
                <h3>{plantilla.nombre}</h3>
                <p>
                  {plantilla.requisitos.length} cartas · {plantilla.dificultad}
                </p>
              </div>
              <span>{hecha ? 'HECHA' : `${plantilla.recompensaMonedas.toLocaleString('es-CL')}`}</span>
            </button>
          )
        })}
      </div>

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </Pantalla>
  )
}

function textoRequisito(req: RequisitoSbc): string {
  const partes: string[] = []
  if (req.jugadorId) partes.push(jugadorPorId(req.jugadorId)?.nombre ?? req.jugadorId)
  if (req.posicion) partes.push(req.posicion)
  if (req.mediaMinima) partes.push(`media ${req.mediaMinima}+`)
  return partes.length ? partes.join(' · ') : 'Cualquier carta'
}
