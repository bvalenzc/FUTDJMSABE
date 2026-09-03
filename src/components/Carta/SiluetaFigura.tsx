/** Silueta genérica de respaldo cuando el jugador todavía no tiene foto recortada. */
export function SiluetaFigura() {
  return (
    <svg className="carta__figura carta__figura--silueta" viewBox="0 0 210 268" xmlns="http://www.w3.org/2000/svg">
      <ellipse className="carta__fig-sombra" cx="105" cy="240" rx="92" ry="15" />
      <circle className="carta__fig-cuerpo" cx="105" cy="50" r="29" />
      <path
        className="carta__fig-cuerpo"
        d="M66 98 C66 78 84 66 105 66 C126 66 144 78 144 98
          L152 150 L160 232 L128 232 L118 154 L105 232 L92 154 L82 232 L50 232 L58 150 Z"
      />
      <path
        className="carta__fig-borde"
        d="M66 98 C66 78 84 66 105 66 C126 66 144 78 144 98
          L152 150 L160 232 L128 232 L118 154 L105 232 L92 154 L82 232 L50 232 L58 150 Z"
      />
    </svg>
  )
}
