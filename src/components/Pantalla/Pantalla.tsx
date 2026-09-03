import type { ReactNode } from 'react'
import escudo from '../../assets/marca/escudo_djm.png'
import { Moneda } from '../Moneda/Moneda'
import { useJuego } from '../../juego/useJuego'
import { obtenerRoster } from '../../juego/roster'
import './Pantalla.css'

type Props = {
  /** título de la pantalla; si falta, no se dibuja la fila de título (inicio) */
  titulo?: string
  onVolver?: () => void
  /** contenido a la derecha del título (contadores, orden, etc.) */
  accion?: ReactNode
  /** barra fija al pie, al estilo de la barra de búsqueda de MADFUT */
  pie?: ReactNode
  /** el contenido se ajusta al alto de la pantalla en vez de crecer y hacer scroll */
  sinScroll?: boolean
  children: ReactNode
}

export function Pantalla({ titulo, onVolver, accion, pie, sinScroll, children }: Props) {
  const { guardado } = useJuego()
  const distintas = Object.keys(guardado.coleccion).length

  return (
    <div className={`pantalla${pie ? ' pantalla--con-pie' : ''}${sinScroll ? ' pantalla--sin-scroll' : ''}`}>
      <header className="barra-estado">
        <img className="barra-estado__escudo" src={escudo} alt="DJM" />
        <span className="barra-estado__coleccion">
          Colección <strong>{distintas}</strong>/{obtenerRoster().length}
        </span>
        <span className="barra-estado__dato">
          <Moneda tamano={15} />
          {guardado.monedas.toLocaleString('es-CL')}
        </span>
      </header>

      {titulo && (
        <div className="pantalla__titulo">
          {onVolver && (
            <button type="button" className="pantalla__volver" onClick={onVolver} aria-label="Volver">
              ‹
            </button>
          )}
          <h1>{titulo}</h1>
          {accion && <div className="pantalla__accion">{accion}</div>}
        </div>
      )}

      <main className="pantalla__cuerpo">{children}</main>

      {pie && <footer className="barra-pie">{pie}</footer>}
    </div>
  )
}
