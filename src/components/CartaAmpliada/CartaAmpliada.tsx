import type { Jugador } from '../../types/jugador'
import { Carta } from '../Carta/Carta'
import { useTilt } from './useTilt'
import './CartaAmpliada.css'

type Props = { jugador: Jugador; onCerrar: () => void }

/** Carta a pantalla completa con tilt 3D; tocarla en cualquier parte la cierra. */
export function CartaAmpliada({ jugador, onCerrar }: Props) {
  const { ref, alMoverPuntero, alSalirPuntero } = useTilt()

  return (
    <div className="carta-ampliada" onClick={onCerrar}>
      <div
        ref={ref}
        className="carta-ampliada__escenario"
        onPointerMove={alMoverPuntero}
        onPointerLeave={alSalirPuntero}
      >
        <Carta jugador={jugador} tamano={280} interactivo />
      </div>
    </div>
  )
}
