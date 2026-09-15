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

/** Capa extra de JUGADOR 8 D'OR: mismo guilloché dorado que Don Julio D'Or,
 *  pero con los acentos en rojo (no azul) para que combinen con su fondo
 *  granate y se note de entrada que es una rareza distinta. */
export function Capa8Dor() {
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

      <g className="carta__j8-rojo" fill="none" strokeWidth="0.8" opacity="0.5">
        <path d="M22 120 C42 150 42 200 22 230" />
        <path d="M308 120 C288 150 288 200 308 230" />
      </g>

      <g className="carta__djd-oro" fill="none" strokeWidth="1" opacity="0.8">
        <path d="M22 258 C40 268 40 288 22 298" />
        <path d="M308 258 C290 268 290 288 308 298" />
      </g>

      <g className="carta__djd-oro-f" opacity="0.85">
        <circle cx="22" cy="278" r="2.6" />
        <circle cx="308" cy="278" r="2.6" />
      </g>

      {/* galón rojo superior, la firma visual de "8 D'Or" */}
      <g className="carta__j8-rojo" fill="none" strokeWidth="1.4" opacity="0.85">
        <path d="M132 40 C148 30 182 30 198 40" />
        <path d="M140 46 C153 39 177 39 190 46" opacity="0.6" />
      </g>
      <g className="carta__j8-rojo-f" opacity="0.9">
        <circle cx="165" cy="33" r="3" />
        <circle cx="41" cy="36" r="1.6" />
        <circle cx="289" cy="36" r="1.6" />
      </g>
      <g className="carta__j8-rojo" fill="none" strokeWidth="1" strokeDasharray="1 3" opacity="0.6">
        <path d="M22 230 C34 240 34 250 22 258" />
        <path d="M308 230 C296 240 296 250 308 258" />
      </g>

      <g className="carta__djd-oro" fill="none" strokeWidth="1.2" opacity="0.85">
        <path d="M132 452 L165 442 L198 452" />
        <path d="M146 458 L165 452 L184 458" opacity="0.6" />
      </g>
    </svg>
  )
}
