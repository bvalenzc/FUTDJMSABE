/** Barra 3D biselada: cara clara + reborde + sombra desplazada, como una franja de cinta. */
function barra3d(x1: number, y1: number, x2: number, y2: number, ancho: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const largo = Math.hypot(dx, dy)
  const nx = (-dy / largo) * ancho
  const ny = (dx / largo) * ancho
  const p1 = `${(x1 + nx).toFixed(1)},${(y1 + ny).toFixed(1)}`
  const p2 = `${(x2 + nx).toFixed(1)},${(y2 + ny).toFixed(1)}`
  const p3 = `${(x2 - nx).toFixed(1)},${(y2 - ny).toFixed(1)}`
  const p4 = `${(x1 - nx).toFixed(1)},${(y1 - ny).toFixed(1)}`
  const dsx = 3
  const dsy = 4
  const s1 = `${(x1 + dsx + nx).toFixed(1)},${(y1 + dsy + ny).toFixed(1)}`
  const s2 = `${(x2 + dsx + nx).toFixed(1)},${(y2 + dsy + ny).toFixed(1)}`
  const s3 = `${(x2 + dsx - nx).toFixed(1)},${(y2 + dsy - ny).toFixed(1)}`
  const s4 = `${(x1 + dsx - nx).toFixed(1)},${(y1 + dsy - ny).toFixed(1)}`
  return { cara: `${p1} ${p2} ${p3} ${p4}`, sombra: `${s1} ${s2} ${s3} ${s4}` }
}

const BARRAS = [
  barra3d(18, 66, 74, 22, 7),
  barra3d(30, 88, 86, 44, 4.5),
  barra3d(256, 464, 312, 420, 7),
  barra3d(244, 442, 300, 398, 4.5),
]

/** Capa extra de la carta FAIRPLAY: barras 3D biseladas en las esquinas. */
export function CapaFairplay() {
  return (
    <svg className="carta__capa-fg" viewBox="0 0 330 486" xmlns="http://www.w3.org/2000/svg">
      {BARRAS.map((b, i) => (
        <g key={i}>
          <polygon className="carta__fp-negro-f" opacity="0.45" points={b.sombra} />
          <polygon className="carta__fp-lavanda-f" opacity="0.85" points={b.cara} />
          <polygon className="carta__fp-negro" fill="none" strokeWidth="1" opacity="0.75" points={b.cara} />
        </g>
      ))}

      <g className="carta__fp-negro" fill="none" strokeWidth="1" opacity="0.4">
        <line x1="165" y1="66" x2="165" y2="146" />
        <line x1="24" y1="352" x2="24" y2="438" />
        <line x1="306" y1="352" x2="306" y2="438" />
      </g>

      <g className="carta__fp-negro" fill="none" strokeWidth="1.3" strokeLinejoin="round" opacity="0.65">
        <path d="M140 32 L165 16 L190 32" />
        <path d="M140 462 L165 476 L190 462" opacity="0.55" />
      </g>

      <g className="carta__fp-negro-f" opacity="0.75">
        <circle cx="165" cy="16" r="2" />
      </g>
    </svg>
  )
}
