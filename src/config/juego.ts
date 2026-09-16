/** Reglas del juego, portadas del FUTDJM original. Todo lo ajustable vive acá. */

import type { Rareza, TipoStats } from '../types/jugador'

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
  tema: 'mono' | 'bronce' | 'verde' | 'purpura' | 'azul' | 'oro' | 'noche'
  cartas: number
  probs: number[]
  /** Bandas de media propias del sobre; si falta, usa las BANDAS_MEDIA globales. */
  bandas?: BandaMedia[]
}

/** Bandas exclusivas del SE ME FUE LARGA PACK: van más finas arriba que las globales. */
export const BANDAS_SE_ME_FUE_LARGA: BandaMedia[] = [
  { min: 74, max: 80 },
  { min: 81, max: 85 },
  { min: 86, max: 89 },
  { min: 90, max: 93 },
  { min: 94, max: 97 },
  { min: 98, max: 99 },
]

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
  {
    id: 'seme_fue_larga',
    nombre: 'SE ME FUE LARGA PACK',
    precio: 150000,
    tema: 'noche',
    cartas: CARTAS_POR_SOBRE,
    probs: [0.0005, 0.1495, 0.2, 0.3, 0.25, 0.1],
    bandas: BANDAS_SE_ME_FUE_LARGA,
  },
]

export function sobrePorId(id: string): Sobre | undefined {
  if (id === SOBRE_GRATIS.id) return SOBRE_GRATIS
  return CATALOGO_SOBRES.find((s) => s.id === id)
}

/* ================= SBCs ================= */

export type RequisitoSbc = {
  /** id del jugador exigido; si falta, cualquiera que cumpla el resto */
  jugadorId?: string
  mediaMinima?: number
  /** posición del slot; en una plantilla con `formacion` se toma sola del slot y esto es solo para forzarla. */
  posicion?: string
}

/** Requisito que no mira un slot individual sino el conjunto completo de cartas elegidas. */
export type RequisitoAgregado =
  | { tipo: 'cantidadMinima'; minimo: number }
  | { tipo: 'cantidadMaxima'; maximo: number }
  | { tipo: 'mediaPromedio'; minimo: number }
  /** Solo se puede usar cartas de estas personas (por `persona`, cualquier rareza de esa persona sirve). */
  | { tipo: 'soloPersonas'; personas: string[] }
  | { tipo: 'cantidadRareza'; rareza: Rareza; minimo: number }
  /** Química mínima de la plantilla armada sobre su formación. */
  | { tipo: 'quimicaMinima'; minimo: number }
  /** Mínimo de cartas de un tipo de stats (para pedir arqueros de más, por ejemplo). */
  | { tipo: 'cantidadTipoStats'; tipoStats: TipoStats; minimo: number }
  /** Tiene que estar cada una de estas personas, cada una con su propia media mínima si tiene. */
  | { tipo: 'incluyePersonas'; personas: { persona: string; mediaMinima?: number }[] }

