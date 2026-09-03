import type { ReactElement } from 'react'
import type { Jugador } from '../../types/jugador'
import { posicionesDe } from '../../juego/roster'
import './FiltrosPosicion.css'

export type GrupoPosicion = 'todos' | 'arq' | 'def' | 'medio' | 'ata'

const GRUPOS: { id: GrupoPosicion; etiqueta: string; posiciones: string[] }[] = [
  { id: 'todos', etiqueta: 'Todo', posiciones: [] },
  { id: 'arq', etiqueta: 'Arq', posiciones: ['ARQ'] },
  { id: 'def', etiqueta: 'Def', posiciones: ['DFC', 'LI', 'LD'] },
  { id: 'medio', etiqueta: 'Medio', posiciones: ['MCD', 'MC', 'MCO', 'MI', 'MD'] },
  { id: 'ata', etiqueta: 'Ata', posiciones: ['DC'] },
]

export function cumpleGrupo(jugador: Jugador, grupo: GrupoPosicion): boolean {
  if (grupo === 'todos') return true
  const definicion = GRUPOS.find((g) => g.id === grupo)
  if (!definicion) return true
  return posicionesDe(jugador).some((p) => definicion.posiciones.includes(p))
}

type Props = {
  valor: GrupoPosicion
  onCambio: (grupo: GrupoPosicion) => void
}

/** Fila de filtros circulares, al estilo de la barra de categorías de MADFUT. */
export function FiltrosPosicion({ valor, onCambio }: Props) {
  return (
    <div className="filtros-pos" role="group" aria-label="Filtrar por posición">
      {GRUPOS.map((g) => (
        <button
          key={g.id}
          type="button"
          className={`filtros-pos__boton${valor === g.id ? ' activo' : ''}`}
          onClick={() => onCambio(g.id)}
          aria-pressed={valor === g.id}
        >
          <Icono grupo={g.id} />
          <span>{g.etiqueta}</span>
        </button>
      ))}
    </div>
  )
}

function Icono({ grupo }: { grupo: GrupoPosicion }) {
  const trazos: Record<GrupoPosicion, ReactElement> = {
    todos: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    arq: (
      <>
        <path d="M3 9 V5 h18 v4" />
        <path d="M3 9 v10 h18 V9" />
        <path d="M8 9 v10 M16 9 v10 M3 14 h18" />
      </>
    ),
    def: (
      <>
        <path d="M12 3 L20 6 v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" />
      </>
    ),
    medio: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5 v17 M3.5 12 h17" />
      </>
    ),
    ata: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5 l3.2 2.4-1.2 3.9h-4l-1.2-3.9z" />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      {trazos[grupo]}
    </svg>
  )
}
