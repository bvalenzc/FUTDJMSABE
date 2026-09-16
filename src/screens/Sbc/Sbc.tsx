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
import { quimicaTotal } from '../../juego/quimica'
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

/** Valida un slot ya lleno contra su propio requisito (jugador/media/posición puntual).
 *  No filtra el selector: eso ahora lo hace solo la posición, ver `candidatos`. */
function cumpleSlot(jugador: Jugador, plantilla: PlantillaSbc, indice: number): boolean {
  const requisito: RequisitoSbc = plantilla.requisitos[indice] ?? {}
  if (requisito.jugadorId && jugador.id !== requisito.jugadorId) return false
  if (requisito.mediaMinima && jugador.media < requisito.mediaMinima) return false
  const rolFormacion = plantilla.formacion ? FORMACIONES[plantilla.formacion]?.[indice]?.role : undefined
  const posicionExigida = requisito.posicion ?? rolFormacion
  if (posicionExigida && !posicionesDe(jugador).includes(posicionExigida)) return false
  return true
}

function cumpleAgregado(
  req: RequisitoAgregado,
  jugadores: Jugador[],
  slots: SlotFormacion[],
  asignados: (string | null)[],
): boolean {
  if (req.tipo === 'cantidadMinima') return jugadores.length >= req.minimo
  if (req.tipo === 'cantidadMaxima') return jugadores.length <= req.maximo
  if (req.tipo === 'mediaPromedio') {
    if (!jugadores.length) return false
    return jugadores.reduce((s, j) => s + j.media, 0) / jugadores.length >= req.minimo
  }
  if (req.tipo === 'soloPersonas') return jugadores.length > 0 && jugadores.every((j) => req.personas.includes(personaDe(j)))
  if (req.tipo === 'cantidadRareza') return jugadores.filter((j) => calcularRareza(j) === req.rareza).length >= req.minimo
  if (req.tipo === 'cantidadTipoStats') return jugadores.filter((j) => j.tipoStats === req.tipoStats).length >= req.minimo
  if (req.tipo === 'incluyePersonas') {
    return req.personas.every(
      ({ persona, mediaMinima }) => jugadores.some((j) => personaDe(j) === persona && j.media >= (mediaMinima ?? 0)),
    )
  }
  if (req.tipo === 'quimicaMinima') return quimicaTotal(asignados, slots) >= req.minimo
  return true
}

