/** Máscaras SVG compartidas por todas las cartas. Se monta una sola vez en la raíz de la app. */
export function CartaDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="carta-burst-fade" cx="50%" cy="30%" r="62%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="carta-burst-mask">
          <rect width="330" height="486" fill="url(#carta-burst-fade)" />
        </mask>

        <linearGradient id="carta-fb-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="45%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.25" />
        </linearGradient>
        <mask id="carta-fb-mask">
          <rect width="330" height="486" fill="url(#carta-fb-fade)" />
        </mask>
      </defs>
    </svg>
  )
}
