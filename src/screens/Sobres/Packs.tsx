import { SOBRE_GRATIS } from '../../config/juego'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { AperturaSobre } from './AperturaSobre'

type Props = { onVolver: () => void }

/** Pack gratis e infinito. */
export function Packs({ onVolver }: Props) {
  return (
    <Pantalla titulo="Packs" onVolver={onVolver}>
      <AperturaSobre sobre={SOBRE_GRATIS} textoBoton="ABRIR PACK GRATIS" />
    </Pantalla>
  )
}
