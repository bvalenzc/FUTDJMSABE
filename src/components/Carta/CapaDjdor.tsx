/** Laurel dorado de 52 hojas: arcos izquierdo y derecho alrededor del guilloché. */
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

const HOJAS = laurel(165, 152, 112)

/** Capa extra de la carta DON JULIO D'OR. */
export function CapaDjdor() {
  return (
    <svg className="carta__capa-fg" viewBox="0 0 330 486" xmlns="http://www.w3.org/2000/svg">
      <g className="carta__djd-oro-f" opacity="0.55">
        {HOJAS.map((h, i) => (
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

      <g className="carta__djd-oro" fill="none" opacity="0.75">
        <circle cx="165" cy="152" r="122" strokeWidth="0.8" />
        <circle cx="165" cy="152" r="127" strokeWidth="0.4" opacity="0.6" />
      </g>

      <g className="carta__djd-azul" fill="none" strokeWidth="0.8" opacity="0.5">
        <path d="M22 120 C42 150 42 200 22 230" />
        <path d="M308 120 C288 150 288 200 308 230" />
        <path d="M27 120 C47 150 47 200 27 230" opacity="0.5" />
        <path d="M303 120 C283 150 283 200 303 230" opacity="0.5" />
      </g>

      <g className="carta__djd-oro" fill="none" strokeWidth="1" opacity="0.8">
        <path d="M22 258 C40 268 40 288 22 298" />
        <path d="M308 258 C290 268 290 288 308 298" />
      </g>

      <g className="carta__djd-oro-f" opacity="0.85">
        <circle cx="22" cy="278" r="2.6" />
        <circle cx="308" cy="278" r="2.6" />
      </g>

      <g className="carta__djd-azul-f" opacity="0.7">
        <circle cx="22" cy="120" r="1.8" />
        <circle cx="308" cy="120" r="1.8" />
        <circle cx="22" cy="230" r="1.8" />
        <circle cx="308" cy="230" r="1.8" />
      </g>

      <g className="carta__djd-oro" fill="none" strokeWidth="1.2" opacity="0.85">
        <path d="M132 452 L165 442 L198 452" />
        <path d="M146 458 L165 452 L184 458" opacity="0.6" />
      </g>
    </svg>
  )
}
