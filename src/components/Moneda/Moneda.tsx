import escudo from '../../assets/marca/escudo_djm.png'
import './Moneda.css'

type Props = {
  /** diámetro en px */
  tamano?: number
}

/** ÑUENDE COIN: moneda dorada con el escudo del equipo en el centro. */
export function Moneda({ tamano = 16 }: Props) {
  return (
    <span className="moneda" style={{ width: tamano, height: tamano }} aria-hidden="true">
      <img src={escudo} alt="" />
    </span>
  )
}
