/** Marco triple + filigrana de esquina + remates superior/inferior. Igual en las 8 rarezas, coloreado por tema. */
export function OrnamentoSvg() {
  return (
    <svg className="carta__ornamento" viewBox="0 0 330 486" xmlns="http://www.w3.org/2000/svg">
      <g className="carta__o-oscuro" fill="none" opacity="0.62">
        <rect x="9" y="9" width="312" height="468" strokeWidth="1.6" />
        <rect x="14.5" y="14.5" width="301" height="457" strokeWidth="0.7" opacity="0.7" />
      </g>
      <g className="carta__o-claro" fill="none" opacity="0.45">
        <rect x="11.5" y="11.5" width="307" height="463" strokeWidth="0.7" />
      </g>

      <g className="carta__o-oscuro" fill="none" strokeWidth="1.15" opacity="0.7">
        <g>
          <path d="M15 46 C15 28 28 15 46 15" />
          <path d="M15 60 C15 32 32 15 60 15" />
          <path d="M24 44 C24 33 33 24 44 24 C50 24 54 28 54 33 C54 38 50 41 46 41 C43 41 41 39 41 36" />
        </g>
        <g transform="translate(330,0) scale(-1,1)">
          <path d="M15 46 C15 28 28 15 46 15" />
          <path d="M15 60 C15 32 32 15 60 15" />
          <path d="M24 44 C24 33 33 24 44 24 C50 24 54 28 54 33 C54 38 50 41 46 41 C43 41 41 39 41 36" />
        </g>
      </g>
      <circle className="carta__fd" cx="41" cy="36" r="2.1" opacity="0.7" />
      <circle className="carta__fd" cx="289" cy="36" r="2.1" opacity="0.7" />

      <g className="carta__o-claro" fill="none" strokeWidth="1.15" opacity="0.45">
        <g transform="translate(0,486) scale(1,-1)">
          <path d="M15 46 C15 28 28 15 46 15" />
          <path d="M15 60 C15 32 32 15 60 15" />
          <path d="M24 44 C24 33 33 24 44 24 C50 24 54 28 54 33 C54 38 50 41 46 41 C43 41 41 39 41 36" />
        </g>
        <g transform="translate(330,486) scale(-1,-1)">
          <path d="M15 46 C15 28 28 15 46 15" />
          <path d="M15 60 C15 32 32 15 60 15" />
          <path d="M24 44 C24 33 33 24 44 24 C50 24 54 28 54 33 C54 38 50 41 46 41 C43 41 41 39 41 36" />
        </g>
      </g>

      <g className="carta__o-oscuro" fill="none" strokeWidth="1.1" opacity="0.55">
        <path d="M143 17 C152 10 178 10 187 17" />
        <path d="M150 20 C158 14 172 14 180 20" />
      </g>
      <circle className="carta__fd" cx="165" cy="12.5" r="2.4" opacity="0.55" />

      <g className="carta__o-claro" fill="none" strokeWidth="1" opacity="0.42">
        <path d="M143 469 C152 476 178 476 187 469" />
        <path d="M150 466 C158 472 172 472 180 466" />
      </g>
      <circle className="carta__fl" cx="165" cy="473.5" r="2.2" opacity="0.42" />
    </svg>
  )
}
