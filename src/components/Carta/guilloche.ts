/** Rayos del guilloché grabado: 34 líneas radiales desde el centro. Ver README_cartas_djm.md §2. */
export function rayosGrabado(): { x2: number; y2: number }[] {
  const rayos: { x2: number; y2: number }[] = []
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 - Math.PI / 2
    rayos.push({ x2: Number((Math.cos(a) * 330).toFixed(1)), y2: Number((Math.sin(a) * 330).toFixed(1)) })
  }
  return rayos
}
