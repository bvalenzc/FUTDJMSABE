import { useState } from 'react'
import {
  MEDIA_MINIMA_MERCADO,
  MULTIPLICADORES_MERCADO,
  tamanoBloqueMercado,
  valorMercado,
} from '../../config/juego'
import { jugadorPorId } from '../../juego/roster'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import type { Jugador } from '../../types/jugador'
import './Mercado.css'

type Props = { onVolver: () => void }

export function Mercado({ onVolver }: Props) {
  const { guardado, quitarCartas, agregarMonedas } = useJuego()
  const [slots, slotsSet] = useState<(string | null)[]>([null, null, null])
  const [eligiendo, eligiendoSet] = useState<number | null>(null)
  const [aviso, avisoSet] = useState<string | null>(null)

  const elegibles = (slotActual: number): Jugador[] => {
    const usadosEnOtros = slots.filter((id, i) => id && i !== slotActual)
    return Object.entries(guardado.coleccion)
      .filter(([id]) => !usadosEnOtros.includes(id))
      .map(([id, cantidad]) => ({ jugador: jugadorPorId(id), cantidad }))
      .filter((x) => x.jugador && x.jugador.media >= MEDIA_MINIMA_MERCADO)
      .filter((x) => x.cantidad >= tamanoBloqueMercado(x.jugador!.media))
      .map((x) => x.jugador!)
      .sort((a, b) => b.media - a.media)
  }

  const totalVenta = slots.reduce((suma, id, i) => {
    if (!id) return suma
    const j = jugadorPorId(id)
    return j ? suma + valorMercado(j.media, i) : suma
  }, 0)

  const vender = () => {
    const aQuitar: string[] = []
    slots.forEach((id) => {
      if (!id) return
      const j = jugadorPorId(id)
      if (!j) return
      for (let i = 0; i < tamanoBloqueMercado(j.media); i++) aQuitar.push(id)
    })
    if (!aQuitar.length) return
    if (!quitarCartas(aQuitar)) {
      avisoSet('Ya no tenés suficientes repetidas')
      window.setTimeout(() => avisoSet(null), 1800)
      return
    }
    agregarMonedas(totalVenta)
    slotsSet([null, null, null])
    avisoSet(`+${totalVenta.toLocaleString('es-CL')}`)
    window.setTimeout(() => avisoSet(null), 1800)
  }

  return (
    <Pantalla titulo="Mercado" onVolver={onVolver}>

      <p className="mercado__intro">
        Vendé repetidas de {MEDIA_MINIMA_MERCADO}+ en bloque. Cada posición paga más que la anterior.
      </p>

      <div className="mercado__slots">
        {slots.map((id, i) => {
          const jugador = id ? jugadorPorId(id) : null
          return (
            <div key={i} className="mercado__slot">
              <span className="mercado__multi">×{MULTIPLICADORES_MERCADO[i]}</span>
              <button type="button" className="mercado__hueco" onClick={() => eligiendoSet(i)}>
                {jugador ? <Carta jugador={jugador} tamano={96} /> : <span className="mercado__mas">+</span>}
              </button>
              {jugador && (
                <span className="mercado__valor">{valorMercado(jugador.media, i).toLocaleString('es-CL')}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mercado__total">
        <span>Total</span>
        <strong>{totalVenta.toLocaleString('es-CL')}</strong>
      </div>

      <button type="button" className="boton-oro mercado__vender" disabled={totalVenta === 0} onClick={vender}>
        VENDER BLOQUE
      </button>

      {eligiendo !== null && (
        <div className="mercado__picker" onClick={() => eligiendoSet(null)}>
          <div className="mercado__picker-caja" onClick={(e) => e.stopPropagation()}>
            <h2>Elegí una carta repetida</h2>
            <div className="mercado__picker-grilla">
              {elegibles(eligiendo).map((j) => (
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
                  <span>×{tamanoBloqueMercado(j.media)}</span>
                </button>
              ))}
              {elegibles(eligiendo).length === 0 && (
                <p className="mercado__picker-vacio">
                  No tenés repetidas suficientes. Hacen falta 3 copias (84+) o 6 copias (80-83).
                </p>
              )}
            </div>
            {slots[eligiendo] && (
              <button
                type="button"
                className="mercado__quitar"
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

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </Pantalla>
  )
}
