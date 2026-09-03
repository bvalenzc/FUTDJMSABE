/** Reglas del juego, portadas del FUTDJM original. Todo lo ajustable vive acá. */

export type SlotFormacion = { role: string; x: number; y: number }

export const FORMACIONES: Record<string, SlotFormacion[]> = {
  '1-2-3-1': [
    { role: 'ARQ', x: 50, y: 90 },
    { role: 'DFC', x: 30, y: 68 },
    { role: 'DFC', x: 70, y: 68 },
    { role: 'MI', x: 20, y: 42 },
    { role: 'MC', x: 50, y: 42 },
    { role: 'MD', x: 80, y: 42 },
    { role: 'DC', x: 50, y: 14 },
  ],
  '1-2-3-1 (ATA)': [
    { role: 'ARQ', x: 50, y: 90 },
    { role: 'DFC', x: 30, y: 68 },
    { role: 'DFC', x: 70, y: 68 },
    { role: 'MI', x: 20, y: 42 },
    { role: 'MCO', x: 50, y: 42 },
    { role: 'MD', x: 80, y: 42 },
    { role: 'DC', x: 50, y: 14 },
  ],
  '1-2-3-1 (DEF)': [
    { role: 'ARQ', x: 50, y: 90 },
    { role: 'DFC', x: 30, y: 68 },
    { role: 'DFC', x: 70, y: 68 },
    { role: 'MI', x: 20, y: 42 },
    { role: 'MCD', x: 50, y: 42 },
    { role: 'MD', x: 80, y: 42 },
    { role: 'DC', x: 50, y: 14 },
  ],
  '1-3-2-1': [
    { role: 'ARQ', x: 50, y: 90 },
    { role: 'LI', x: 15, y: 68 },
    { role: 'DFC', x: 50, y: 68 },
    { role: 'LD', x: 85, y: 68 },
    { role: 'MC', x: 35, y: 42 },
    { role: 'MC', x: 65, y: 42 },
    { role: 'DC', x: 50, y: 14 },
  ],
  '1-2-2-2': [
    { role: 'ARQ', x: 50, y: 90 },
    { role: 'DFC', x: 30, y: 68 },
    { role: 'DFC', x: 70, y: 68 },
    { role: 'MC', x: 35, y: 42 },
    { role: 'MC', x: 65, y: 42 },
    { role: 'DC', x: 35, y: 14 },
    { role: 'DC', x: 65, y: 14 },
  ],
  '1-3-1-2': [
    { role: 'ARQ', x: 50, y: 90 },
    { role: 'LI', x: 15, y: 68 },
    { role: 'DFC', x: 50, y: 68 },
    { role: 'LD', x: 85, y: 68 },
    { role: 'MC', x: 50, y: 42 },
    { role: 'DC', x: 35, y: 14 },
    { role: 'DC', x: 65, y: 14 },
  ],
}

/** Cuántas formaciones se ofrecen al azar al empezar un draft. */
export const FORMACIONES_POR_DRAFT = 4
/** Suplentes en el banco. */
export const SUPLENTES = 3
/** Opciones que se ofrecen para cada slot. */
export const OPCIONES_POR_SLOT = 3

/* ================= ECONOMÍA ================= */

export const MONEDA = 'ÑUENDE COINS'

/** Precio de venta de una repetida según su media. */
export function precioVenta(media: number): number {
  if (media >= 97) return 10000
  if (media >= 93) return 2000
  if (media >= 89) return 1000
  if (media >= 85) return 600
  if (media >= 81) return 400
  if (media >= 78) return 200
  return 100
}

/** Media desde la que la apertura de sobre usa la animación especial. */
export const MEDIA_ESPECIAL = 86

/** El mercado paga 10x, 20x y 40x según el slot. */
export const MULTIPLICADORES_MERCADO = [10, 20, 40]
/** Media mínima para poder vender en el mercado. */
export const MEDIA_MINIMA_MERCADO = 80
/** Repetidas necesarias para armar un bloque de venta. */
export function tamanoBloqueMercado(media: number): number {
  return media >= 84 ? 3 : 6
}
export function valorMercado(media: number, slot: number): number {
  return precioVenta(media) * MULTIPLICADORES_MERCADO[slot]
}

/* ================= SOBRES ================= */

export type BandaMedia = { min: number; max: number }
/** Bandas de media sobre las que se reparten las probabilidades de cada sobre. */
export const BANDAS_MEDIA: BandaMedia[] = [
  { min: 0, max: 79 },
  { min: 80, max: 85 },
  { min: 86, max: 90 },
  { min: 91, max: 95 },
  { min: 96, max: 99 },
]

export type Sobre = {
  id: string
  nombre: string
  precio: number
  tema: 'mono' | 'bronce' | 'verde' | 'purpura' | 'azul' | 'oro'
  cartas: number
  probs: number[]
}

