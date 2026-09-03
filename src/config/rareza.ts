import type { Jugador, Rareza } from '../types/jugador'

/**
 * Cortes de media que definen la rareza del plantel. Se ajustan acá, no en los datos:
 * media <= plataHasta        -> plata
 * plataHasta < media <= oroHasta -> oro
 * media > oroHasta            -> oro-raro
 */
export const CORTES_RAREZA = {
  plataHasta: 74,
  oroHasta: 80,
}

export function calcularRareza(jugador: Jugador): Rareza {
  // Las cartas creadas a mano fijan su rareza; el resto sale de la media.
  if (jugador.rareza) return jugador.rareza
  if (jugador.tipo === 'parche') return 'parche'
  if (jugador.media <= CORTES_RAREZA.plataHasta) return 'plata'
  if (jugador.media <= CORTES_RAREZA.oroHasta) return 'oro'
  return 'oro-raro'
}

/** Encuadre por defecto, en px sobre la ventana de 250x320 de la figura. */
export const ENCUADRE_DEFECTO = { alto: 290, abajo: 0, x: 0 }

/** Color característico de cada rareza, para luces y confeti de la apertura. */
export const COLOR_RAREZA: Record<Rareza, string> = {
  plata: '#dfe6ec',
  oro: '#f0cd6f',
  'oro-raro': '#ffdf7a',
  mvp: '#f0dca6',
  'primer-gol': '#93e0ac',
  djdor: '#e3c069',
  flashback: '#9fdcf4',
  parche: '#e0563f',
}
