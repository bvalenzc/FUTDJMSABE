import type { DraftGuardado } from './estado'
import { type Copa, type EquipoLiga, type GrupoLiga, copaDePuesto, grupoPorId, jornadasTotales } from '../config/liga'

export type FilaTabla = { pj: number; g: number; e: number; p: number; gf: number; gc: number; pts: number }

export type ResultadoPartido = { jornada: number; local: string; visita: string; golesLocal: number; golesVisita: number }

export type LigaGuardado = {
  grupoId: string
  /** próxima fecha a jugar; si supera jornadasTotales(grupo), la fase de grupos terminó. */
  jornada: number
  tabla: Record<string, FilaTabla>
  resultados: ResultadoPartido[]
  /** equipo recién armado en el draft, listo para disputar la próxima fecha. */
  equipoPendiente: DraftGuardado | null
  copaAsignada: Copa | null
}

const FILA_VACIA: FilaTabla = { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }

export function ligaInicial(grupoId: string): LigaGuardado {
  const grupo = grupoPorId(grupoId)!
  const tabla: Record<string, FilaTabla> = {}
  grupo.equipos.forEach((e) => {
    tabla[e.id] = { ...FILA_VACIA }
  })
  return { grupoId, jornada: 1, tabla, resultados: [], equipoPendiente: null, copaAsignada: null }
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

/** Simula los partidos de la fecha que no involucran a Don Julio De Milan. */
export function simularRestoDeFecha(grupo: GrupoLiga, jornada: number): ResultadoPartido[] {
  return fixtureDeFecha(grupo.equipos, jornada)
    .filter((p) => p.local !== 'djm' && p.visita !== 'djm')
    .map((p) => {
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

/** Aplica el resultado de Don Julio De Milan + el resto de la fecha, avanza la jornada y asigna copa si terminó. */
export function aplicarResultadoDeFecha(
  liga: LigaGuardado,
  resultadoDjm: ResultadoPartido,
  resultadosResto: ResultadoPartido[],
): LigaGuardado {
  const grupo = grupoPorId(liga.grupoId)!
  const tabla: Record<string, FilaTabla> = {}
  Object.entries(liga.tabla).forEach(([id, fila]) => {
    tabla[id] = { ...fila }
  })

  const todos = [resultadoDjm, ...resultadosResto]
  todos.forEach((r) => sumarResultado(tabla, r))

  const siguienteJornada = liga.jornada + 1
  const total = jornadasTotales(grupo)
  const copaAsignada = siguienteJornada > total ? copaDePuesto(clasificacion(grupo, tabla).findIndex((f) => f.id === 'djm') + 1) : null

  return {
    ...liga,
    tabla,
    resultados: [...liga.resultados, ...todos],
    jornada: siguienteJornada,
    equipoPendiente: null,
    copaAsignada,
  }
}

export type FilaClasificacion = FilaTabla & { id: string; equipo: EquipoLiga }

/** Tabla ordenada: puntos, luego diferencia de gol, luego goles a favor. */
export function clasificacion(grupo: GrupoLiga, tabla: Record<string, FilaTabla>): FilaClasificacion[] {
  return grupo.equipos
    .map((equipo) => ({ ...tabla[equipo.id], id: equipo.id, equipo }))
    .sort((a, b) => b.pts - a.pts || b.gf - b.gc - (a.gf - a.gc) || b.gf - a.gf || a.equipo.nombre.localeCompare(b.equipo.nombre))
}
