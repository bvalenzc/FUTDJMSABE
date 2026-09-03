import type { Jugador } from '../../types/jugador'
import { Carta } from '../Carta/Carta'
import './AbanicoCartas.css'

type Props = {
  jugadores: Jugador[]
  tamano?: number
  /** cartas de muestra, no propias: se ven apagadas */
  atenuado?: boolean
}

const ROTACIONES = [-10, 3, -3, 10, -6]
const DESPLAZAMIENTOS = [-18, 6, -6, 18, 0]

/** Vista previa de cartas abanicadas, para mosaicos de la pantalla de inicio. */
export function AbanicoCartas({ jugadores, tamano = 72, atenuado }: Props) {
  return (
    <div
      className={`abanico${atenuado ? ' abanico--atenuado' : ''}`}
      style={{ height: tamano * (486 / 330) + 24 }}
    >
      {jugadores.slice(0, 3).map((jugador, i) => (
        <div
          key={jugador.id}
          className="abanico__item"
          style={{
            transform: `translateX(${DESPLAZAMIENTOS[i]}px) rotate(${ROTACIONES[i]}deg)`,
            zIndex: i,
          }}
        >
          <Carta jugador={jugador} tamano={tamano} />
        </div>
      ))}
    </div>
  )
}
