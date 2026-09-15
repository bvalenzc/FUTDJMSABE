import type { SlotFormacion } from '../config/juego'

export type Conexion = { a: number; b: number }

/** Cuántos "escalones" de distancia se enlazan desde cada posición. */
const VECINOS = 2
/** Dos distancias a menos de esto se tratan como la misma, para no romper la simetría. */
const TOLERANCIA = 0.75

/**
 * Une cada posición con las más cercanas de la formación. En vez de tomar
 * siempre "los 2 vecinos más próximos" (que con empates de distancia rompe la
 * simetría: si dos compañeros están a la misma distancia, un slice(0,2) se
 * queda con uno solo por el orden del array), agrupa las distancias en
 * "escalones" -por ejemplo, todas las que están a ~30 de la formación cuentan
 * como el mismo escalón- y conecta con TODOS los rivales de los dos escalones
 * más cercanos. Así una formación simétrica siempre tira líneas simétricas,
 * aunque una posición termine con más o menos de dos conexiones.
 */
export function conexionesDe(slots: SlotFormacion[]): Conexion[] {
  const vistas = new Set<string>()
  const salida: Conexion[] = []

  slots.forEach((slot, i) => {
    const distancias = slots
      .map((otro, j) => ({ j, d: Math.hypot(otro.x - slot.x, otro.y - slot.y) }))
      .filter((x) => x.j !== i)
      .sort((x, y) => x.d - y.d)

    const escalones: number[] = []
    distancias.forEach(({ d }) => {
      if (!escalones.some((e) => Math.abs(e - d) < TOLERANCIA)) escalones.push(d)
    })
    const corte = escalones[Math.min(VECINOS, escalones.length) - 1] ?? Infinity

    distancias
      .filter((x) => x.d <= corte + TOLERANCIA)
      .forEach(({ j }) => {
        const clave = i < j ? `${i}-${j}` : `${j}-${i}`
        if (vistas.has(clave)) return
        vistas.add(clave)
        salida.push({ a: Math.min(i, j), b: Math.max(i, j) })
      })
  })

  return salida
}