function textoAgregado(req: RequisitoAgregado): string {
  if (req.tipo === 'cantidadMinima') return `Mínimo ${req.minimo} jugadores`
  if (req.tipo === 'cantidadMaxima') return `Máximo ${req.maximo} jugadores`
  if (req.tipo === 'mediaPromedio') return `Media general +${req.minimo}`
  if (req.tipo === 'soloPersonas') return `Solo cartas de: ${req.personas.join(', ')}`
  if (req.tipo === 'cantidadRareza') {
    const nombre = RAREZAS.find((r) => r.id === req.rareza)?.nombre ?? req.rareza
    return `Mínimo ${req.minimo} cartas ${nombre}`
  }
  if (req.tipo === 'cantidadTipoStats') {
    const etiqueta = req.tipoStats === 'arquero' ? 'arqueros' : 'jugadores de campo'
    return `Mínimo ${req.minimo} ${etiqueta}`
  }
  if (req.tipo === 'incluyePersonas') {
    return `Tiene que estar: ${req.personas.map((p) => (p.mediaMinima ? `${p.persona} +${p.mediaMinima}` : p.persona)).join(', ')}`
  }
  if (req.tipo === 'quimicaMinima') return `Química mínima ${req.minimo}`
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
  const [seleccion, seleccionSet] = useState<number | null>(null)
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
    seleccionSet(null)
  }

  const cerrarPlantilla = () => {
    plantillaActivaSet(null)
    requisitosAbiertoSet(false)
    eligiendoSet(null)
    seleccionSet(null)
  }

  // Tocar una carta ya puesta la deja "parpadeando" (movible); tocar cualquier
  // otro puesto la mueve ahí (intercambiando si ese puesto también tenía carta).
  // Tocar un puesto vacío sin nada seleccionado abre el selector de siempre.
  const tocarSlot = (indice: number) => {
    if (seleccion !== null) {
      if (seleccion === indice) {
        seleccionSet(null)
        return
      }
      const nuevos = [...asignados]
      ;[nuevos[indice], nuevos[seleccion]] = [nuevos[seleccion], nuevos[indice]]
      asignadosSet(nuevos)
      seleccionSet(null)
      return
    }
    if (asignados[indice]) {
      seleccionSet(indice)
      return
    }
    eligiendoSet(indice)
  }

  // Saca la carta parpadeando de la plantilla: no la borra de Mi Equipo ni
  // impide volver a elegirla, solo deja ese puesto vacío de nuevo.
  const quitarSeleccionado = () => {
    if (seleccion === null) return
    const nuevos = [...asignados]
    nuevos[seleccion] = null
    asignadosSet(nuevos)
    seleccionSet(null)
  }

  const slots = plantillaActiva?.formacion ? FORMACIONES[plantillaActiva.formacion] ?? [] : []

  // El selector muestra TODAS las repetidas que puedan jugar en ese puesto: los
  // requisitos de jugador/media/lista blanca ya no filtran acá, solo se validan
  // al completar (ver `cumpleSlot`/`cumpleAgregado`). Tampoco deja repetir a la
  // misma persona en dos slots (dos cartas de MAU, por ejemplo).
  const candidatos = (indice: number): Jugador[] => {
    if (!plantillaActiva) return []
    const usadosEnOtros = asignados.filter((id, i) => id && i !== indice) as string[]
    const personasUsadas = new Set(
      usadosEnOtros.map((id) => jugadorPorId(id)).filter((j): j is Jugador => !!j).map(personaDe),
    )
    const rolFormacion = plantillaActiva.formacion ? slots[indice]?.role : undefined
    const posicionExigida = plantillaActiva.requisitos[indice]?.posicion ?? rolFormacion
    return Object.entries(guardado.coleccion)
      .map(([id, cantidad]) => ({ jugador: jugadorPorId(id), cantidad }))
      .filter((x): x is { jugador: Jugador; cantidad: number } => !!x.jugador)
      .filter((x) => !posicionExigida || posicionesDe(x.jugador).includes(posicionExigida))
      .filter((x) => !personasUsadas.has(personaDe(x.jugador)))
      // Una SBC solo gasta copias de más: la última de cada carta no se ofrece.
      .filter((x) => x.cantidad > usadosEnOtros.filter((u) => u === x.jugador.id).length + 1)
      .map((x) => x.jugador)
      .sort((a, b) => b.media - a.media)
  }

  const jugadoresAsignados = (): Jugador[] =>
    asignados
      .filter((x): x is string => !!x)
      .map((id) => jugadorPorId(id))
      .filter((j): j is Jugador => !!j)

  const agregados = plantillaActiva?.requisitosAgregados ?? []
  const jugadores = jugadoresAsignados()

  // Cuántas cartas hay que poner: si la plantilla no fija un mínimo/máximo propio,
  // por defecto hay que llenar todos los puestos (como siempre); si fija uno de
  // los dos, el otro no restringe (0 de piso, o todos los puestos de techo).
  const minimoAgregado = agregados.find((r): r is Extract<RequisitoAgregado, { tipo: 'cantidadMinima' }> => r.tipo === 'cantidadMinima')
  const maximoAgregado = agregados.find((r): r is Extract<RequisitoAgregado, { tipo: 'cantidadMaxima' }> => r.tipo === 'cantidadMaxima')
  const totalSlots = plantillaActiva?.requisitos.length ?? 0
  const minimoEfectivo = minimoAgregado?.minimo ?? (maximoAgregado ? 0 : totalSlots)
  const maximoEfectivo = maximoAgregado?.maximo ?? totalSlots
  const cantidadOk = jugadores.length >= minimoEfectivo && jugadores.length <= maximoEfectivo

  const completaPorSlot = !plantillaActiva
    ? false
    : plantillaActiva.requisitos.every((_, i) => {
        const id = asignados[i]
        if (!id) return true
        const jugador = jugadorPorId(id)
        return !!jugador && cumpleSlot(jugador, plantillaActiva, i)
      })

  const agregadosOtros = agregados.filter((r) => r.tipo !== 'cantidadMinima' && r.tipo !== 'cantidadMaxima')
  const agregadosOk = agregadosOtros.every((r) => cumpleAgregado(r, jugadores, slots, asignados))
  const completa = !!plantillaActiva && cantidadOk && completaPorSlot && agregadosOk

  const filaCantidad = {
    texto:
      minimoEfectivo === maximoEfectivo
        ? `Exactamente ${minimoEfectivo} jugador${minimoEfectivo === 1 ? '' : 'es'}`
        : maximoEfectivo >= totalSlots
          ? `Mínimo ${minimoEfectivo} jugador${minimoEfectivo === 1 ? '' : 'es'}`
          : `Entre ${minimoEfectivo} y ${maximoEfectivo} jugadores`,
    ok: cantidadOk,
  }
  const filasRequisitos = [filaCantidad, ...agregadosOtros.map((r) => ({ texto: textoAgregado(r), ok: cumpleAgregado(r, jugadores, slots, asignados) }))]

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
                const moviendo = seleccion === i
                return (
                  <button
                    key={i}
                    type="button"
                    className={`draft__slot${moviendo ? ' sbc__slot--moviendo' : ''}`}
                    style={{ left: `${posicionEnCancha(slot).x}%`, top: `${posicionEnCancha(slot).y}%` }}
                    onClick={() => tocarSlot(i)}
                  >
                    {jugador ? <Carta jugador={jugador} tamano={64} /> : <span className="draft__slot-vacio">{slot.role}</span>}
                    {moviendo && (
                      <span
                        className="sbc__borrar-slot"
                        role="button"
                        aria-label="Quitar del slot"
                        onClick={(e) => {
                          e.stopPropagation()
                          quitarSeleccionado()
                        }}
                      >
                        🗑️
                      </span>
                    )}
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
                {filasRequisitos.map((fila, i) => (
                  <div key={i} className="sbc__requisito-fila">
                    <span className={`sbc__requisito-circulo${fila.ok ? ' sbc__requisito-circulo--ok' : ''}`}>
                      {fila.ok ? '✓' : ''}
                    </span>
                    <span>{fila.texto}</span>
                  </div>
                ))}
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
                const moviendo = seleccion === i
                return (
                  <button
                    key={i}
                    type="button"
                    className={`sbc__requisito${moviendo ? ' sbc__slot--moviendo' : ''}`}
                    onClick={() => tocarSlot(i)}
                  >
                    {jugador ? <Carta jugador={jugador} tamano={96} /> : <span className="sbc__hueco">+</span>}
                    <span className="sbc__req-texto">{textoRequisitoSlot(req)}</span>
                    {moviendo && (
                      <span
                        className="sbc__borrar-slot"
                        role="button"
                        aria-label="Quitar del slot"
                        onClick={(e) => {
                          e.stopPropagation()
                          quitarSeleccionado()
                        }}
                      >
                        🗑️
                      </span>
                    )}
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
                  <p className="sbc__picker-vacio">No tenés repetidas de esa posición disponibles.</p>
                )}
              </div>
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
                <span className="sbc-plantilla__dificultad">DIFICULTAD: {plantilla.dificultad.toUpperCase()}</span>
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
