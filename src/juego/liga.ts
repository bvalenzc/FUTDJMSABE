import type { DraftGuardado } from './estado'
import {
  GRUPOS_LIGA,
  type Copa,
  type EquipoLiga,
  type GrupoLiga,
  equipoLigaGlobalPorId,
  grupoPorId,
  jornadasTotales,
} from '../config/liga'

export type FilaTabla = { pj: number; g: number; e: number; p: number; gf: number; gc: number; pts: number }

export type ResultadoPartido = { jornada: number; local: string; visita: string; golesLocal: number; golesVisita: number }

/** Versión del formato: si el guardado viejo no calza, se descarta y arranca una liga nueva. */
export const VERSION_LIGA = 3

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
  /** la llave de la copa de Don Julio De Milan, con cuartos/semis/final ya sorteados. */
  copaDjm: CopaGuardado | null
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
  return {
    version: VERSION_LIGA,
    tablas,
    resultados,
    jornada: 1,
    fase: 'grupos',
    equipoPendiente: null,
    copas: null,
    copaDjm: null,
  }
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

/* ================= COPAS: cuartos, semis y final ================= */

export type RondaCopa = 'octavos' | 'cuartos' | 'semis' | 'final'

export type PartidoCopa = {
  /** null mientras el rival de esa llave todavía no se define (ronda futura). */
  local: string | null
  visita: string | null
  golesLocal: number | null
  golesVisita: number | null
  /** si el marcador quedó empatado, quién se lo llevó por penales: los cruces
   *  simulados nunca empatan, así que esto solo puede pasar en el que juega el usuario. */
  penalesGanador?: string | null
}

export type RondaCopaJugada = { ronda: RondaCopa; partidos: PartidoCopa[] }

export type CopaGuardado = {
  copa: Copa
  rondas: RondaCopaJugada[]
  /** ronda en la que quedó afuera; null mientras sigue viva o hasta que se define. */
  eliminadoEn: RondaCopa | null
  /** equipoId campeón, recién se llena cuando se juega la final. */
  campeon: string | null
  recompensaReclamada: boolean
}

/** Recompensa por ganar la copa entera: packs al azar y monedas redondas de a 1.000. */
export type RecompensaCopa = { seMeFueLarga: number; djm: number; monedas: number }

export function recompensaCopaAlAzar(): RecompensaCopa {
  return {
    seMeFueLarga: 2 + Math.floor(Math.random() * 3),
    djm: 2 + Math.floor(Math.random() * 3),
    monedas: (200 + Math.floor(Math.random() * 301)) * 1000,
  }
}

/**
 * Orden de siembra clásico de un cuadro de eliminación (1-8, 4-5, 2-7, 3-6 para 8
 * equipos, y así doblando para 16): asegura que las mejores posiciones no se crucen
 * hasta la final.
 */
function ordenSiembra(n: number): number[] {
  if (n <= 1) return [1]
  const previo = ordenSiembra(n / 2)
  const resultado: number[] = []
  previo.forEach((s) => resultado.push(s, n + 1 - s))
  return resultado
}

function rondasParaTamano(n: number): RondaCopa[] {
  return n >= 16 ? ['octavos', 'cuartos', 'semis', 'final'] : ['cuartos', 'semis', 'final']
}

/**
 * Arma la llave de una copa completa: siembra a sus equipos según cómo terminaron
 * la fase de grupos (mismo criterio que separa las copas) y deja listas todas las
 * rondas, las que siguen con `local`/`visita` en null hasta que se sepa quién avanza.
 */
