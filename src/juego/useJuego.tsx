import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { escribirGuardado, GUARDADO_INICIAL, leerGuardado, type DraftGuardado, type Guardado } from './estado'
import { ligaInicial, type LigaGuardado } from './liga'
import { GRUPO_DJM } from '../config/liga'
import { sincronizarPropias } from './roster'
import type { Jugador } from '../types/jugador'

type Acciones = {
  guardado: Guardado
  crearCarta: (carta: Jugador) => boolean
  borrarCartaPropia: (id: string) => void
  agregarMonedas: (n: number) => void
  gastarMonedas: (n: number) => boolean
  agregarCartas: (ids: string[]) => void
  quitarCartas: (ids: string[]) => boolean
  agregarSobres: (sobreId: string, cantidad: number) => void
  consumirSobre: (sobreId: string) => boolean
  guardarDraft: (draft: DraftGuardado) => void
  borrarDraft: (id: string) => void
  marcarPlantilla: (plantillaId: string) => void
  marcarSbcReclamado: (sbcId: string) => void
  registrarPackGratis: () => void
  /** Manda el equipo recién armado en el draft a la liga, listo para jugar la próxima fecha. */
  enviarEquipoALiga: (draft: DraftGuardado) => void
  guardarResultadoLiga: (liga: LigaGuardado) => void
  reiniciar: () => void
}

const Contexto = createContext<Acciones | null>(null)

export function ProveedorJuego({ children }: { children: ReactNode }) {
  const [guardado, setGuardado] = useState<Guardado>(() => {
    const inicial = leerGuardado()
    // El roster tiene que conocer las cartas propias antes del primer render.
    sincronizarPropias(inicial.cartasPropias)
    return inicial
  })

  useEffect(() => {
    escribirGuardado(guardado)
  }, [guardado])

  useEffect(() => {
    sincronizarPropias(guardado.cartasPropias)
  }, [guardado.cartasPropias])

  const agregarMonedas = useCallback((n: number) => {
    setGuardado((g) => ({ ...g, monedas: Math.max(0, g.monedas + n) }))
  }, [])

  const gastarMonedas = useCallback((n: number) => {
    let ok = false
    setGuardado((g) => {
      if (g.monedas < n) return g
      ok = true
      return { ...g, monedas: g.monedas - n }
    })
    return ok
  }, [])

  const agregarCartas = useCallback((ids: string[]) => {
    setGuardado((g) => {
      const coleccion = { ...g.coleccion }
      ids.forEach((id) => {
        coleccion[id] = (coleccion[id] ?? 0) + 1
      })
      return { ...g, coleccion }
    })
  }, [])

  const quitarCartas = useCallback((ids: string[]) => {
    let ok = false
    setGuardado((g) => {
      const coleccion = { ...g.coleccion }
      const falta = ids.some((id) => {
        const disponibles = coleccion[id] ?? 0
        const pedidas = ids.filter((x) => x === id).length
        return disponibles < pedidas
      })
      if (falta) return g
      ids.forEach((id) => {
        coleccion[id] = (coleccion[id] ?? 0) - 1
        if (coleccion[id] <= 0) delete coleccion[id]
      })
      ok = true
      return { ...g, coleccion }
    })
    return ok
  }, [])

  const agregarSobres = useCallback((sobreId: string, cantidad: number) => {
    setGuardado((g) => ({
      ...g,
      misSobres: { ...g.misSobres, [sobreId]: (g.misSobres[sobreId] ?? 0) + cantidad },
    }))
  }, [])

  const consumirSobre = useCallback((sobreId: string) => {
    let ok = false
    setGuardado((g) => {
      const disponibles = g.misSobres[sobreId] ?? 0
      if (disponibles <= 0) return g
      ok = true
      const misSobres = { ...g.misSobres, [sobreId]: disponibles - 1 }
      if (misSobres[sobreId] <= 0) delete misSobres[sobreId]
      return { ...g, misSobres }
    })
    return ok
  }, [])

  const guardarDraft = useCallback((draft: DraftGuardado) => {
    setGuardado((g) => ({ ...g, drafts: [draft, ...g.drafts].slice(0, 30) }))
  }, [])

  const borrarDraft = useCallback((id: string) => {
    setGuardado((g) => ({ ...g, drafts: g.drafts.filter((d) => d.id !== id) }))
  }, [])

  const marcarPlantilla = useCallback((plantillaId: string) => {
    setGuardado((g) => ({ ...g, plantillasHechas: { ...g.plantillasHechas, [plantillaId]: true } }))
  }, [])

  const marcarSbcReclamado = useCallback((sbcId: string) => {
    setGuardado((g) => ({ ...g, sbcReclamados: { ...g.sbcReclamados, [sbcId]: true } }))
  }, [])

  const registrarPackGratis = useCallback(() => {
    setGuardado((g) => ({ ...g, ultimoPackGratis: Date.now() }))
  }, [])

  const enviarEquipoALiga = useCallback((draft: DraftGuardado) => {
    setGuardado((g) => ({
      ...g,
      liga: { ...(g.liga ?? ligaInicial(GRUPO_DJM)), equipoPendiente: draft },
    }))
  }, [])

  const guardarResultadoLiga = useCallback((liga: LigaGuardado) => {
    setGuardado((g) => ({ ...g, liga }))
  }, [])

  const crearCarta = useCallback((carta: Jugador) => {
    let ok = false
    setGuardado((g) => {
      if (g.cartasPropias.some((c) => c.id === carta.id)) return g
      ok = true
      return { ...g, cartasPropias: [...g.cartasPropias, carta] }
    })
    return ok
  }, [])

  const borrarCartaPropia = useCallback((id: string) => {
    setGuardado((g) => {
      const coleccion = { ...g.coleccion }
      delete coleccion[id]
      return { ...g, cartasPropias: g.cartasPropias.filter((c) => c.id !== id), coleccion }
    })
  }, [])

  const reiniciar = useCallback(() => {
    setGuardado({ ...GUARDADO_INICIAL, coleccion: {}, misSobres: { gratis: 1 }, drafts: [], liga: null })
  }, [])

  const valor = useMemo<Acciones>(
    () => ({
      guardado,
      crearCarta,
      borrarCartaPropia,
      agregarMonedas,
      gastarMonedas,
      agregarCartas,
      quitarCartas,
      agregarSobres,
      consumirSobre,
      guardarDraft,
      borrarDraft,
      marcarPlantilla,
      marcarSbcReclamado,
      registrarPackGratis,
      enviarEquipoALiga,
      guardarResultadoLiga,
      reiniciar,
    }),
    [
      guardado,
      crearCarta,
      borrarCartaPropia,
      agregarMonedas,
      gastarMonedas,
      agregarCartas,
      quitarCartas,
      agregarSobres,
      consumirSobre,
      guardarDraft,
      borrarDraft,
      marcarPlantilla,
      marcarSbcReclamado,
      registrarPackGratis,
      enviarEquipoALiga,
      guardarResultadoLiga,
      reiniciar,
    ],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useJuego(): Acciones {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useJuego necesita estar dentro de ProveedorJuego')
  return ctx
}
