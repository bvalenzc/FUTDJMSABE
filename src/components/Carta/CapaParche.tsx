/** Capa extra de la carta PARCHE: costura punteada, filigrana roja, muescas y galón. */
export function CapaParche() {
  return (
    <svg className="carta__capa-fg" viewBox="0 0 330 486" xmlns="http://www.w3.org/2000/svg">
      <g className="carta__pch-roja" fill="none" strokeWidth="1" strokeDasharray="4 5" opacity="0.6">
        <rect x="19" y="19" width="292" height="448" />
        <rect x="23" y="23" width="284" height="440" strokeDasharray="2 6" opacity="0.5" />
      </g>

      <g className="carta__pch-roja" fill="none" strokeWidth="0.9" opacity="0.5">
        <g transform="translate(2,2)">
          <path d="M24 44 C24 33 33 24 44 24 C50 24 54 28 54 33 C54 38 50 41 46 41 C43 41 41 39 41 36" />
        </g>
        <g transform="translate(328,2) scale(-1,1)">
          <path d="M24 44 C24 33 33 24 44 24 C50 24 54 28 54 33 C54 38 50 41 46 41 C43 41 41 39 41 36" />
        </g>
      </g>

      <g className="carta__pch-roja-f" opacity="0.85">
        <circle cx="41" cy="36" r="2.3" />
        <circle cx="289" cy="36" r="2.3" />
        <circle cx="41" cy="450" r="2.3" />
        <circle cx="289" cy="450" r="2.3" />
      </g>

      <g className="carta__pch-roja-f" opacity="0.9">
        <rect x="30" y="126" width="30" height="3" />
        <rect x="63" y="126" width="8" height="3" opacity="0.5" />
      </g>

      <g className="carta__pch-roja-f" opacity="0.75">
        <path d="M9 196 L18 202 L9 208 Z" />
        <path d="M321 196 L312 202 L321 208 Z" />
        <path d="M9 250 L18 256 L9 262 Z" opacity="0.6" />
        <path d="M321 250 L312 256 L321 262 Z" opacity="0.6" />
      </g>

      <g className="carta__pch-roja" fill="none" strokeWidth="1.4" opacity="0.8">
        <path d="M152 21 L165 15 L178 21" />
      </g>
      <g className="carta__pch-roja-f" opacity="0.85">
        <circle cx="165" cy="12.5" r="1.6" />
      </g>

      <g className="carta__pch-roja" fill="none" strokeWidth="0.9" strokeDasharray="3 4" opacity="0.45">
        <line x1="22" y1="352" x2="22" y2="440" />
        <line x1="308" y1="352" x2="308" y2="440" />
      </g>

      <g className="carta__pch-roja-f" opacity="0.6">
        <rect x="128" y="466" width="74" height="1.6" />
      </g>
      <g className="carta__pch-roja" fill="none" strokeWidth="1" opacity="0.55">
        <path d="M146 462 C154 468 176 468 184 462" />
      </g>
    </svg>
  )
}