export function armarLlaveCopa(
  copaId: Copa,
  mapaCopas: Record<string, Copa>,
  tablas: Record<string, Record<string, FilaTabla>>,
): CopaGuardado {
  const filas: FilaClasificacion[] = []
  GRUPOS_LIGA.forEach((grupo) => {
    clasificacion(grupo, tablas[grupo.id])
      .filter((f) => mapaCopas[f.id] === copaId)
      .forEach((f) => filas.push(f))
  })
  filas.sort(compararEntreGrupos)

  const siembra = ordenSiembra(filas.length)
  const equiposEnOrden = siembra.map((puesto) => filas[puesto - 1].id)
  const nombresRonda = rondasParaTamano(filas.length)

  const primeraRonda: PartidoCopa[] = []
  for (let j = 0; j < equiposEnOrden.length; j += 2) {
    primeraRonda.push({ local: equiposEnOrden[j], visita: equiposEnOrden[j + 1] ?? null, golesLocal: null, golesVisita: null })
  }

  const rondasJugadas: RondaCopaJugada[] = [{ ronda: nombresRonda[0], partidos: primeraRonda }]
  for (let i = 1; i < nombresRonda.length; i++) {
    const cantidad = rondasJugadas[i - 1].partidos.length / 2
    rondasJugadas.push({ ronda: nombresRonda[i], partidos: Array.from({ length: cantidad }, vacioCopa) })
  }

  return { copa: copaId, rondas: rondasJugadas, eliminadoEn: null, campeon: null, recompensaReclamada: false }
}

function vacioCopa(): PartidoCopa {
  return { local: null, visita: null, golesLocal: null, golesVisita: null }
}

/** Sigmoide chica solo para desempatar penales/alargue cuando la copa da igualdad. */
function sigmoideCopa(diferencia: number): number {
  return 1 / (1 + Math.pow(10, -diferencia / 40))
}

/** Simula un cruce de copa entre dos equipos que no controla el jugador: nunca
 *  puede terminar empatado, así que un resultado parejo se desempata como si fuera
 *  penales, con más chance para el que tiene más poder. */
export function simularPartidoCopa(local: EquipoLiga, visita: EquipoLiga): { golesLocal: number; golesVisita: number } {
  let golesLocal = golesAlAzar(local.poder, visita.poder)
  let golesVisita = golesAlAzar(visita.poder, local.poder)
  if (golesLocal === golesVisita) {
    const probLocal = clampCopa(sigmoideCopa(local.poder - visita.poder))
    if (Math.random() < probLocal) golesLocal += 1
    else golesVisita += 1
  }
  return { golesLocal, golesVisita }
}

function clampCopa(n: number): number {
  return Math.min(0.9, Math.max(0.1, n))
}

function ganadorDe(p: PartidoCopa): string | null {
  if (p.golesLocal === null || p.golesVisita === null) return null
  if (p.golesLocal === p.golesVisita) return p.penalesGanador ?? null
  return p.golesLocal > p.golesVisita ? p.local : p.visita
}

/** Vuelca a los ganadores de una ronda ya completa en los cruces de la siguiente. */
function propagarGanadores(rondas: RondaCopaJugada[], indice: number) {
  if (indice + 1 >= rondas.length) return
  const actual = rondas[indice].partidos
  const siguiente = rondas[indice + 1].partidos
  siguiente.forEach((p, j) => {
    p.local = ganadorDe(actual[j * 2])
    p.visita = ganadorDe(actual[j * 2 + 1])
  })
}

/** Juega (simulado) todos los cruces de una ronda que todavía no tengan resultado. */
function completarRonda(rondas: RondaCopaJugada[], indice: number) {
  rondas[indice].partidos.forEach((p) => {
    if (p.golesLocal !== null || !p.local || !p.visita) return
    const eqLocal = equipoLigaGlobalPorId(p.local)
    const eqVisita = equipoLigaGlobalPorId(p.visita)
    if (!eqLocal || !eqVisita) return
    const r = simularPartidoCopa(eqLocal, eqVisita)
    p.golesLocal = r.golesLocal
    p.golesVisita = r.golesVisita
  })
}

function indiceRondaActualDjm(rondas: RondaCopaJugada[]): number {
  return rondas.findIndex((r) => r.partidos.some((p) => (p.local === 'djm' || p.visita === 'djm') && p.golesLocal === null))
}

