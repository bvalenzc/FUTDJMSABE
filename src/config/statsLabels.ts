import type { StatsArquero, StatsCampo } from '../types/jugador'

export const ETIQUETAS_CAMPO: Array<[keyof StatsCampo, string]> = [
  ['rit', 'RIT'],
  ['tir', 'TIR'],
  ['pas', 'PAS'],
  ['reg', 'REG'],
  ['def', 'DEF'],
  ['fis', 'FIS'],
]

export const ETIQUETAS_ARQUERO: Array<[keyof StatsArquero, string]> = [
  ['est', 'EST'],
  ['par', 'PAR'],
  ['saq', 'SAQ'],
  ['ref', 'REF'],
  ['vel', 'VEL'],
  ['col', 'COL'],
]