export type PlantillaSbc = {
  id: string
  nombre: string
  dificultad: string
  /** Si viene, la plantilla se arma sobre la cancha de esa formación (un slot por posición)
   *  en vez de la fila genérica de requisitos sueltos. */
  formacion?: string
  /** Si es true, los slots de la cancha no exigen la posición de su formación (para
   *  plantillas tipo "EL IPAD" que piden más arqueros que slots de ARQ tiene la cancha). */
  librePosicion?: boolean
  requisitos: RequisitoSbc[]
  requisitosAgregados?: RequisitoAgregado[]
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
  /** Carta exclusiva que se entrega junto con la recompensa final del SBC, si tiene. */
  cartaEspecialId?: string
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
  {
    id: 'el_gato',
    nombre: 'EL GATO',
    descripcion: 'Completá las plantillas de esta serie y llevate la carta ICONO OJALÁ de GARIN.',
    recompensaSobres: [
      { sobreId: 'djm', cantidad: 3 },
      { sobreId: 'veliz', cantidad: 3 },
    ],
    recompensaMonedas: 1000000,
    cartaEspecialId: 'garin',
    plantillas: [
      {
        id: 'gen_2022_cumbres',
        nombre: 'GEN 2022 CUMBRES',
        dificultad: 'Media',
        formacion: '1-3-2-1',
        requisitos: [{}, {}, {}, {}, {}, {}, {}],
        requisitosAgregados: [
          { tipo: 'cantidadMinima', minimo: 7 },
          { tipo: 'mediaPromedio', minimo: 90 },
          {
            tipo: 'soloPersonas',
            personas: ['TABACH', 'PELAO', 'COSTAS', 'MAU', 'CHELO', 'MRILLON', 'PANCHO', 'BAÑADOS', 'RAFA', 'VANTI'],
          },
          { tipo: 'cantidadRareza', rareza: 'djdor', minimo: 2 },
        ],
        recompensaSobres: [{ sobreId: 'seme_fue_larga', cantidad: 1 }],
        recompensaMonedas: 100000,
      },
      {
        id: 'yo_siempre_lo_he_dicho',
        nombre: 'YO SIEMPRE LO HE DICHO...',
        dificultad: 'Media',
        formacion: '1-2-3-1',
        requisitos: [{}, {}, {}, {}, {}, {}, {}],
        requisitosAgregados: [
          { tipo: 'cantidadMaxima', maximo: 1 },
          { tipo: 'incluyePersonas', personas: [{ persona: 'BAÑADOS' }] },
          { tipo: 'mediaPromedio', minimo: 97 },
        ],
        recompensaSobres: [{ sobreId: 'euforia', cantidad: 3 }],
        recompensaMonedas: 30000,
      },
      {
        id: 'fen',
        nombre: 'FEN',
        dificultad: 'Baja',
        formacion: '1-3-1-2',
        requisitos: [{}, {}, {}, {}, {}, {}, {}],
        requisitosAgregados: [
          {
            tipo: 'incluyePersonas',
            personas: [{ persona: 'RAI' }, { persona: 'VANTI', mediaMinima: 95 }],
          },
        ],
        recompensaSobres: [{ sobreId: 'consu', cantidad: 2 }],
        recompensaMonedas: 20000,
      },
      {
        id: 'el_ipad',
        nombre: 'EL IPAD',
        dificultad: 'Media',
        formacion: '1-2-3-1',
        librePosicion: true,
        requisitos: [{}, {}, {}, {}, {}, {}, {}],
        requisitosAgregados: [
          { tipo: 'cantidadMaxima', maximo: 5 },
          { tipo: 'cantidadTipoStats', tipoStats: 'arquero', minimo: 5 },
          { tipo: 'mediaPromedio', minimo: 83 },
        ],
        recompensaSobres: [{ sobreId: 'consu', cantidad: 3 }],
        recompensaMonedas: 25000,
      },
      {
        id: 'mondaca_hijodeputa',
        nombre: 'MONDACA HIJODEPUTA',
        dificultad: 'Muy difícil',
        formacion: '1-3-2-1',
        requisitos: [{}, {}, {}, {}, {}, {}, {}],
        requisitosAgregados: [
          { tipo: 'mediaPromedio', minimo: 95 },
          { tipo: 'cantidadRareza', rareza: 'djdor', minimo: 7 },
          { tipo: 'quimicaMinima', minimo: 70 },
        ],
        recompensaSobres: [{ sobreId: 'seme_fue_larga', cantidad: 2 }],
        recompensaMonedas: 200000,
      },
      {
        id: 'everest',
        nombre: 'EVEREST',
        dificultad: 'Media-difícil',
        formacion: '1-2-2-2',
        requisitos: [{}, {}, {}, {}, {}, {}, {}],
        requisitosAgregados: [
          {
            tipo: 'incluyePersonas',
            personas: [
              { persona: 'VALENZ', mediaMinima: 95 },
              { persona: 'LUCHO', mediaMinima: 92 },
              { persona: 'MANGO' },
              { persona: 'TITO' },
              { persona: 'VARELA' },
              { persona: 'MVALENZ', mediaMinima: 85 },
              { persona: 'PUENTE' },
            ],
          },
          { tipo: 'quimicaMinima', minimo: 70 },
        ],
        recompensaSobres: [
          { sobreId: 'djm', cantidad: 2 },
          { sobreId: 'consu', cantidad: 2 },
        ],
        recompensaMonedas: 70000,
      },
      {
        id: 'santuario_del_valle',
        nombre: 'SANTUARIO DEL VALLE',
        dificultad: 'Fácil',
        formacion: '1-2-3-1',
        requisitos: [{}, {}, {}, {}, {}, {}, {}],
        requisitosAgregados: [
          { tipo: 'incluyePersonas', personas: [{ persona: 'MAU' }, { persona: 'TITO' }] },
          { tipo: 'cantidadMaxima', maximo: 2 },
          { tipo: 'quimicaMinima', minimo: 20 },
        ],
        recompensaSobres: [{ sobreId: 'nuende', cantidad: 5 }],
        recompensaMonedas: 20000,
      },
    ],
  },
]

export function sbcPorId(id: string): Sbc | undefined {
  return CATALOGO_SBC.find((s) => s.id === id)
}
