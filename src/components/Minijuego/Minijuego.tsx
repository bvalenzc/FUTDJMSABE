import { useEffect, useMemo, useState } from 'react'
import type { EquipoLiga } from '../../config/liga'
import type { Jugador } from '../../types/jugador'
import { Carta } from '../Carta/Carta'
import { EscudoEquipo } from '../EscudoEquipo/EscudoEquipo'
import './Minijuego.css'

const CELDAS = 12
const TIEMPO_MS = 2600

type Props = {
  modo: 'ataque' | 'defensa'
  jugador: Jugador
  rival: EquipoLiga
  /** fracción 0-1 de celdas abiertas: más alta = más fácil. */
  probabilidad: number
  onResuelto: (exito: boolean) => void
}

/** Minijuego "tocá el arco": elegís una de las 12 celdas antes de que se acabe el tiempo. */
export function Minijuego({ modo, jugador, rival, probabilidad, onResuelto }: Props) {
  const abiertas = useMemo(() => {
    const cantidad = Math.min(11, Math.max(1, Math.round(probabilidad * CELDAS)))
    const indices = Array.from({ length: CELDAS }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return new Set(indices.slice(0, cantidad))
  }, [probabilidad])

  const [elegida, elegidaSet] = useState<number | null>(null)
  const [tiempoQueda, tiempoQuedaSet] = useState(1)

  useEffect(() => {
    if (elegida !== null) return
    const inicio = Date.now()
    const intervalo = window.setInterval(() => {
      const resto = 1 - (Date.now() - inicio) / TIEMPO_MS
      tiempoQuedaSet(Math.max(0, resto))
      if (resto <= 0) {
        window.clearInterval(intervalo)
        elegidaSet(-1)
      }
    }, 40)
    return () => window.clearInterval(intervalo)
  }, [elegida])

  useEffect(() => {
    if (elegida === null) return
    const exito = elegida >= 0 && abiertas.has(elegida)
    const espera = window.setTimeout(() => onResuelto(exito), 1100)
    return () => window.clearTimeout(espera)
  }, [elegida, abiertas, onResuelto])

  const resuelto = elegida !== null
  const exito = resuelto && elegida! >= 0 && abiertas.has(elegida!)

  const tituloAccion = modo === 'ataque' ? '¡DEFINÍ!' : '¡ACHICÁ!'
  const etiquetaChance = modo === 'ataque' ? 'CHANCE DE GOL' : 'CHANCE DE ATAJAR'

  return (
    <div className="minijuego">
      <p className="eyebrow minijuego__titulo">{tituloAccion}</p>

      <div className="minijuego__duelo">
        <div className="minijuego__lado">
          <Carta jugador={jugador} tamano={78} />
        </div>
        <span className="minijuego__vs">VS</span>
        <div className="minijuego__lado minijuego__lado--rival">
          <EscudoEquipo equipo={rival} tamano={56} />
          <span>{rival.nombre}</span>
        </div>
      </div>

      <div className="minijuego__chance">
        <span className="rotulo">{etiquetaChance}</span>
        <strong>{Math.round(probabilidad * 100)}%</strong>
      </div>

      {!resuelto && (
        <div className="minijuego__barra-tiempo">
          <span style={{ width: `${tiempoQueda * 100}%` }} />
        </div>
      )}

      <div className="minijuego__arco">
        {Array.from({ length: CELDAS }, (_, i) => {
          const abierta = abiertas.has(i)
          let clase = 'minijuego__celda'
          if (resuelto) clase += abierta ? ' minijuego__celda--abierta' : ' minijuego__celda--cerrada'
          if (resuelto && i === elegida) clase += ' minijuego__celda--elegida'
          return (
            <button
              key={i}
              type="button"
              className={clase}
              disabled={resuelto}
              onClick={() => elegidaSet(i)}
              aria-label={`Zona ${i + 1}`}
            />
          )
        })}
      </div>

      {resuelto && (
        <p className={`minijuego__resultado${exito ? ' minijuego__resultado--exito' : ' minijuego__resultado--fallo'}`}>
          {modo === 'ataque'
            ? exito
              ? '¡GOL!'
              : elegida === -1
                ? 'SE TE ACABÓ EL TIEMPO'
                : 'ATAJADA DEL ARQUERO'
            : exito
              ? '¡LA SACASTE!'
              : elegida === -1
                ? 'NO LLEGASTE A TIEMPO'
                : 'GOL DEL RIVAL'}
        </p>
      )}
    </div>
  )
}
