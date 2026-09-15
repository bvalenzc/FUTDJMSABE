/** Laurel de 52 hojas: arcos izquierdo y derecho alrededor del guilloché. */
function laurel(cx: number, cy: number, r: number) {
  const hojas: { x: number; y: number; rot: number }[] = []
  for (let i = 0; i < 26; i++) {
    const t = -0.3 + (i / 25) * 0.6
    const a = Math.PI + t * Math.PI
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    const rot = (a * 180) / Math.PI + 90
    hojas.push({ x, y, rot })
    hojas.push({ x: cx - Math.cos(a) * r, y, rot: -rot })
  }
  return hojas
}

const HOJAS_GRIS = laurel(165, 152, 117)
const HOJAS_ORO = laurel(165, 152, 112)

/** Capa extra de la carta ICONO OJALÁ: laurel doble gris/dorado y una gema tallada arriba. */
export function CapaIcono() {
  return (
    <svg className="carta__capa-fg" viewBox="0 0 330 486" xmlns="http://www.w3.org/2000/svg">
      <g className="carta__icon-gris-f" opacity="0.26">
        {HOJAS_GRIS.map((h, i) => (
          <ellipse
            key={i}
            cx={h.x.toFixed(1)}
            cy={h.y.toFixed(1)}
            rx="3.4"
            ry="8.2"
            transform={`rotate(${h.rot.toFixed(1)} ${h.x.toFixed(1)} ${h.y.toFixed(1)})`}
          />
        ))}
      </g>
      <g className="carta__icon-oro-f" opacity="0.62">
        {HOJAS_ORO.map((h, i) => (
          <ellipse
            key={i}
            cx={h.x.toFixed(1)}
            cy={h.y.toFixed(1)}
            rx="3.4"
            ry="8.2"
            transform={`rotate(${h.rot.toFixed(1)} ${h.x.toFixed(1)} ${h.y.toFixed(1)})`}
          />
        ))}
      </g>

      <g className="carta__icon-oro" fill="none" opacity="0.8">
        <circle cx="165" cy="152" r="122" strokeWidth="0.8" />
        <circle cx="165" cy="152" r="127" strokeWidth="0.4" opacity="0.5" />
      </g>

      <g className="carta__icon-gris" fill="none" strokeWidth="0.8" opacity="0.42">
        <path d="M22 120 C42 150 42 200 22 230" />
        <path d="M308 120 C288 150 288 200 308 230" />
      </g>

      <g className="carta__icon-oro" fill="none" strokeWidth="1" opacity="0.8">
        <path d="M22 258 C40 268 40 288 22 298" />
        <path d="M308 258 C290 268 290 288 308 298" />
      </g>

      <g className="carta__icon-oro-f" opacity="0.85">
        <circle cx="22" cy="278" r="2.6" />
        <circle cx="308" cy="278" r="2.6" />
      </g>

      <g className="carta__icon-gris-f" opacity="0.55">
        <circle cx="22" cy="120" r="1.8" />
        <circle cx="308" cy="120" r="1.8" />
        <circle cx="22" cy="230" r="1.8" />
        <circle cx="308" cy="230" r="1.8" />
      </g>

      {/* gema tallada, remate superior */}
      <g className="carta__icon-gris-f" opacity="0.3">
        <path d="M167 10 L182 23 L167 36 L152 23 Z" />
      </g>
      <g className="carta__icon-oro" fill="none" strokeWidth="1.3" strokeLinejoin="round" opacity="0.9">
        <path d="M165 8 L180 21 L165 34 L150 21 Z" />
        <path d="M150 21 L180 21 M165 8 L165 34" />
      </g>

      <g className="carta__icon-oro" fill="none" strokeWidth="1.2" opacity="0.85">
        <path d="M132 452 L165 442 L198 452" />
        <path d="M146 458 L165 452 L184 458" opacity="0.55" />
      </g>
    </svg>
  )
}
