import type { SlotFormacion } from '../config/juego'

export type Conexion = { a: number; b: number }

/** Cuántos vecinos se enlazan desde cada posición. */
const VECINOS = 2

/**
 * Une cada posición con las más cercanas de la formación. Cada slot tira una
 * línea a sus dos vecinos más próximos y los pares repetidos se descartan, así
 * la cancha queda con una red limpia en vez de un enredo de líneas.
 */
export function conexionesDe(slots: SlotFormacion[]): Conexion[] {
  const vistas = new Set<string>()
  const salida: Conexion[] = []

  slots.forEach((slot, i) => {
    const cercanos = slots
      .map((otro, j) => ({ j, d: Math.hypot(otro.x - slot.x, otro.y - slot.y) }))
      .filter((x) => x.j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, VECINOS)

    cercanos.forEach(({ j }) => {
      const clave = i < j ? `${i}-${j}` : `${j}-${i}`
      if (vistas.has(clave)) return
      vistas.add(clave)
      salida.push({ a: Math.min(i, j), b: Math.max(i, j) })
    })
  })

  return salida
}
