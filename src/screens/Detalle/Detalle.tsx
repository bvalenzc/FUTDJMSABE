import type { Jugador } from '../../types/jugador'
import { CartaAmpliada } from '../../components/CartaAmpliada/CartaAmpliada'

type Props = {
  jugador: Jugador
  onVolver: () => void
}

export function Detalle({ jugador, onVolver }: Props) {
  return <CartaAmpliada jugador={jugador} onCerrar={onVolver} />
}
