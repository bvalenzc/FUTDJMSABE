import type { Jugador } from '../../types/jugador'
import { Carta } from '../../components/Carta/Carta'
import { useTilt } from './useTilt'
import './Detalle.css'

type Props = {
  jugador: Jugador
  onVolver: () => void
}

export function Detalle({ jugador, onVolver }: Props) {
  const { ref, alMoverPuntero, alSalirPuntero } = useTilt()

  return (
    <div className="detalle">
      <button type="button" className="detalle__volver" onClick={onVolver} aria-label="Volver">
        ‹
      </button>

      <div
        ref={ref}
        className="detalle__escenario"
        onPointerMove={alMoverPuntero}
        onPointerLeave={alSalirPuntero}
      >
        <Carta jugador={jugador} tamano={280} interactivo />
      </div>
    </div>
  )
}
