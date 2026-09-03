import type { DraftGuardado } from './estado'
import { GRUPOS_LIGA, type Copa, type EquipoLiga, type GrupoLiga, grupoPorId, jornadasTotales } from '../config/liga'

export type FilaTabla = { pj: number; g: number; e: number; p: number; gf: number; gc: number; pts: number }

export type ResultadoPartido = { jornada: number; local: string; visita: string; golesLocal: number; golesVisita: number }

/** Versión del formato: si el guardado viejo no calza, se descarta y arranca una liga nueva. */
export const VERSION_LIGA = 2

export type LigaGuardado = {
  version: typeof VERSION_LIGA
  /** grupoId -> equipoId -> fila de tabla. Los 5 grupos se juegan en simultáneo. */
  tablas: Record<string, Record<string, FilaTabla>>
  /** grupoId -> resultados jugados hasta ahora. */
  resultados: Record<string, ResultadoPartido[]>
  /** próxima fecha a jugar; pasado jornadasTotales, la fase de grupos terminó. */
  jornada: number
  fase: 'grupos' | 'copas'
  equipoPendiente: DraftGuardado | null
  /** equipoId -> copa asignada, calculada una sola vez al terminar la fase de grupos. */
  copas: Record<string, Copa> | null
}

const FILA_VACIA: FilaTabla = { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }

export function ligaInicial(): LigaGuardado {
  const tablas: Record<string, Record<string, FilaTabla>> = {}
  const resultados: Record<string, ResultadoPartido[]> = {}
  GRUPOS_LIGA.forEach((grupo) => {
    const tabla: Record<string, FilaTabla> = {}
    grupo.equipos.forEach((e) => {
      tabla[e.id] = { ...FILA_VACIA }
    })
    tablas[grupo.id] = tabla
    resultados[grupo.id] = []
  })
  return { version: VERSION_LIGA, tablas, resultados, jornada: 1, fase: 'grupos', equipoPendiente: null, copas: null }
}

/** Encuentros de una fecha: método del círculo, con el equipo 0 fijo. */
function fixtureDeFecha(equipos: EquipoLiga[], jornada: number): { local: string; visita: string }[] {
  const n = equipos.length
  const arr = equipos.map((e) => e.id)
  for (let r = 1; r < jornada; r++) arr.splice(1, 0, arr.pop()!)
  const partidos: { local: string; visita: string }[] = []
  for (let i = 0; i < n / 2; i++) {
    const a = arr[i]
    const b = arr[n - 1 - i]
    const local = jornada % 2 === 1 ? a : b
    const visita = jornada % 2 === 1 ? b : a
    partidos.push({ local, visita })
  }
  return partidos
}

/** El rival de Don Julio De Milan en una fecha dada del grupo. */
export function rivalDeFecha(grupo: GrupoLiga, jornada: number): EquipoLiga | null {
  const partido = fixtureDeFecha(grupo.equipos, jornada).find((p) => p.local === 'djm' || p.visita === 'djm')
  if (!partido) return null
  const rivalId = partido.local === 'djm' ? partido.visita : partido.local
  return grupo.equipos.find((e) => e.id === rivalId) ?? null
}

/** true si Don Julio De Milan juega de local esa fecha (para saber quién es "home"). */
export function djmEsLocal(grupo: GrupoLiga, jornada: number): boolean {
  const partido = fixtureDeFecha(grupo.equipos, jornada).find((p) => p.local === 'djm' || p.visita === 'djm')
  return partido?.local === 'djm'
}

function golesAlAzar(poderPropio: number, poderRival: number): number {
  const esperado = Math.max(0.4, 1.15 * (poderPropio / ((poderPropio + poderRival) / 2)))
  let goles = 0
  for (let i = 0; i < 6; i++) if (Math.random() < esperado / 6) goles++
  return goles
}

/**
 * Simula todos los partidos de una fecha para un grupo. Si `resultadoConocido` viene
 * (el partido de Don Julio De Milan, ya jugado a mano), se usa tal cual y el resto de
 * los partidos de esa fecha se simulan solos.
 */
function simularFechaDeGrupo(grupo: GrupoLiga, jornada: number, resultadoConocido?: ResultadoPartido): ResultadoPartido[] {
  return fixtureDeFecha(grupo.equipos, jornada).map((p) => {
    if (resultadoConocido && p.local === resultadoConocido.local && p.visita === resultadoConocido.visita) {
      return resultadoConocido
    }
    const local = grupo.equipos.find((e) => e.id === p.local)!
    const visita = grupo.equipos.find((e) => e.id === p.visita)!
    const golesLocal = golesAlAzar(local.poder + 3, visita.poder)
    const golesVisita = golesAlAzar(visita.poder, local.poder + 3)
    return { jornada, local: p.local, visita: p.visita, golesLocal, golesVisita }
  })
}

