import { useState } from 'react'
import { FORMACIONES, type SlotFormacion } from '../../config/juego'
import { conexionesDe } from '../../juego/conexiones'
import type { PlantillaGuardada } from '../../juego/estado'
import { quimicaDeSlot, quimicaMaxima, quimicaTotal } from '../../juego/quimica'
import { jugadorPorId, personaDe, posicionesDe } from '../../juego/roster'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import type { Jugador } from '../../types/jugador'
import { PosterPlantilla } from './PosterPlantilla'
// Misma cancha, líneas y pestaña deslizable que Draft/SBC.
import '../Draft/Draft.css'
import './Plantillas.css'

type Props = { onVolver: () => void }

const FORMACION_INICIAL = '1-3-2-1'

function posicionEnCancha(slot: SlotFormacion) {
  return { x: 9 + slot.x * 0.82, y: 5 + slot.y * 0.92 }
}

function MiniCancha({ formacion }: { formacion: string }) {
  return (
    <div className="mini-cancha">
      {FORMACIONES[formacion].map((slot, i) => (
        <span key={i} style={{ left: `${slot.x}%`, top: `${slot.y}%` }} />
      ))}
    </div>
  )
}

export function Plantillas({ onVolver }: Props) {
  const { guardado, guardarPlantilla } = useJuego()

  const [editando, editandoSet] = useState<PlantillaGuardada | null>(null)
  const [formacion, formacionSet] = useState(FORMACION_INICIAL)
  const [titulares, titularesSet] = useState<(string | null)[]>(Array(FORMACIONES[FORMACION_INICIAL].length).fill(null))
  const [eligiendo, eligiendoSet] = useState<number | null>(null)
  const [formacionAbierta, formacionAbiertaSet] = useState(false)
  const [poster, posterSet] = useState(false)
  const [aviso, avisoSet] = useState<string | null>(null)

  const mostrarAviso = (texto: string) => {
    avisoSet(texto)
    window.setTimeout(() => avisoSet(null), 1800)
  }

  const nuevaPlantilla = () => {
    editandoSet({ id: `${Date.now()}`, fecha: Date.now(), formacion: FORMACION_INICIAL, titulares: [] })
    formacionSet(FORMACION_INICIAL)
    titularesSet(Array(FORMACIONES[FORMACION_INICIAL].length).fill(null))
    formacionAbiertaSet(false)
  }

  const abrirGuardada = (p: PlantillaGuardada) => {
    editandoSet(p)
    formacionSet(p.formacion)
    titularesSet(p.titulares)
    formacionAbiertaSet(false)
  }

  const cerrarEditor = () => {
    editandoSet(null)
    eligiendoSet(null)
    formacionAbiertaSet(false)
    posterSet(false)
  }

  const cambiarFormacion = (clave: string) => {
    if (clave === formacion) {
      formacionAbiertaSet(false)
      return
    }
    formacionSet(clave)
    titularesSet(Array(FORMACIONES[clave].length).fill(null))
    formacionAbiertaSet(false)
  }

  const slots = FORMACIONES[formacion] ?? []
  const conexiones = conexionesDe(slots)
  const enPosicion = slots.map((slot, i) => quimicaDeSlot(titulares[i] ?? null, slot.role) > 0)
  const quimica = quimicaTotal(titulares, slots)
  const quimicaTope = quimicaMaxima(slots)

  const cartasTitulares = titulares
    .filter((id): id is string => !!id)
    .map((id) => jugadorPorId(id))
    .filter((j): j is Jugador => !!j)
  const media = cartasTitulares.length
    ? Math.round(cartasTitulares.reduce((s, j) => s + j.media, 0) / cartasTitulares.length)
    : 0

  // Repetidas propias, la posición del slot, y nunca dos cartas de la misma persona.
  const candidatos = (indice: number): Jugador[] => {
    const usadosEnOtros = titulares.filter((id, i) => id && i !== indice) as string[]
    const personasUsadas = new Set(
      usadosEnOtros.map((id) => jugadorPorId(id)).filter((j): j is Jugador => !!j).map(personaDe),
    )
    const rol = slots[indice]?.role
    return Object.entries(guardado.coleccion)
      .filter(([, cantidad]) => cantidad > 1)
      .map(([id]) => jugadorPorId(id))
      .filter((j): j is Jugador => !!j)
      .filter((j) => !rol || posicionesDe(j).includes(rol))
      .filter((j) => !personasUsadas.has(personaDe(j)))
      .sort((a, b) => b.media - a.media)
  }

  const guardar = () => {
    if (!editando) return
    guardarPlantilla({ id: editando.id, fecha: Date.now(), formacion, titulares })
    mostrarAviso('Plantilla guardada')
    cerrarEditor()
  }

  if (editando) {
    return (
      <Pantalla titulo="Plantilla" onVolver={cerrarEditor} sinScroll>
        <div className="draft__cancha-envoltorio">
          <div className="draft__marcador">
            <div className="draft__medida">
              <span className="rotulo">Media</span>
              <strong>{media || '--'}</strong>
            </div>
            <div className="draft__medida draft__medida--quimica">
              <span className="rotulo">Química</span>
              <strong>
                {quimica}
                <em>/{quimicaTope}</em>
              </strong>
              <div className="draft__barra">
                <span style={{ width: `${quimicaTope ? (quimica / quimicaTope) * 100 : 0}%` }} />
              </div>
            </div>
            <span className="draft__formacion-nombre">{formacion}</span>
          </div>

          <div className="draft__cancha">
            <div className="draft__cesped" aria-hidden="true" />

            <svg className="draft__lineas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {conexiones.map(({ a, b }) => {
                const ok = enPosicion[a] && enPosicion[b]
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={posicionEnCancha(slots[a]).x}
                    y1={posicionEnCancha(slots[a]).y}
                    x2={posicionEnCancha(slots[b]).x}
                    y2={posicionEnCancha(slots[b]).y}
                    className={ok ? 'draft__linea draft__linea--ok' : 'draft__linea'}
                  />
                )
              })}
            </svg>

            {slots.map((slot, i) => {
              const id = titulares[i]
              const jugador = id ? jugadorPorId(id) : null
              const suma = quimicaDeSlot(id ?? null, slot.role)
              return (
                <button
                  key={i}
                  type="button"
                  className="draft__slot"
                  style={{ left: `${posicionEnCancha(slot).x}%`, top: `${posicionEnCancha(slot).y}%` }}
                  onClick={() => eligiendoSet(i)}
                >
                  {jugador ? (
                    <>
                      <Carta jugador={jugador} tamano={58} />
                      <span className={`draft__quimica${suma ? ' draft__quimica--ok' : ''}`}>{suma}</span>
                    </>
                  ) : (
                    <span className="draft__slot-vacio">{slot.role}</span>
                  )}
                </button>
              )
            })}

            <button
              type="button"
              className={`draft__lengueta plantillas__lengueta-formacion${formacionAbierta ? ' draft__lengueta--abierta' : ''}`}
              onClick={() => formacionAbiertaSet(!formacionAbierta)}
              aria-expanded={formacionAbierta}
            >
              FORMACIÓN
            </button>

            <div className={`draft__banco plantillas__panel-formacion${formacionAbierta ? ' draft__banco--abierto' : ''}`}>
              {Object.keys(FORMACIONES).map((clave) => (
                <button
                  key={clave}
                  type="button"
                  className={`plantillas__opcion-formacion${clave === formacion ? ' plantillas__opcion-formacion--activa' : ''}`}
                  onClick={() => cambiarFormacion(clave)}
                >
                  <MiniCancha formacion={clave} />
                  <span>{clave}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="plantillas__acciones">
            <button type="button" className="boton-oro" onClick={guardar}>
              GUARDAR PLANTILLA
            </button>
            <button type="button" className="boton-linea" onClick={() => posterSet(true)}>
              GUARDAR IMAGEN
            </button>
          </div>
        </div>

        {eligiendo !== null && (
          <div className="draft__picker" onClick={() => eligiendoSet(null)}>
            <div className="draft__picker-caja" onClick={(e) => e.stopPropagation()}>
              <h2 className="rotulo">Elegí {slots[eligiendo]?.role}</h2>
              <div className="draft__opciones">
                {candidatos(eligiendo).map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      const nuevos = [...titulares]
                      nuevos[eligiendo] = j.id
                      titularesSet(nuevos)
                      eligiendoSet(null)
                    }}
                  >
                    <Carta jugador={j} tamano={98} />
                  </button>
                ))}
                {candidatos(eligiendo).length === 0 && (
                  <p className="draft__pista">No tenés repetidas de esa posición disponibles.</p>
                )}
              </div>
              {titulares[eligiendo] && (
                <button
                  type="button"
                  className="sbc__quitar"
                  onClick={() => {
                    const nuevos = [...titulares]
                    nuevos[eligiendo] = null
                    titularesSet(nuevos)
                    eligiendoSet(null)
                  }}
                >
                  Quitar del slot
                </button>
              )}
            </div>
          </div>
        )}

        {poster && (
          <PosterPlantilla
            formacion={formacion}
            titulares={titulares}
            media={media}
            quimica={quimica}
            quimicaTope={quimicaTope}
            onCerrar={() => posterSet(false)}
          />
        )}

        {aviso && <div className="aviso-toast">{aviso}</div>}
      </Pantalla>
    )
  }

  return (
    <Pantalla titulo="Plantillas" onVolver={onVolver}>
      <p className="sbc__intro">Armá equipos con tus cartas repetidas, guardalos acá o bajalos como imagen.</p>

      <button type="button" className="boton-oro plantillas__agregar" onClick={nuevaPlantilla}>
        + AÑADIR PLANTILLA
      </button>

      <div className="plantillas__lista">
        {guardado.plantillasGuardadas.map((p) => {
          const jugadores = p.titulares
            .filter((id): id is string => !!id)
            .map((id) => jugadorPorId(id))
            .filter((j): j is Jugador => !!j)
          return (
            <button key={p.id} type="button" className="plantillas__item" onClick={() => abrirGuardada(p)}>
              <div className="plantillas__item-texto">
                <strong>{p.formacion}</strong>
                <span>{jugadores.length}/{FORMACIONES[p.formacion]?.length ?? 0} puestos</span>
              </div>
              <div className="plantillas__item-mini">
                {jugadores.slice(0, 4).map((j) => (
                  <Carta key={j.id} jugador={j} tamano={40} />
                ))}
              </div>
            </button>
          )
        })}
        {guardado.plantillasGuardadas.length === 0 && (
          <p className="coleccion__vacio">Todavía no armaste ninguna plantilla.</p>
        )}
      </div>

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </Pantalla>
  )
}
