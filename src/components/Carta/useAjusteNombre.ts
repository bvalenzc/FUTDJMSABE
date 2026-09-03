import { useLayoutEffect, useRef } from 'react'

const TAMANO_MAX = 36
const TAMANO_MIN = 18

/** Reduce el font-size del nombre hasta que entre en una sola línea sin desbordar. */
export function useAjusteNombre(dependencia: string) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    let tamano = TAMANO_MAX
    el.style.fontSize = `${tamano}px`

    while (el.scrollWidth > el.clientWidth && tamano > TAMANO_MIN) {
      tamano -= 1
      el.style.fontSize = `${tamano}px`
    }
  }, [dependencia])

  return ref
}
