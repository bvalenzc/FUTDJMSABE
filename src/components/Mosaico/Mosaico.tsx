import type { ReactNode } from 'react'
import './Mosaico.css'

type Props = {
  titulo: string
  children: ReactNode
  /** píldora arriba a la izquierda: contadores, "gratis", estado */
  etiqueta?: string
  onClick: () => void
}

export function Mosaico({ titulo, children, etiqueta, onClick }: Props) {
  return (
    <button type="button" className="mosaico" onClick={onClick}>
      <div className="mosaico__preview">{children}</div>
      {etiqueta && <span className="mosaico__etiqueta">{etiqueta}</span>}
      <span className="mosaico__titulo">{titulo}</span>
    </button>
  )
}
