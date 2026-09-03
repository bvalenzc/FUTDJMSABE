import { useMemo, useRef, useState } from 'react'
import { FORMACIONES, SUPLENTES, type SlotFormacion } from '../../config/juego'
import { conexionesDe } from '../../juego/conexiones'
import type { DraftGuardado } from '../../juego/estado'
import { candidatosCapitan, formacionesAlAzar, opcionesParaBanco, opcionesParaSlot } from '../../juego/sorteo'
import { jugadorPorId, personaDe, posicionesDe } from '../../juego/roster'
import { quimicaDeSlot, quimicaMaxima, quimicaTotal } from '../../juego/quimica'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { PosterDraft } from './PosterDraft'
import type { Jugador } from '../../types/jugador'
import './Draft.css'

type Props = { onVolver: () => void; onIrLiga: () => void }
type Etapa = 'formacion' | 'capitan' | 'cancha' | 'final'
type Puesto = { tipo: 'slot' | 'banco'; indice: number }

const MENSAJE_HUECO = 'NO SEAI LARRY, NO LO PODI CAMBIAR AHÍ'

/** Lleva las coordenadas de la formación al área útil de la cancha dibujada. */
function posicionEnCancha(slot: SlotFormacion) {
  return { x: 9 + slot.x * 0.82, y: 5 + slot.y * 0.92 }
}

