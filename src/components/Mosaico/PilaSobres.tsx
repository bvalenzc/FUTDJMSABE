import './PilaSobres.css'

type Props = {
  /** Pila del pack gratis: los tres sobres en blanco y negro. */
  soloBlanco?: boolean
}

const COLOR = ['oro', 'azul', 'verde'] as const
const BLANCO = ['mono', 'mono', 'mono'] as const

export function PilaSobres({ soloBlanco }: Props) {
  const temas = soloBlanco ? BLANCO : COLOR

  return (
    <div className="pila-sobres">
      {temas.map((tema, i) => (
        <span
          key={i}
          className={`pila-sobres__sobre pila-sobres__sobre--${tema}`}
          style={{ transform: `rotate(${(i - 1) * 8}deg) translateX(${(i - 1) * 20}px)`, zIndex: i === 1 ? 3 : i }}
        />
      ))}
    </div>
  )
}
