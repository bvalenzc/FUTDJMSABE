/**
 * Herramienta interna (solo dev): recorta el fondo de las fotos de los jugadores
 * y las manda al servidor local que las guarda en src/assets/recortes.
 * No forma parte de la app: se usa desde recorte.html.
 */
import { removeBackground } from '@imgly/background-removal'

const modulos = import.meta.glob('../../fotos-originales/*.{jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/**
 * Zona del jugador en la foto original (fracciones 0-1). Sirve para dejar fuera
 * a rivales y gente del fondo antes de pasar el quitafondos, que si no los
 * recorta a todos.
 */
const ZONAS: Record<string, { x0: number; x1: number; y0: number; y1: number }> = {
  lucho: { x0: 0.15, x1: 0.56, y0: 0.02, y1: 0.92 },
  vanti: { x0: 0.27, x1: 0.58, y0: 0.1, y1: 0.9 },
  rafinha: { x0: 0.33, x1: 0.68, y0: 0.09, y1: 0.92 },
  valenz: { x0: 0.28, x1: 0.66, y0: 0.06, y1: 0.88 },
  puente: { x0: 0.36, x1: 0.75, y0: 0.1, y1: 0.88 },
  costas: { x0: 0.52, x1: 0.76, y0: 0.1, y1: 0.74 },
  mau: { x0: 0.26, x1: 0.84, y0: 0.05, y1: 0.93 },
  valenzflash: { x0: 0.352, x1: 0.492, y0: 0.2, y1: 0.675 },
}

const log = (texto: string) => {
  const el = document.getElementById('log')
  if (el) el.textContent += texto + '\n'
  console.log(texto)
}

/** Recorta la zona del jugador y limita el alto para que el PNG no pese de más. */
async function prepararOriginal(url: string, clave: string): Promise<Blob> {
  const respuesta = await fetch(url)
  const blob = await respuesta.blob()
  const bitmap = await createImageBitmap(blob)
  const zona = ZONAS[clave] ?? { x0: 0, x1: 1, y0: 0, y1: 1 }

  const sx = Math.round(bitmap.width * zona.x0)
  const sy = Math.round(bitmap.height * zona.y0)
  const sw = Math.round(bitmap.width * (zona.x1 - zona.x0))
  const sh = Math.round(bitmap.height * (zona.y1 - zona.y0))

  const ALTO_MAX = 900
  const escala = Math.min(1, ALTO_MAX / sh)
  const dw = Math.round(sw * escala)
  const dh = Math.round(sh * escala)

  const lienzo = document.createElement('canvas')
  lienzo.width = dw
  lienzo.height = dh
  lienzo.getContext('2d')!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh)
  return await new Promise<Blob>((resolver) => lienzo.toBlob((b) => resolver(b!), 'image/png'))
}

async function recortar(soloEstas?: string[]) {
  const entradas = Object.entries(modulos).filter(([ruta]) => {
    const clave = nombreDe(ruta)
    return !soloEstas || soloEstas.includes(clave)
  })
  log(`${entradas.length} fotos por procesar`)

  for (const [ruta, url] of entradas) {
    const clave = nombreDe(ruta)
    try {
      log(`procesando ${clave}...`)
      const original = await prepararOriginal(url, clave)
      const blob = await removeBackground(original, { output: { format: 'image/png' } })
      const respuesta = await fetch(`http://localhost:5199/guardar?nombre=${clave}.png`, {
        method: 'POST',
        body: blob,
      })
      log(`  ${clave}: ${respuesta.ok ? 'guardado' : 'error al guardar'} (${Math.round(blob.size / 1024)} KB)`)
    } catch (e) {
      log(`  ${clave}: FALLÓ — ${(e as Error).message}`)
    }
  }
  log('listo')
  return 'listo'
}

function nombreDe(ruta: string): string {
  return ruta.split('/').pop()!.replace(/\.[^.]+$/, '')
}

declare global {
  interface Window {
    __recortar: typeof recortar
    __recorteEstado: string
  }
}

window.__recortar = recortar
window.__recorteEstado = 'listo'
