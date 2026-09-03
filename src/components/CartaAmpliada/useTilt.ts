import { useRef } from 'react'

const MAX_GRADOS = 10

/** Tilt 3D sutil siguiendo el puntero; no hace nada si el usuario prefiere menos movimiento. */
export function useTilt() {
  const ref = useRef<HTMLDivElement>(null)
  const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const alMoverPuntero = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefiereMenosMovimiento) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `rotateY(${px * MAX_GRADOS * 2}deg) rotateX(${py * -MAX_GRADOS * 2}deg)`
  }

  const alSalirPuntero = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'rotateY(0deg) rotateX(0deg)'
  }

  return { ref, alMoverPuntero, alSalirPuntero }
}
