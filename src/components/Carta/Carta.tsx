import type { Jugador, StatsArquero, StatsCampo } from '../../types/jugador'
import { calcularRareza, ENCUADRE_DEFECTO } from '../../config/rareza'
import { ETIQUETAS_ARQUERO, ETIQUETAS_CAMPO } from '../../config/statsLabels'
import { CLUB, FOOTER, SUB_CLUB } from '../../config/carta'
import { obtenerFoto, tieneRecorte } from '../../assets/jugadores'
import { posicionesAlternativas } from '../../juego/roster'
import { useAjusteNombre } from './useAjusteNombre'
import { SiluetaFigura } from './SiluetaFigura'
import { GrabadoSvg } from './GrabadoSvg'
import { OrnamentoSvg } from './OrnamentoSvg'
import { CapaParche } from './CapaParche'
import { CapaDjdor } from './CapaDjdor'
import { CapaFlashback } from './CapaFlashback'
import './Carta.css'

const ANCHO_BASE = 330
const ALTO_BASE = 486

type Props = {
  jugador: Jugador
  /** ancho objetivo en px; el resto de la carta escala proporcionalmente */
  tamano?: number
  /** habilita el tilt 3D al mover el puntero (solo vista de detalle) */
  interactivo?: boolean
  className?: string
}

export function Carta({ jugador, tamano = ANCHO_BASE, interactivo = false, className }: Props) {
  const rareza = calcularRareza(jugador)
  // Las cartas creadas en el panel de admin traen la imagen embebida.
  const foto = jugador.fotoUrl ?? obtenerFoto(jugador.foto)
  const encuadre = jugador.encuadre ?? ENCUADRE_DEFECTO
  const nombreRef = useAjusteNombre(jugador.nombre)

  const alternativas = posicionesAlternativas(jugador)
  const etiquetas = jugador.tipoStats === 'arquero' ? ETIQUETAS_ARQUERO : ETIQUETAS_CAMPO
  const stats = jugador.stats as StatsCampo & StatsArquero

  const escala = tamano / ANCHO_BASE

  return (
    <div
      className={`carta-marco${className ? ` ${className}` : ''}`}
      style={{ width: tamano, height: ALTO_BASE * escala }}
    >
      <div
        className={`carta carta--${interactivo ? 'interactiva' : 'estatica'}`}
        data-rareza={rareza}
        style={{ width: ANCHO_BASE, height: ALTO_BASE, transform: `scale(${escala})` }}
      >
        <GrabadoSvg />
        <div className="carta__textura" />
        {rareza === 'flashback' && <CapaFlashback />}

        {foto ? (
          <div
            className={`carta__figura carta__figura--foto${
              tieneRecorte(jugador.foto) || jugador.fotoUrl ? ' carta__figura--recortada' : ''
            }`}
          >
            <img
              src={foto}
              alt={jugador.nombre}
              style={{
                height: encuadre.alto,
                transform: `translate(calc(-50% + ${encuadre.x}px), ${encuadre.abajo}px)`,
              }}
            />
          </div>
        ) : (
          <SiluetaFigura />
        )}

        <div className="carta__scrim-arriba" />
        <div className="carta__scrim" />
        <div className="carta__foil" />
        {rareza === 'parche' && <CapaParche />}
        {rareza === 'djdor' && <CapaDjdor />}

        {alternativas.length > 0 && (
          <div className="carta__alternativas">
            {alternativas.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        )}

        <div className="carta__id">
          <div className="carta__rating">{jugador.media}</div>
          <div className="carta__pos">{jugador.posicion}</div>
          <div className="carta__id-regla" />
        </div>

        <div className="carta__club">
          <div className="carta__club-marca">{CLUB}</div>
          <div className="carta__club-sub">{SUB_CLUB}</div>
        </div>

        <div className="carta__nombre">
          <span className="carta__nombre-apellido" ref={nombreRef}>
            {jugador.nombre}
          </span>
        </div>

        <svg
          className="carta__nombre-regla"
          viewBox="0 0 270 8"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className="carta__nr" fill="none" strokeWidth="1" strokeOpacity="0.9">
            <line x1="0" y1="4" x2="112" y2="4" />
            <line x1="158" y1="4" x2="270" y2="4" />
          </g>
          <path className="carta__nrf" d="M120 4 L128 0 L136 4 L128 8 Z" opacity="0.8" />
          <path className="carta__nrf" d="M134 4 L142 0 L150 4 L142 8 Z" opacity="0.45" />
        </svg>

        <div className="carta__stats">
          {etiquetas.map(([clave, etiqueta]) => (
            <div className="carta__stat" key={clave}>
              <div className="carta__stat-valor">{stats[clave]}</div>
              <div className="carta__stat-etiqueta">{etiqueta}</div>
            </div>
          ))}
        </div>

        <div className="carta__footer">{FOOTER}</div>

        <OrnamentoSvg />
      </div>
    </div>
  )
}
