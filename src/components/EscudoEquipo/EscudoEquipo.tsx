import type { EquipoLiga } from '../../config/liga'
import escudoDjm from '../../assets/marca/escudo_djm.png'
import './EscudoEquipo.css'

const COLORES = ['#7c5cff', '#4fb3d9', '#e8965a', '#5cc98a', '#d95c7a', '#c9a24b', '#5c8fd9', '#a45cd9']

/** Color estable para el escudo genérico, sacado del id del equipo. */
function colorDe(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return COLORES[hash % COLORES.length]
}

/** Iniciales del nombre, sin contar conectores cortos. */
function inicialesDe(nombre: string): string {
  const palabras = nombre.replace(/[…+.]/g, '').trim().split(/\s+/)
  const relevantes = palabras.filter((p) => p.length > 2 || palabras.length === 1)
  const elegidas = (relevantes.length ? relevantes : palabras).slice(0, 2)
  return elegidas.map((p) => p[0]).join('').toUpperCase()
}

type Props = { equipo: EquipoLiga; tamano?: number }

/** Escudo del equipo: el real para DJM, uno genérico con iniciales para el resto. */
export function EscudoEquipo({ equipo, tamano = 32 }: Props) {
  if (equipo.esDjm) {
    return (
      <img
        className="escudo-equipo escudo-equipo--djm"
        src={escudoDjm}
        alt={equipo.nombre}
        style={{ width: tamano, height: tamano }}
      />
    )
  }

  return (
    <span
      className="escudo-equipo escudo-equipo--generico"
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.38, background: colorDe(equipo.id) }}
      title={equipo.nombre}
    >
      {inicialesDe(equipo.nombre)}
    </span>
  )
}
