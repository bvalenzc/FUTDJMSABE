import type { Jugador } from '../types/jugador'
import { BANDAS_MEDIA, FORMACIONES, FORMACIONES_POR_DRAFT, OPCIONES_POR_SLOT } from '../config/juego'
import { obtenerRoster, personaDe, posicionesDe } from './roster'

function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Da más peso a las cartas que ya tienen foto recortada, como el juego original. */
function eleccionPonderada(candidatos: Jugador[], n: number): Jugador[] {
  const bolsa = candidatos.map((j) => ({ j, peso: j.foto ? 3 : 1 }))
  const salida: Jugador[] = []
  while (salida.length < n && bolsa.length) {
    const total = bolsa.reduce((s, x) => s + x.peso, 0)
    let r = Math.random() * total
    let i = 0
    for (; i < bolsa.length - 1; i++) {
      r -= bolsa[i].peso
      if (r <= 0) break
    }
    salida.push(bolsa.splice(i, 1)[0].j)
  }
  return salida
}

/**
 * Cartas disponibles para el draft: descarta a las personas ya elegidas y deja
 * una sola carta por persona, así nunca aparecen dos versiones del mismo jugador
 * (su oro y su mejorada) en la misma tanda de opciones.
 */
function sinRepetirPersona(personasUsadas: string[]): Jugador[] {
  const usadas = new Set(personasUsadas)
  const porPersona = new Map<string, Jugador[]>()
  for (const j of obtenerRoster()) {
    const persona = personaDe(j)
    if (usadas.has(persona)) continue
    const lista = porPersona.get(persona)
    if (lista) lista.push(j)
    else porPersona.set(persona, [j])
  }
  return [...porPersona.values()].map((cartas) => cartas[Math.floor(Math.random() * cartas.length)])
}

/** Agrupa por nivel para que las opciones no mezclen rarezas al azar. */
export function eleccionPorNivel(candidatos: Jugador[], n: number): Jugador[] {
  if (candidatos.length <= n) return eleccionPonderada(candidatos, n)
  const ordenados = [...candidatos].sort((a, b) => b.media - a.media)
  const tamano = Math.ceil(ordenados.length / 3)
  const grupos = [
    ordenados.slice(0, tamano),
    ordenados.slice(tamano, tamano * 2),
    ordenados.slice(tamano * 2),
  ].filter((g) => g.length)
  const grupo = grupos[Math.floor(Math.random() * grupos.length)]
  const elegidos = eleccionPonderada(grupo, n)
  if (elegidos.length < n) {
    const resto = candidatos.filter((j) => !elegidos.includes(j))
    elegidos.push(...eleccionPonderada(resto, n - elegidos.length))
  }
  return elegidos
}

export function formacionesAlAzar(): string[] {
  return mezclar(Object.keys(FORMACIONES)).slice(0, FORMACIONES_POR_DRAFT)
}

/** Opciones para un slot de la cancha: prioriza jugadores de esa posición. */
export function opcionesParaSlot(rol: string, personasUsadas: string[]): Jugador[] {
  const libres = sinRepetirPersona(personasUsadas)
  const enPosicion = libres.filter((j) => posicionesDe(j).includes(rol))
  let elegidos = eleccionPorNivel(enPosicion, OPCIONES_POR_SLOT)
  if (elegidos.length < OPCIONES_POR_SLOT) {
    const media = elegidos.length ? elegidos.reduce((s, j) => s + j.media, 0) / elegidos.length : 80
    const fuera = libres
      .filter((j) => !elegidos.includes(j) && !posicionesDe(j).includes(rol))
      .sort((a, b) => Math.abs(a.media - media) - Math.abs(b.media - media))
    elegidos = elegidos.concat(fuera.slice(0, OPCIONES_POR_SLOT - elegidos.length))
  }
  return elegidos
}

export function opcionesParaBanco(personasUsadas: string[]): Jugador[] {
  return eleccionPorNivel(sinRepetirPersona(personasUsadas), OPCIONES_POR_SLOT)
}

export function candidatosCapitan(formacion: string): Jugador[] {
  const roles = new Set(FORMACIONES[formacion].map((s) => s.role))
  const disponibles = sinRepetirPersona([])
  const elegibles = disponibles.filter((j) => posicionesDe(j).some((p) => roles.has(p)))
  return eleccionPorNivel(elegibles.length ? elegibles : disponibles, OPCIONES_POR_SLOT)
}

/** Elige una carta de un sobre según las probabilidades por banda de media. */
export function cartaDeSobre(probs: number[]): Jugador {
  const r = Math.random()
  let acumulado = 0
  let banda = probs.length - 1
  for (let i = 0; i < probs.length; i++) {
    acumulado += probs[i]
    if (r <= acumulado) {
      banda = i
      break
    }
  }
  for (let salto = 0; salto < BANDAS_MEDIA.length; salto++) {
    for (const i of [banda - salto, banda + salto].filter((x) => x >= 0 && x < BANDAS_MEDIA.length)) {
      const { min, max } = BANDAS_MEDIA[i]
      const candidatos = obtenerRoster().filter((j) => j.media >= min && j.media <= max)
      if (candidatos.length) return candidatos[Math.floor(Math.random() * candidatos.length)]
    }
  }
  const todos = obtenerRoster()
  return todos[Math.floor(Math.random() * todos.length)]
}

/**
 * Un sobre nunca trae dos cartas de la misma persona: si el sorteo repite a
 * alguien, se vuelve a tirar; si aun así no aparece nadie nuevo, se completa
 * con la carta más cercana en media de una persona que falte.
 */
export function abrirSobre(probs: number[], cartas: number): Jugador[] {
  const salida: Jugador[] = []
  const personas = new Set<string>()

  for (let i = 0; i < cartas; i++) {
    let elegida: Jugador | null = null

    for (let intento = 0; intento < 30 && !elegida; intento++) {
      const candidata = cartaDeSobre(probs)
      if (!personas.has(personaDe(candidata))) elegida = candidata
    }

    if (!elegida) {
      const referencia = salida.length ? salida[salida.length - 1].media : 80
      const libres = obtenerRoster().filter((j) => !personas.has(personaDe(j)))
      if (!libres.length) break
      elegida = libres.sort((a, b) => Math.abs(a.media - referencia) - Math.abs(b.media - referencia))[0]
    }

    personas.add(personaDe(elegida))
    salida.push(elegida)
  }

  return salida
}
