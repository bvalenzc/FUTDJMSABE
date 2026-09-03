export type StatsCampo = {
  rit: number
  tir: number
  pas: number
  reg: number
  def: number
  fis: number
}

export type StatsArquero = {
  est: number
  par: number
  saq: number
  ref: number
  vel: number
  col: number
}

export type Encuadre = {
  /** alto de la figura dentro de la carta, en px sobre el lienzo de referencia (330x486) */
  alto: number
  /** desplazamiento vertical del recorte, puede ser negativo */
  abajo: number
  /** desplazamiento horizontal del recorte */
  x: number
}

export type TipoJugador = 'plantel' | 'parche'
export type TipoStats = 'campo' | 'arquero'

export type Jugador = {
  id: string
  nombre: string
  /** posición principal, la que muestra la carta */
  posicion: string
  /** posiciones jugables en el draft; la primera es la principal, las otras dos son alternativas */
  posiciones?: string[]
  /** persona real detrás de la carta; si falta se usa el nombre. Dos cartas con la
   *  misma persona nunca conviven en un draft. */
  persona?: string
  dorsal?: number
  tipo: TipoJugador
  tipoStats: TipoStats
  media: number
  stats: StatsCampo | StatsArquero
  /** clave del archivo en src/assets/recortes (sin extensión); si falta, cae a la silueta genérica */
  foto?: string
  /** imagen embebida (data URL), para cartas creadas desde el panel de admin */
  fotoUrl?: string
  encuadre?: Encuadre
  /** rareza fijada a mano; si falta se calcula desde la media */
  rareza?: Rareza
  /** true para las cartas creadas desde el panel de admin */
  propia?: boolean
}

export type Rareza =
  | 'plata'
  | 'oro'
  | 'oro-raro'
  | 'mvp'
  | 'primer-gol'
  | 'djdor'
  | 'flashback'
  | 'parche'

export const RAREZAS: { id: Rareza; nombre: string }[] = [
  { id: 'plata', nombre: 'Plata' },
  { id: 'oro', nombre: 'Oro común' },
  { id: 'oro-raro', nombre: 'Oro raro' },
  { id: 'mvp', nombre: 'MVP' },
  { id: 'primer-gol', nombre: 'El Primer Gol' },
  { id: 'djdor', nombre: "Don Julio D'Or" },
  { id: 'flashback', nombre: 'Flashback' },
  { id: 'parche', nombre: 'Parche' },
]
