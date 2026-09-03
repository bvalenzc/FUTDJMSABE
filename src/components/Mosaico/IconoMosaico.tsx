import './IconoMosaico.css'

export type ClaveIcono = 'packs' | 'equipo' | 'tienda' | 'cartas' | 'mercado' | 'sbc'

/** Emblema de cada botón del menú: línea dorada sobre un disco grabado. */
export function IconoMosaico({ clave }: { clave: ClaveIcono }) {
  return (
    <span className="icono-mosaico">
      <svg viewBox="0 0 64 64" fill="none" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        {DIBUJOS[clave]}
      </svg>
    </span>
  )
}

const DIBUJOS: Record<ClaveIcono, React.ReactNode> = {
  // Sobre cerrado con destello: lo que abrís
  packs: (
    <>
      <rect x="17" y="13" width="30" height="40" rx="4" />
      <path d="M17 27h30" />
      <path d="M32 13v14" />
      <path d="M32 34v10 M27 39h10" />
      <path d="M12 20l-4-3 M52 20l4-3 M12 46l-4 3 M52 46l4 3" opacity="0.55" />
    </>
  ),
  // Escudo con estrella: tu colección
  equipo: (
    <>
      <path d="M32 9 L52 16.5v16.8C52 45.4 43 51.6 32 55c-11-3.4-20-9.6-20-21.7V16.5z" />
      <path d="M32 22.5l3.4 6.9 7.6 1.1-5.5 5.4 1.3 7.6L32 39.9l-6.8 3.6 1.3-7.6-5.5-5.4 7.6-1.1z" />
    </>
  ),
  // Bolsa de compras con moneda
  tienda: (
    <>
      <path d="M15 23h34l3.5 26.5A4.5 4.5 0 0 1 48 55H16a4.5 4.5 0 0 1-4.5-5.5z" />
      <path d="M24 23v-4.5a8 8 0 0 1 16 0V23" />
      <circle cx="32" cy="39" r="6.5" />
      <path d="M32 34.5v9 M29 37h6 M29 41h6" />
    </>
  ),
  // Cartas abanicadas
  cartas: (
    <>
      <rect x="9" y="19" width="19" height="27" rx="3" transform="rotate(-13 18.5 32.5)" />
      <rect x="45" y="19" width="19" height="27" rx="3" transform="rotate(13 54.5 32.5)" />
      <rect x="22.5" y="15" width="19" height="29" rx="3" />
      <path d="M27 22h10 M27 27h6" opacity="0.6" />
    </>
  ),
  // Monedas apiladas con flecha de venta
  mercado: (
    <>
      <ellipse cx="24" cy="20" rx="13" ry="5.5" />
      <path d="M11 20v7.5c0 3 5.8 5.5 13 5.5s13-2.5 13-5.5V20" />
      <path d="M11 33v7.5c0 3 5.8 5.5 13 5.5s13-2.5 13-5.5V33" />
      <path d="M43 42h9 M47.5 37.5 52 42l-4.5 4.5" />
    </>
  ),
  // Dos piezas de puzzle encajando
  sbc: (
    <>
      <path d="M12 14h15.5a4.5 4.5 0 1 1 9 0H52v15.5a4.5 4.5 0 1 0 0 9V54H36.5a4.5 4.5 0 1 0-9 0H12V38.5a4.5 4.5 0 1 1 0-9z" />
    </>
  ),
}