function sumarResultado(tabla: Record<string, FilaTabla>, r: ResultadoPartido) {
  const local = tabla[r.local]
  const visita = tabla[r.visita]
  local.pj++
  visita.pj++
  local.gf += r.golesLocal
  local.gc += r.golesVisita
  visita.gf += r.golesVisita
  visita.gc += r.golesLocal
  if (r.golesLocal > r.golesVisita) {
    local.g++
    local.pts += 3
    visita.p++
  } else if (r.golesLocal < r.golesVisita) {
    visita.g++
    visita.pts += 3
    local.p++
  } else {
    local.e++
    visita.e++
    local.pts++
    visita.pts++
  }
}

export type FilaClasificacion = FilaTabla & { id: string; equipo: EquipoLiga }

/** Tabla ordenada: puntos, luego diferencia de gol, luego goles a favor. */
export function clasificacion(grupo: GrupoLiga, tabla: Record<string, FilaTabla>): FilaClasificacion[] {
  return grupo.equipos
    .map((equipo) => ({ ...tabla[equipo.id], id: equipo.id, equipo }))
    .sort((a, b) => b.pts - a.pts || b.gf - b.gc - (a.gf - a.gc) || b.gf - a.gf || a.equipo.nombre.localeCompare(b.equipo.nombre))
}

/** Compara dos filas de distintos grupos para las categorías "mejores N-avos". */
function compararEntreGrupos(a: FilaClasificacion, b: FilaClasificacion): number {
  return (
    b.pts - a.pts ||
    b.gf - b.gc - (a.gf - a.gc) ||
    b.gf - a.gf ||
    a.equipo.nombre.localeCompare(b.equipo.nombre)
  )
}

/**
 * Reparte los 40 equipos en las 4 copas según su puesto final en su grupo:
 * Oro (16) = todos los 1ros, 2dos y 3eros + el mejor 4to.
 * Plata (8) = los otros 4tos + los 4 mejores 5tos.
 * Bronce (8) = el otro 5to + todos los 6tos + los 2 mejores 7mos.
 * Plumavit (8) = los otros 3 séptimos + todos los 8vos.
 */
export function asignarCopas(tablas: Record<string, Record<string, FilaTabla>>): Record<string, Copa> {
  const clasificacionesPorGrupo = GRUPOS_LIGA.map((grupo) => clasificacion(grupo, tablas[grupo.id]))

  const puesto = (n: number) => clasificacionesPorGrupo.map((c) => c[n - 1])
  const cuartos = puesto(4).sort(compararEntreGrupos)
  const quintos = puesto(5).sort(compararEntreGrupos)
  const septimos = puesto(7).sort(compararEntreGrupos)

  const mapa: Record<string, Copa> = {}
  const marcar = (filas: FilaClasificacion[], copa: Copa) => filas.forEach((f) => (mapa[f.id] = copa))

  marcar(puesto(1), 'oro')
  marcar(puesto(2), 'oro')
  marcar(puesto(3), 'oro')
  marcar(cuartos.slice(0, 1), 'oro')

  marcar(cuartos.slice(1), 'plata')
  marcar(quintos.slice(0, 4), 'plata')

  marcar(quintos.slice(4), 'bronce')
  marcar(puesto(6), 'bronce')
  marcar(septimos.slice(0, 2), 'bronce')

  marcar(septimos.slice(2), 'plumavit')
  marcar(puesto(8), 'plumavit')

  return mapa
}

/** Aplica el resultado de Don Julio De Milan y simula de una la fecha completa de los 5 grupos. */
export function aplicarResultadoDeFecha(liga: LigaGuardado, resultadoDjm: ResultadoPartido, grupoDjmId: string): LigaGuardado {
  const tablas: Record<string, Record<string, FilaTabla>> = {}
  const resultados: Record<string, ResultadoPartido[]> = {}

  GRUPOS_LIGA.forEach((grupo) => {
    const tabla: Record<string, FilaTabla> = {}
    Object.entries(liga.tablas[grupo.id]).forEach(([id, fila]) => {
      tabla[id] = { ...fila }
    })
    const nuevos = simularFechaDeGrupo(grupo, liga.jornada, grupo.id === grupoDjmId ? resultadoDjm : undefined)
    nuevos.forEach((r) => sumarResultado(tabla, r))
    tablas[grupo.id] = tabla
    resultados[grupo.id] = [...liga.resultados[grupo.id], ...nuevos]
  })

  const siguienteJornada = liga.jornada + 1
  const total = jornadasTotales(grupoPorId(grupoDjmId)!)
  const terminoLaFase = siguienteJornada > total
  const copas = terminoLaFase ? asignarCopas(tablas) : null

  return {
    ...liga,
    tablas,
    resultados,
    jornada: siguienteJornada,
    fase: terminoLaFase ? 'copas' : 'grupos',
    equipoPendiente: null,
    copas,
  }
}