export function Draft({ onVolver, onIrLiga }: Props) {
  const { guardarDraft, enviarEquipoALiga, agregarMonedas } = useJuego()

  const [etapa, etapaSet] = useState<Etapa>('formacion')
  const [opcionesFormacion, opcionesFormacionSet] = useState<string[]>(() => formacionesAlAzar())
  const [formacion, formacionSet] = useState<string | null>(null)
  const [capitanId, capitanIdSet] = useState<string | null>(null)
  const [capitanes, capitanesSet] = useState<Jugador[]>([])
  const [titulares, titularesSet] = useState<(string | null)[]>([])
  const [suplentes, suplentesSet] = useState<(string | null)[]>(Array(SUPLENTES).fill(null))
  const [eligiendo, eligiendoSet] = useState<Puesto | null>(null)
  const [opciones, opcionesSet] = useState<Jugador[]>([])
  const [seleccion, seleccionSet] = useState<Puesto | null>(null)
  const [aviso, avisoSet] = useState<string | null>(null)
  const [mostrarPoster, mostrarPosterSet] = useState(false)
  const [bancoAbierto, bancoAbiertoSet] = useState(false)
  const cancha = useRef<HTMLDivElement>(null)

  const slots = formacion ? FORMACIONES[formacion] : []

  const personasUsadas = useMemo(
    () =>
      [...titulares, ...suplentes]
        .filter((x): x is string => !!x)
        .map((id) => jugadorPorId(id))
        .filter((j): j is Jugador => !!j)
        .map(personaDe),
    [titulares, suplentes],
  )

  const elegidos = [...titulares, ...suplentes].filter(Boolean).length
  const completo = titulares.length > 0 && titulares.every(Boolean) && suplentes.every(Boolean)

  const media = useMemo(() => {
    const cartas = titulares.filter((x): x is string => !!x).map((id) => jugadorPorId(id))
    if (!cartas.length) return 0
    return Math.round(cartas.reduce((s, j) => s + (j?.media ?? 0), 0) / cartas.length)
  }, [titulares])

  const quimica = useMemo(() => quimicaTotal(titulares, slots), [titulares, slots])
  const quimicaTope = quimicaMaxima(slots)
  const conexiones = useMemo(() => conexionesDe(slots), [slots])
  const enPosicion = useMemo(
    () => slots.map((slot, i) => quimicaDeSlot(titulares[i] ?? null, slot.role) > 0),
    [slots, titulares],
  )

  const mostrarAviso = (texto: string) => {
    avisoSet(texto)
    window.setTimeout(() => avisoSet(null), 2000)
  }

  const elegirFormacion = (clave: string) => {
    formacionSet(clave)
    capitanesSet(candidatosCapitan(clave))
    etapaSet('capitan')
  }

  const elegirCapitan = (id: string) => {
    const jugador = jugadorPorId(id)
    const definicion = FORMACIONES[formacion!]
    const titularesNuevos: (string | null)[] = Array(definicion.length).fill(null)
    const suplentesNuevos: (string | null)[] = Array(SUPLENTES).fill(null)

    // El capitán entra en un slot de alguna de sus posiciones; si la formación no
    // tiene ninguna, arranca en el banco.
    const idx = jugador ? definicion.findIndex((s) => posicionesDe(jugador).includes(s.role)) : -1
    if (idx >= 0) titularesNuevos[idx] = id
    else suplentesNuevos[0] = id

    capitanIdSet(id)
    titularesSet(titularesNuevos)
    suplentesSet(suplentesNuevos)
    etapaSet('cancha')
  }

  const contenido = (puesto: Puesto) =>
    puesto.tipo === 'slot' ? titulares[puesto.indice] : suplentes[puesto.indice]

  const escribir = (puesto: Puesto, id: string | null) => {
    if (puesto.tipo === 'slot') {
      titularesSet((prev) => prev.map((x, i) => (i === puesto.indice ? id : x)))
    } else {
      suplentesSet((prev) => prev.map((x, i) => (i === puesto.indice ? id : x)))
    }
  }

  const intercambiar = (a: Puesto, b: Puesto) => {
    const idA = contenido(a)
    const idB = contenido(b)
    escribir(a, idB)
    escribir(b, idA)
  }

  const tocar = (puesto: Puesto) => {
    const ocupado = !!contenido(puesto)

    if (seleccion) {
      if (seleccion.tipo === puesto.tipo && seleccion.indice === puesto.indice) {
        seleccionSet(null)
        return
      }
      if (!ocupado) {
        mostrarAviso(MENSAJE_HUECO)
        return
      }
      intercambiar(seleccion, puesto)
      seleccionSet(null)
      return
    }

    if (ocupado) {
      seleccionSet(puesto)
      return
    }
    if (etapa !== 'cancha') return
    abrirPicker(puesto)
  }

  const abrirPicker = (puesto: Puesto) => {
    const actual = contenido(puesto)
    const jugadorActual = actual ? jugadorPorId(actual) : null
    const usadas = personasUsadas.filter((p) => !jugadorActual || p !== personaDe(jugadorActual))
    opcionesSet(
      puesto.tipo === 'slot' ? opcionesParaSlot(slots[puesto.indice].role, usadas) : opcionesParaBanco(usadas),
    )
    eligiendoSet(puesto)
  }

  const asignar = (id: string) => {
    if (!eligiendo) return
    escribir(eligiendo, id)
    eligiendoSet(null)
  }

  const premio = Math.max(0, (media - 70) * 100 + quimica * 20)

  const terminar = () => {
    etapaSet('final')
    if (premio > 0) agregarMonedas(premio)
  }

  const equipoActual = (): DraftGuardado => ({
    id: `${Date.now()}`,
    fecha: Date.now(),
    formacion: formacion!,
    capitanId,
    titulares,
    suplentes,
    media,
  })

  const irALiga = () => {
    const equipo = equipoActual()
    guardarDraft(equipo)
    enviarEquipoALiga(equipo)
    onIrLiga()
  }

  const reiniciarDraft = () => {
    etapaSet('formacion')
    opcionesFormacionSet(formacionesAlAzar())
    formacionSet(null)
    capitanIdSet(null)
    capitanesSet([])
    titularesSet([])
    suplentesSet(Array(SUPLENTES).fill(null))
    eligiendoSet(null)
    opcionesSet([])
    seleccionSet(null)
    avisoSet(null)
    mostrarPosterSet(false)
    bancoAbiertoSet(false)
  }

  return (
    <Pantalla titulo="Draft" onVolver={onVolver}>
      {etapa === 'formacion' && (
        <section className="draft__paso">
          <h2 className="rotulo">Elegí formación</h2>
          <div className="draft__formaciones">
            {opcionesFormacion.map((clave) => (
              <button key={clave} type="button" onClick={() => elegirFormacion(clave)}>
                <MiniCancha formacion={clave} />
                <span>{clave}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {etapa === 'capitan' && (
        <section className="draft__paso">
          <h2 className="rotulo">Elegí capitán</h2>
          <div className="draft__opciones">
            {capitanes.map((j) => (
              <button key={j.id} type="button" onClick={() => elegirCapitan(j.id)}>
                <Carta jugador={j} tamano={104} />
              </button>
            ))}
          </div>
        </section>
      )}

      {(etapa === 'cancha' || etapa === 'final') && formacion && (
        <section className="draft__cancha-envoltorio">
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

          <div className="draft__cancha" ref={cancha}>
            {/* El césped es la única capa inclinada; las cartas quedan de frente. */}
            <div className="draft__cesped" aria-hidden="true" />

            {/* Red de conexiones: verde cuando las dos puntas están en posición. */}
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
              const puesto: Puesto = { tipo: 'slot', indice: i }
              const elegido = seleccion?.tipo === 'slot' && seleccion.indice === i
              const suma = quimicaDeSlot(id ?? null, slot.role)
              return (
                <button
                  key={i}
                  type="button"
                  className={`draft__slot${elegido ? ' draft__slot--elegido' : ''}`}
                  style={{
                    left: `${posicionEnCancha(slot).x}%`,
                    top: `${posicionEnCancha(slot).y}%`,
                  }}
                  onClick={() => tocar(puesto)}
                >
                  {jugador ? (
                    <>
                      <Carta jugador={jugador} tamano={58} />
                      <span className={`draft__quimica${suma ? ' draft__quimica--ok' : ''}`}>{suma}</span>
                      {id === capitanId && <span className="draft__cinta">C</span>}
                    </>
                  ) : (
                    <span className="draft__slot-vacio">{slot.role}</span>
                  )}
                </button>
              )
            })}

            {/* Banco escondido: la lengüeta lo despliega desde abajo. */}
            <button
              type="button"
              className={`draft__lengueta${bancoAbierto ? ' draft__lengueta--abierta' : ''}`}
              onClick={() => bancoAbiertoSet(!bancoAbierto)}
              aria-expanded={bancoAbierto}
            >
              SUBS
            </button>

            <div className={`draft__banco${bancoAbierto ? ' draft__banco--abierto' : ''}`}>
              {suplentes.map((id, i) => {
                const jugador = id ? jugadorPorId(id) : null
                const puesto: Puesto = { tipo: 'banco', indice: i }
                const elegido = seleccion?.tipo === 'banco' && seleccion.indice === i
                return (
                  <button
                    key={i}
                    type="button"
                    className={`draft__banco-slot${elegido ? ' draft__slot--elegido' : ''}`}
                    onClick={() => tocar(puesto)}
                  >
                    {jugador ? <Carta jugador={jugador} tamano={52} /> : <span className="draft__slot-vacio">+</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {seleccion && <p className="draft__pista">Tocá otra carta para intercambiarlas.</p>}

          {etapa === 'cancha' && (
            <button type="button" className="boton-oro draft__terminar" disabled={!completo} onClick={terminar}>
              {completo ? 'TERMINAR DRAFT' : `FALTAN ${slots.length + SUPLENTES - elegidos} CARTAS`}
            </button>
          )}

          {etapa === 'final' && (
            <div className="draft__final">
              <p>
                Equipo terminado: media <strong>{media}</strong>, química{' '}
                <strong>
                  {quimica}/{quimicaTope}
                </strong>
                . Ganaste {premio.toLocaleString('es-CL')} ÑUENDE COINS.
              </p>
              <p className="draft__pista">Podés seguir moviendo jugadores entre posiciones.</p>
              <div className="draft__acciones">
                <button type="button" className="boton-oro" onClick={irALiga}>
                  IR A LIGA
                </button>
                <div className="draft__acciones-secundarias">
                  <button type="button" className="boton-linea" onClick={() => mostrarPosterSet(true)}>
                    DESCARGAR IMAGEN
                  </button>
                  <button type="button" className="boton-linea" onClick={reiniciarDraft}>
                    REINICIAR DRAFT
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {eligiendo && (
        <div className="draft__picker" onClick={() => eligiendoSet(null)}>
          <div className="draft__picker-caja" onClick={(e) => e.stopPropagation()}>
            <h2 className="rotulo">
              {eligiendo.tipo === 'slot' ? `Elegí ${slots[eligiendo.indice].role}` : 'Elegí suplente'}
            </h2>
            <div className="draft__opciones">
              {opciones.map((j) => (
                <button key={j.id} type="button" onClick={() => asignar(j.id)}>
                  <Carta jugador={j} tamano={98} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mostrarPoster && formacion && (
        <PosterDraft
          formacion={formacion}
          titulares={titulares}
          suplentes={suplentes}
          capitanId={capitanId}
          media={media}
          quimica={quimica}
          quimicaTope={quimicaTope}
          onCerrar={() => mostrarPosterSet(false)}
        />
      )}

      {aviso && <div className="aviso-toast aviso-toast--fuerte">{aviso}</div>}
    </Pantalla>
  )
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
