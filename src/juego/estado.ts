export type DraftGuardado = {
  id: string
  fecha: number
  formacion: string
  capitanId: string | null
  titulares: (string | null)[]
  suplentes: (string | null)[]
  media: number
}

import type { Jugador } from '../types/jugador'
import { VERSION_LIGA, type LigaGuardado } from './liga'

export type Guardado = {
  monedas: number
  /** cartas creadas desde el panel de admin */
  cartasPropias: Jugador[]
  /** id de carta -> cantidad en propiedad */
  coleccion: Record<string, number>
  /** id de sobre -> cantidad pendiente de abrir */
  misSobres: Record<string, number>
  drafts: DraftGuardado[]
  /** id de plantilla SBC -> completada */
  plantillasHechas: Record<string, boolean>
  /** id de SBC -> recompensa final reclamada */
  sbcReclamados: Record<string, boolean>
  ultimoPackGratis: number | null
  /** liga del equipo: tabla, fecha actual y resultados. null hasta el primer "Ir a liga". */
  liga: LigaGuardado | null
}

export const GUARDADO_INICIAL: Guardado = {
  monedas: 5000,
  cartasPropias: [],
  coleccion: {},
  misSobres: { gratis: 1 },
  drafts: [],
  plantillasHechas: {},
  sbcReclamados: {},
  ultimoPackGratis: null,
  liga: null,
}

const CLAVE = 'djm_cartas_guardado_v1'

export function leerGuardado(): Guardado {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return { ...GUARDADO_INICIAL }
    const guardado = { ...GUARDADO_INICIAL, ...(JSON.parse(crudo) as Partial<Guardado>) }
    // Una liga de un formato viejo (menos o más grupos, otra forma de tabla) no sirve: se arranca de cero.
    if (guardado.liga && guardado.liga.version !== VERSION_LIGA) guardado.liga = null
    return guardado
  } catch {
    return { ...GUARDADO_INICIAL }
  }
}

export function escribirGuardado(guardado: Guardado): boolean {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(guardado))
    return true
  } catch {
    return false
  }
}
