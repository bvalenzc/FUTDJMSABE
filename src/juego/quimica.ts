import type { SlotFormacion } from '../config/juego'
import { jugadorPorId, posicionesDe } from './roster'

/** Puntos que aporta cada posición de la cancha bien cubierta. */
export const QUIMICA_POR_SLOT = 10

export function quimicaMaxima(slots: SlotFormacion[]): number {
  return slots.length * QUIMICA_POR_SLOT
}

/** Un titular suma 10 solo si el rol del slot es una de sus posiciones. */
export function quimicaDeSlot(idJugador: string | null, rol: string): number {
  if (!idJugador) return 0
  const jugador = jugadorPorId(idJugador)
  if (!jugador) return 0
  return posicionesDe(jugador).includes(rol) ? QUIMICA_POR_SLOT : 0
}

export function quimicaTotal(titulares: (string | null)[], slots: SlotFormacion[]): number {
  return slots.reduce((suma, slot, i) => suma + quimicaDeSlot(titulares[i] ?? null, slot.role), 0)
}
