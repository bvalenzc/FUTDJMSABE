import { useState } from 'react'
import { precioVenta } from '../../config/juego'
import { jugadorPorId } from '../../juego/roster'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { Moneda } from '../../components/Moneda/Moneda'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import type { Jugador } from '../../types/jugador'
// El selector de apuesta reutiliza el mismo popup que el de SBC/Plantillas.
import '../Sbc/Sbc.css'
import './Ruleta.css'

type Props = { onVolver: () => void }

/** Una carta entra si tenés MÁS de esta cantidad de copias (7+). */
const MINIMO_REPETIDAS = 6
const DURACION_GIRO = 4200

/** Probabilidad real de cada multiplicador (no la que se ve en la rueda, ver SEGMENTOS). */
const PESOS: [number, number][] = [
  [0, 0.6],
  [1, 0.2],
  [2, 0.1],
  [5, 0.05],
  [10, 0.03],
  [20, 0.01],
  [100, 0.005],
  [250, 0.004],
  [500, 0.001],
]

/** Los 20 gajos de la rueda (solo para mostrar): no respetan la probabilidad real
 *  al pie de la letra -si no, x100/x250/x500 nunca entrarían en 20 gajos enteros-
 *  pero sí el orden de qué tan común es cada uno. */
const SEGMENTOS = [500, 20, 1, 0, 2, 100, 0, 1, 5, 0, 250, 1, 2, 0, 10, 1, 5, 0, 2, 10]
const ANGULO_GAJO = 360 / SEGMENTOS.length

const COLOR_GAJO: Record<number, string> = {
  0: '#332d24',
  1: '#6b5a2e',
  2: '#8a6a2a',
  5: '#2f7d4f',
  10: '#1c7a7a',
  20: '#5a3aa0',
  100: '#c9a13c',
  250: '#c9622f',
  500: '#c9304a',
}

function sortearMultiplicador(): number {
  const r = Math.random()
  let acumulado = 0
  for (const [multiplicador, peso] of PESOS) {
    acumulado += peso
    if (r <= acumulado) return multiplicador
  }
  return 0
}

