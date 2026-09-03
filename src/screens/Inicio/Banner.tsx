import escudo from '../../assets/marca/escudo_djm.png'
import { obtenerFoto } from '../../assets/jugadores'
import { obtenerRoster, ordenadosPorMedia } from '../../juego/roster'
import './Banner.css'

type Props = { onClick: () => void }

/** Botón principal del inicio: entra al Draft. */
export function Banner({ onClick }: Props) {
  const estrella = ordenadosPorMedia(obtenerRoster()).find((j) => obtenerFoto(j.foto))
  const arte = obtenerFoto(estrella?.foto)

  return (
    <button type="button" className="banner" onClick={onClick}>
      <img className="banner__escudo" src={escudo} alt="" aria-hidden="true" />
      {arte && <img className="banner__figura" src={arte} alt="" aria-hidden="true" />}
      <div className="banner__velo" />

      <div className="banner__texto">
        <span className="eyebrow">Modo principal</span>
        <h1 className="banner__titulo">DJM DRAFT</h1>
        <span className="banner__sub">Armá tu XI con cartas al azar</span>
      </div>

    </button>
  )
}