export function nombreRonda(ronda: RondaCopa): string {
  if (ronda === 'octavos') return 'Octavos de Final'
  if (ronda === 'cuartos') return 'Cuartos de Final'
  if (ronda === 'semis') return 'Semifinal'
  return 'Final'
}

/** El próximo cruce de copa que le toca jugar a DJM, o null si ya está afuera o ya salió campeón. */
export function proximoPartidoCopaDjm(copaGuardado: CopaGuardado): { ronda: RondaCopa; djmLocal: boolean; rivalId: string } | null {
  if (copaGuardado.eliminadoEn || copaGuardado.campeon) return null
  const i = indiceRondaActualDjm(copaGuardado.rondas)
  if (i < 0) return null
  const p = copaGuardado.rondas[i].partidos.find((x) => x.local === 'djm' || x.visita === 'djm')
  if (!p) return null
  const djmLocal = p.local === 'djm'
  const rivalId = djmLocal ? p.visita : p.local
  if (!rivalId) return null
  return { ronda: copaGuardado.rondas[i].ronda, djmLocal, rivalId }
}

/**
 * Aplica el resultado que jugó el usuario en su cruce de copa. Si ganó, completa el
 * resto de esa ronda (simulado) y deja armada la siguiente; si esa era la final,
 * corona campeón a DJM. Si perdió, queda eliminado ahí mismo y se simula de una
 * todo lo que falta del cuadro para saber quién termina siendo el campeón.
 *
 * `djmGanoOverride` sirve para cuando el partido terminó empatado y quien lo llama
 * ya resolvió un desempate (penales): así el marcador real queda guardado en la
 * llave tal cual se jugó, sin inventar un resultado distinto para forzar un ganador.
 */
export function aplicarResultadoCopa(
  copaGuardado: CopaGuardado,
  golesDjm: number,
  golesRival: number,
  djmGanoOverride?: boolean,
): CopaGuardado {
  const rondas: RondaCopaJugada[] = copaGuardado.rondas.map((r) => ({ ronda: r.ronda, partidos: r.partidos.map((p) => ({ ...p })) }))
  const i = indiceRondaActualDjm(rondas)
  if (i < 0) return copaGuardado

  const partidoDjm = rondas[i].partidos.find((p) => p.local === 'djm' || p.visita === 'djm')!
  if (partidoDjm.local === 'djm') {
    partidoDjm.golesLocal = golesDjm
    partidoDjm.golesVisita = golesRival
  } else {
    partidoDjm.golesLocal = golesRival
    partidoDjm.golesVisita = golesDjm
  }
  if (golesDjm === golesRival && djmGanoOverride !== undefined) {
    const rivalId = partidoDjm.local === 'djm' ? partidoDjm.visita : partidoDjm.local
    partidoDjm.penalesGanador = djmGanoOverride ? 'djm' : rivalId
  }

  completarRonda(rondas, i)
  const djmGano = djmGanoOverride ?? golesDjm > golesRival

  if (!djmGano) {
    for (let k = i; k < rondas.length; k++) {
      propagarGanadores(rondas, k)
      if (k + 1 < rondas.length) completarRonda(rondas, k + 1)
    }
    const campeon = ganadorDe(rondas[rondas.length - 1].partidos[0])
    return { ...copaGuardado, rondas, eliminadoEn: rondas[i].ronda, campeon }
  }

  if (i + 1 >= rondas.length) {
    return { ...copaGuardado, rondas, campeon: 'djm' }
  }
  propagarGanadores(rondas, i)
  return { ...copaGuardado, rondas }
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
  const copaDjm = terminoLaFase && copas ? armarLlaveCopa(copas['djm'], copas, tablas) : null

  return {
    ...liga,
    tablas,
    resultados,
    jornada: siguienteJornada,
    fase: terminoLaFase ? 'copas' : 'grupos',
    equipoPendiente: null,
    copas,
    copaDjm,
  }
}