/** Cartas por sobre, igual en todos. */
export const CARTAS_POR_SOBRE = 3

/** Pack gratis e infinito, con su propio diseño en blanco y negro. */
export const SOBRE_GRATIS: Sobre = {
  id: 'gratis',
  nombre: 'PACK GRATIS',
  precio: 0,
  tema: 'mono',
  cartas: CARTAS_POR_SOBRE,
  probs: [0.75, 0.21, 0.03995, 0.00004, 0.00001],
}

/** Sobres de la tienda, de más barato a mejor. */
export const CATALOGO_SOBRES: Sobre[] = [
  { id: 'nuende', nombre: 'ÑUENDE PACK', precio: 2000, tema: 'bronce', cartas: CARTAS_POR_SOBRE, probs: [0.6, 0.35, 0.03, 0.01995, 0.00005] },
  { id: 'euforia', nombre: 'EUFORIA PACK', precio: 3500, tema: 'verde', cartas: CARTAS_POR_SOBRE, probs: [0.5, 0.4, 0.07, 0.02995, 0.00005] },
  { id: 'consu', nombre: 'CONSU BECERRA PACK', precio: 7000, tema: 'purpura', cartas: CARTAS_POR_SOBRE, probs: [0.5, 0.3, 0.15, 0.04, 0.01] },
  { id: 'veliz', nombre: 'VELIZ PACK', precio: 15000, tema: 'azul', cartas: CARTAS_POR_SOBRE, probs: [0.3, 0.25, 0.2, 0.15, 0.1] },
  { id: 'djm', nombre: 'DJM PACK', precio: 30000, tema: 'oro', cartas: CARTAS_POR_SOBRE, probs: [0.1, 0.15, 0.3, 0.25, 0.2] },
]

export function sobrePorId(id: string): Sobre | undefined {
  if (id === SOBRE_GRATIS.id) return SOBRE_GRATIS
  return CATALOGO_SOBRES.find((s) => s.id === id)
}

/* ================= SBCs ================= */

export type RequisitoSbc = {
  /** id del jugador exigido; si falta, cualquiera que cumpla la media */
  jugadorId?: string
  mediaMinima?: number
  posicion?: string
}

export type PlantillaSbc = {
  id: string
  nombre: string
  dificultad: 'Fácil' | 'Media' | 'Media-Alta' | 'Alta'
  requisitos: RequisitoSbc[]
  recompensaSobres: { sobreId: string; cantidad: number }[]
  recompensaMonedas: number
}

export type Sbc = {
  id: string
  nombre: string
  descripcion: string
  plantillas: PlantillaSbc[]
  recompensaSobres: { sobreId: string; cantidad: number }[]
  recompensaMonedas: number
}

export const CATALOGO_SBC: Sbc[] = [
  {
    id: 'temporada_2026',
    nombre: 'TEMPORADA 2026',
    descripcion: 'Completá las plantillas con tus cartas repetidas y llevate sobres y monedas.',
    recompensaSobres: [{ sobreId: 'djm', cantidad: 2 }],
    recompensaMonedas: 50000,
    plantillas: [
      {
        id: 'columna_vertebral',
        nombre: 'COLUMNA VERTEBRAL',
        dificultad: 'Fácil',
        requisitos: [{ posicion: 'ARQ' }, { posicion: 'DFC' }, { posicion: 'MC' }],
        recompensaSobres: [{ sobreId: 'nuende', cantidad: 2 }],
        recompensaMonedas: 2000,
      },
      {
        id: 'el_medio',
        nombre: 'DUEÑOS DEL MEDIO',
        dificultad: 'Media',
        requisitos: [{ jugadorId: 'lucho' }, { jugadorId: 'valenz' }, { mediaMinima: 82 }],
        recompensaSobres: [{ sobreId: 'euforia', cantidad: 3 }],
        recompensaMonedas: 5000,
      },
      {
        id: 'los_parches',
        nombre: 'LOS PARCHES',
        dificultad: 'Media',
        requisitos: [{ jugadorId: 'puente' }, { jugadorId: 'costas' }, { jugadorId: 'tito' }],
        recompensaSobres: [{ sobreId: 'consu', cantidad: 2 }],
        recompensaMonedas: 7000,
      },
      {
        id: 'top_djm',
        nombre: 'LO MEJOR DE DJM',
        dificultad: 'Alta',
        requisitos: [{ mediaMinima: 90 }, { mediaMinima: 84 }, { mediaMinima: 84 }, { mediaMinima: 82 }],
        recompensaSobres: [{ sobreId: 'veliz', cantidad: 3 }],
        recompensaMonedas: 15000,
      },
    ],
  },
]

export function sbcPorId(id: string): Sbc | undefined {
  return CATALOGO_SBC.find((s) => s.id === id)
}
