import jugadoresData from '../data/jugadores.json'
import parchesData from '../data/parches.json'
import type { Jugador } from '../types/jugador'

export const PLANTEL = jugadoresData as Jugador[]
export const PARCHES = parchesData as Jugador[]

/** Cartas creadas desde el panel de admin. El proveedor de juego las sincroniza acá. */
let propias: Jugador[] = []

export function sincronizarPropias(lista: Jugador[]) {
  propias = lista
}

/** Roster vivo: plantel + parches + cartas propias. */
export function obtenerRoster(): Jugador[] {
  return [...PLANTEL, ...PARCHES, ...propias]
}

export function jugadorPorId(id: string): Jugador | undefined {
  return obtenerRoster().find((j) => j.id === id)
}

export function posicionesDe(jugador: Jugador): string[] {
  return jugador.posiciones?.length ? jugador.posiciones : [jugador.posicion]
}

/** Posiciones alternativas: las que van en la etiqueta lateral de la carta. */
export function posicionesAlternativas(jugador: Jugador): string[] {
  return posicionesDe(jugador).filter((p) => p !== jugador.posicion)
}

/**
 * Identidad de la persona detrás de la carta. Dos cartas del mismo jugador
 * (su oro y su mejorada) comparten persona, así el draft nunca ofrece las dos.
 */
export function personaDe(jugador: Jugador): string {
  return (jugador.persona ?? jugador.nombre).trim().toUpperCase()
}

export function ordenadosPorMedia(lista: Jugador[]): Jugador[] {
  return [...lista].sort((a, b) => b.media - a.media)
}
