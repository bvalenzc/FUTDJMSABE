import { useCallback, useEffect, useState } from 'react'

export type Pantalla =
  | { tipo: 'inicio' }
  | { tipo: 'coleccion' }
  | { tipo: 'detalle'; id: string }
  | { tipo: 'tienda' }
  | { tipo: 'sobre'; sobreId: string }
  | { tipo: 'mercado' }
  | { tipo: 'miequipo' }
  | { tipo: 'draft' }
  | { tipo: 'sbc' }
  | { tipo: 'packs' }
  | { tipo: 'admin' }
  | { tipo: 'drafts' }

const INICIO: Pantalla = { tipo: 'inicio' }

export function useNavegacion() {
  const [pantalla, setPantalla] = useState<Pantalla>(() => (history.state as Pantalla) ?? INICIO)

  useEffect(() => {
    if (!history.state) {
      history.replaceState(INICIO, '')
    }
    const alVolverAtras = (evento: PopStateEvent) => {
      setPantalla((evento.state as Pantalla) ?? INICIO)
    }
    window.addEventListener('popstate', alVolverAtras)
    return () => window.removeEventListener('popstate', alVolverAtras)
  }, [])

  const ir = useCallback((siguiente: Pantalla) => {
    history.pushState(siguiente, '')
    setPantalla(siguiente)
  }, [])

  const volver = useCallback(() => {
    history.back()
  }, [])

  return { pantalla, ir, volver }
}
