import { useState } from 'react'
import { CATALOGO_SOBRES, sobrePorId, type Sobre } from '../../config/juego'
import { useJuego } from '../../juego/useJuego'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { Moneda } from '../../components/Moneda/Moneda'
import './Tienda.css'

type Props = {
  onVolver: () => void
  onAbrirSobre: (sobreId: string) => void
}

export function Tienda({ onVolver, onAbrirSobre }: Props) {
  const { guardado, gastarMonedas, agregarSobres } = useJuego()
  const [pestana, setPestana] = useState<'tienda' | 'mis-sobres'>('tienda')
  const [aviso, setAviso] = useState<string | null>(null)

  const comprar = (sobre: Sobre) => {
    if (!gastarMonedas(sobre.precio)) {
      setAviso('No te alcanzan las ÑUENDE COINS')
      window.setTimeout(() => setAviso(null), 1800)
      return
    }
    agregarSobres(sobre.id, 1)
    setPestana('mis-sobres')
  }

  const misSobres = Object.entries(guardado.misSobres).filter(([, n]) => n > 0)

  return (
    <Pantalla titulo="Tienda" onVolver={onVolver}>

      <div className="tienda__pestanas">
        <button type="button" className={`pestana${pestana === 'tienda' ? ' activa' : ''}`} onClick={() => setPestana('tienda')}>
          Sobres
        </button>
        <button
          type="button"
          className={`pestana${pestana === 'mis-sobres' ? ' activa' : ''}`}
          onClick={() => setPestana('mis-sobres')}
        >
          Mis sobres ({misSobres.reduce((s, [, n]) => s + n, 0)})
        </button>
      </div>

      {pestana === 'tienda' && (
        <div className="tienda__lista">
          {CATALOGO_SOBRES.map((sobre) => (
            <article key={sobre.id} className={`sobre-item sobre-item--${sobre.tema}`}>
              <div className="sobre-item__arte">
                <span className="sobre-item__cartas">{sobre.cartas}</span>
                <span className="sobre-item__cartas-txt">cartas</span>
              </div>
              <div className="sobre-item__info">
                <h2>{sobre.nombre}</h2>
                <p>{sobre.cartas} cartas por sobre</p>
              </div>
              <button
                type="button"
                className="sobre-item__comprar"
                disabled={guardado.monedas < sobre.precio}
                onClick={() => comprar(sobre)}
              >
                <Moneda tamano={13} />
                {sobre.precio.toLocaleString('es-CL')}
              </button>
            </article>
          ))}
        </div>
      )}

      {pestana === 'mis-sobres' && (
        <div className="tienda__lista">
          {misSobres.length === 0 && <p className="tienda__vacio">Todavía no tenés sobres sin abrir.</p>}
          {misSobres.map(([sobreId, cantidad]) => {
            const sobre = sobrePorId(sobreId)
            if (!sobre) return null
            return (
              <article key={sobreId} className={`sobre-item sobre-item--${sobre.tema}`}>
                <div className="sobre-item__arte">
                  <span className="sobre-item__cartas">×{cantidad}</span>
                </div>
                <div className="sobre-item__info">
                  <h2>{sobre.nombre}</h2>
                  <p>{sobre.cartas} cartas por sobre</p>
                </div>
                <button type="button" className="sobre-item__comprar" onClick={() => onAbrirSobre(sobreId)}>
                  ABRIR
                </button>
              </article>
            )
          })}
        </div>
      )}

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </Pantalla>
  )
}