function punto(cx: number, cy: number, r: number, anguloDeg: number) {
  const rad = (anguloDeg * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

function gajoPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = punto(cx, cy, r, a0)
  const p1 = punto(cx, cy, r, a1)
  const largeArc = a1 - a0 > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`
}

export function Ruleta({ onVolver }: Props) {
  const { guardado, quitarCartas, agregarMonedas } = useJuego()

  const [slots, slotsSet] = useState<(string | null)[]>([null, null, null])
  const [eligiendo, eligiendoSet] = useState<number | null>(null)
  const [rotacion, rotacionSet] = useState(0)
  const [girando, girandoSet] = useState(false)
  const [resultado, resultadoSet] = useState<{ multiplicador: number; pago: number } | null>(null)

  const candidatos = (indice: number): Jugador[] => {
    const usadosEnOtros = slots.filter((id, i) => id && i !== indice) as string[]
    return Object.entries(guardado.coleccion)
      .filter(([id, cantidad]) => cantidad > MINIMO_REPETIDAS + usadosEnOtros.filter((u) => u === id).length)
      .map(([id]) => jugadorPorId(id))
      .filter((j): j is Jugador => !!j)
      .sort((a, b) => b.media - a.media)
  }

  const jugadoresApostados = slots
    .filter((id): id is string => !!id)
    .map((id) => jugadorPorId(id))
    .filter((j): j is Jugador => !!j)

  const girar = () => {
    if (girando || jugadoresApostados.length === 0) return
    girandoSet(true)
    resultadoSet(null)

    const multiplicador = sortearMultiplicador()
    const indicesCoincidentes = SEGMENTOS.map((v, i) => (v === multiplicador ? i : -1)).filter((i) => i >= 0)
    const indiceElegido = indicesCoincidentes[Math.floor(Math.random() * indicesCoincidentes.length)]
    const centroGajo = indiceElegido * ANGULO_GAJO + ANGULO_GAJO / 2
    const jitter = (Math.random() - 0.5) * (ANGULO_GAJO * 0.6)

    const actualMod = ((rotacion % 360) + 360) % 360
    const moduloDeseado = ((360 - centroGajo - jitter) % 360 + 360) % 360
    let incremento = moduloDeseado - actualMod
    if (incremento <= 0) incremento += 360
    const vueltasExtra = 5 + Math.floor(Math.random() * 3)
    incremento += 360 * vueltasExtra

    rotacionSet(rotacion + incremento)

    window.setTimeout(() => {
      const pago = jugadoresApostados.reduce((s, j) => s + precioVenta(j.media) * multiplicador, 0)
      quitarCartas(jugadoresApostados.map((j) => j.id))
      if (pago > 0) agregarMonedas(pago)
      resultadoSet({ multiplicador, pago })
      slotsSet([null, null, null])
      girandoSet(false)
    }, DURACION_GIRO)
  }

  return (
    <Pantalla titulo="Ruleta" onVolver={onVolver}>
      <p className="ruleta__intro">
        Poné hasta 3 repetidas (mínimo {MINIMO_REPETIDAS + 1} copias) y girá: se apuesta su valor de venta contra el
        multiplicador que caiga. Las cartas se van, ganes o pierdas.
      </p>

      <div className="ruleta__mesa">
        <div className="ruleta__puntero" aria-hidden="true" />
        <svg
          className="ruleta__rueda"
          viewBox="0 0 220 220"
          style={{ transform: `rotate(${rotacion}deg)` }}
        >
          {SEGMENTOS.map((valor, i) => {
            const a0 = i * ANGULO_GAJO
            const a1 = a0 + ANGULO_GAJO
            const centro = a0 + ANGULO_GAJO / 2
            const p = punto(110, 110, 78, centro)
            return (
              <g key={i}>
                <path d={gajoPath(110, 110, 100, a0, a1)} fill={COLOR_GAJO[valor]} stroke="#0a0908" strokeWidth="1" />
                <text
                  x={p.x}
                  y={p.y}
                  fill="#f0e6cc"
                  fontSize="12"
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${centro} ${p.x} ${p.y})`}
                >
                  x{valor}
                </text>
              </g>
            )
          })}
          <circle cx="110" cy="110" r="14" fill="#0a0908" stroke="#e8c565" strokeWidth="2" />
        </svg>
      </div>

      <div className="ruleta__slots">
        {slots.map((id, i) => {
          const jugador = id ? jugadorPorId(id) : null
          return (
            <button
              key={i}
              type="button"
              className="ruleta__slot"
              disabled={girando}
              onClick={() => eligiendoSet(i)}
            >
              {jugador ? <Carta jugador={jugador} tamano={84} /> : <span className="ruleta__mas">+</span>}
            </button>
          )
        })}
      </div>

      <button type="button" className="boton-oro ruleta__girar" disabled={girando || jugadoresApostados.length === 0} onClick={girar}>
        {girando ? 'GIRANDO…' : 'GIRAR'}
      </button>

      {resultado && (
        <div className={`ruleta__resultado${resultado.pago > 0 ? ' ruleta__resultado--gana' : ' ruleta__resultado--pierde'}`}>
          <strong>×{resultado.multiplicador}</strong>
          <span>
            {resultado.pago > 0 ? (
              <>
                +{resultado.pago.toLocaleString('es-CL')} <Moneda tamano={14} />
              </>
            ) : (
              'Se fueron las cartas sin nada a cambio.'
            )}
          </span>
        </div>
      )}

      {eligiendo !== null && (
        <div className="sbc__picker" onClick={() => eligiendoSet(null)}>
          <div className="sbc__picker-caja" onClick={(e) => e.stopPropagation()}>
            <h2>Elegí una repetida para apostar</h2>
            <div className="sbc__picker-grilla">
              {candidatos(eligiendo).map((j) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => {
                    const nuevos = [...slots]
                    nuevos[eligiendo] = j.id
                    slotsSet(nuevos)
                    eligiendoSet(null)
                  }}
                >
                  <Carta jugador={j} tamano={104} />
                </button>
              ))}
              {candidatos(eligiendo).length === 0 && (
                <p className="sbc__picker-vacio">No tenés ninguna carta repetida más de {MINIMO_REPETIDAS} veces.</p>
              )}
            </div>
            {slots[eligiendo] && (
              <button
                type="button"
                className="sbc__quitar"
                onClick={() => {
                  const nuevos = [...slots]
                  nuevos[eligiendo] = null
                  slotsSet(nuevos)
                  eligiendoSet(null)
                }}
              >
                Quitar del slot
              </button>
            )}
          </div>
        </div>
      )}
    </Pantalla>
  )
}
