import './BuscadorPie.css'

type Props = {
  valor: string
  onCambio: (texto: string) => void
  total: number
}

/** Barra inferior con buscador, como la de la lista de jugadores de MADFUT. */
export function BuscadorPie({ valor, onCambio, total }: Props) {
  return (
    <>
      <label className="buscador">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 L21 21" />
        </svg>
        <input
          type="search"
          value={valor}
          placeholder="Buscar jugador…"
          onChange={(e) => onCambio(e.target.value)}
          aria-label="Buscar jugador"
        />
        {valor && (
          <button type="button" onClick={() => onCambio('')} aria-label="Limpiar búsqueda">
            ×
          </button>
        )}
      </label>
      <span className="buscador__total">{total}</span>
    </>
  )
}
