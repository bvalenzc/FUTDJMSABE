/** Liga actual del equipo: 5 grupos de 8, portados tal cual de las tablas reales. */

export type EquipoLiga = {
  id: string
  nombre: string
  /** true solo para el equipo del jugador (Don Julio De Milan). */
  esDjm?: boolean
  /** fuerza interna 0-99 para simular a los rivales que no controla el jugador. */
  poder: number
}

export type GrupoLiga = {
  id: string
  nombre: string
  equipos: EquipoLiga[]
}

/** El grupo donde compite Don Julio De Milan. Siempre primero en la lista. */
export const GRUPO_DJM = 'acerbis'

export const GRUPOS_LIGA: GrupoLiga[] = [
  {
    id: 'acerbis',
    nombre: 'ACERBIS',
    equipos: [
      { id: 'djm', nombre: 'Don Julio De Milan', esDjm: true, poder: 82 },
      { id: 'mambo-kingz', nombre: 'Mambo Kingz', poder: 84 },
      { id: 'sin-cardio-fc', nombre: 'Sin Cardio FC', poder: 80 },
      { id: 'la-squina', nombre: 'La Squina', poder: 78 },
      { id: 'sagrada-familia', nombre: 'Sagrada Familia', poder: 75 },
      { id: 'zorros-del-clan', nombre: 'Los Zorros Del Cla…', poder: 73 },
      { id: 'speed-gang', nombre: 'Speed Gang', poder: 71 },
      { id: 'morocha-fc', nombre: 'Morocha FC', poder: 69 },
    ],
  },
  {
    id: 'estudio-moustache',
    nombre: 'ESTUDIO MOUSTACHE',
    equipos: [
      { id: 'yortmanchester-u', nombre: 'Yortmanchester U…', poder: 87 },
      { id: 'morecambe', nombre: 'Morecambe', poder: 83 },
      { id: 'csd-ayer-hubo-m', nombre: 'CSD Ayer Hubo M…', poder: 80 },
      { id: 'san-pedro', nombre: 'San Pedro', poder: 77 },
      { id: 'pinedine-pidane', nombre: 'Pinedine Pidane', poder: 75 },
      { id: 'tios-monkeys-fc', nombre: "Tio's Monkeys FC", poder: 72 },
      { id: 'haram-ball-rovers', nombre: 'Haram-Ball rovers', poder: 70 },
      { id: 'carlos-mas-6', nombre: 'Carlos +6', poder: 67 },
    ],
  },
  {
    id: 'givova',
    nombre: 'GIVOVA',
    equipos: [
      { id: 'equipo-b', nombre: 'Equipo B', poder: 86 },
      { id: 'larvas-fc', nombre: 'Larvas FC', poder: 82 },
      { id: 'druganga-pc', nombre: 'Druganga PC', poder: 79 },
      { id: 'lujurianos', nombre: 'Lujurianos', poder: 77 },
      { id: 'mainz-23', nombre: 'Mainz 23', poder: 74 },
      { id: 'cd-singapur', nombre: 'CD Singapur', poder: 72 },
      { id: 'guatalacticos', nombre: 'Guatalacticos', poder: 69 },
      { id: 'nayandra-fc', nombre: 'Nayandra FC', poder: 66 },
    ],
  },
  {
    id: 'honesto-mike',
    nombre: 'HONESTO MIKE',
    equipos: [
      { id: 'fc-la-paila', nombre: 'FC La Paila', poder: 85 },
      { id: 'hub-city', nombre: 'Hub City', poder: 82 },
      { id: 'miss-pate-fc', nombre: 'Miss Pate Fc', poder: 79 },
      { id: 'crystal-pajas', nombre: 'Crystal Pajas', poder: 76 },
      { id: 'skol-fc', nombre: 'Skol Football Club', poder: 74 },
      { id: 'rustikos', nombre: 'Rustikos', poder: 71 },
      { id: 'cd-taberna', nombre: 'CD Taberna', poder: 68 },
      { id: 'pedro-juan-y-nucr', nombre: 'Pedro Juan y Nucr…', poder: 65 },
    ],
  },
  {
    id: 'kars',
    nombre: 'KARS',
    equipos: [
      { id: 'bayer-leverkumbia', nombre: 'Bayer Leverkumbia', poder: 85 },
      { id: 'san-narcos', nombre: 'San Narcos', poder: 81 },
      { id: 'cd-cloaca', nombre: 'C.D. Cloaca', poder: 79 },
      { id: 'ac-congo', nombre: 'AC Congo', poder: 76 },
      { id: 'vodka-juniors', nombre: 'Vodka Juniors', poder: 74 },
      { id: 'malajax', nombre: 'Malajax', poder: 71 },
      { id: 'palinski', nombre: 'Palinski', poder: 68 },
      { id: 'michaeles-martinez', nombre: 'Michaeles Martinez', poder: 65 },
    ],
  },
]

export function grupoPorId(id: string): GrupoLiga | undefined {
  return GRUPOS_LIGA.find((g) => g.id === id)
}

export function equipoLigaPorId(grupo: GrupoLiga, id: string): EquipoLiga | undefined {
  return grupo.equipos.find((e) => e.id === id)
}

/** Fechas totales de la fase de grupos: todos contra todos, una vez. */
export function jornadasTotales(grupo: GrupoLiga): number {
  return grupo.equipos.length - 1
}

export type Copa = 'oro' | 'plata' | 'bronce' | 'plumavit'

export const COPAS: { id: Copa; nombre: string; color: string }[] = [
  { id: 'oro', nombre: 'Copa Oro', color: '#e8c565' },
  { id: 'plata', nombre: 'Copa Plata', color: '#c7d0d8' },
  { id: 'bronce', nombre: 'Copa Bronce', color: '#c58a4c' },
  { id: 'plumavit', nombre: 'Copa Plumavit', color: '#8fd4a8' },
]

/** Puesto 1-8 -> copa a la que clasifica (1ro y 2do oro, 3ro y 4to plata, etc). */
export function copaDePuesto(puesto: number): Copa {
  if (puesto <= 2) return 'oro'
  if (puesto <= 4) return 'plata'
  if (puesto <= 6) return 'bronce'
  return 'plumavit'
}

export function copaInfo(copa: Copa) {
  return COPAS.find((c) => c.id === copa)!
}
