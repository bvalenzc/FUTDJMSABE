import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import escudo from '../../assets/marca/escudo_djm.png'
import { FORMACIONES } from '../../config/juego'
import { jugadorPorId } from '../../juego/roster'
import { Carta } from '../../components/Carta/Carta'
// Mismo lienzo/estilo que el póster del Draft, sin capitán ni banco.
import '../Draft/PosterDraft.css'

type Descargas = { save: (p: { filename: string; data: Blob }) => Promise<unknown> }
type ClaudeGlobal = { use?: (nombre: string) => Promise<Descargas | null> }

function ventanaClaude(): ClaudeGlobal | undefined {
  return (window as unknown as { claude?: ClaudeGlobal }).claude
}

type Props = {
  formacion: string
  titulares: (string | null)[]
  media: number
  quimica: number
  quimicaTope: number
  onCerrar: () => void
}

export function PosterPlantilla({ formacion, titulares, media, quimica, quimicaTope, onCerrar }: Props) {
  const lienzo = useRef<HTMLDivElement>(null)
  const [estado, estadoSet] = useState<'listo' | 'generando' | 'error'>('listo')

  const slots = FORMACIONES[formacion]

  const guardar = async () => {
    if (!lienzo.current) return
    estadoSet('generando')
    try {
      const dataUrl = await toPng(lienzo.current, { pixelRatio: 2, cacheBust: true })
      const archivo = `futdjm-plantilla-${formacion.replace(/[^\dA-Za-z-]/g, '')}-${media}.png`
      const blob = await (await fetch(dataUrl)).blob()

      const descargas = await ventanaClaude()?.use?.('downloads')
      if (descargas) {
        await descargas.save({ filename: archivo, data: blob })
        estadoSet('listo')
        return
      }

      const imagen = new File([blob], archivo, { type: 'image/png' })
      const navegador = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (navegador.canShare?.({ files: [imagen] })) {
        await navigator.share({ files: [imagen], title: 'Mi plantilla FUTDJM' })
      } else {
        const enlace = document.createElement('a')
        enlace.href = dataUrl
        enlace.download = archivo
        enlace.click()
      }
      estadoSet('listo')
    } catch {
      estadoSet('error')
    }
  }

  return (
    <div className="poster" onClick={onCerrar}>
      <div className="poster__caja" onClick={(e) => e.stopPropagation()}>
        <div className="poster__lienzo" ref={lienzo}>
          <div className="poster__cabecera">
            <img src={escudo} alt="" aria-hidden="true" />
            <div>
              <span className="poster__eyebrow">Liga Flash · Temporada 2026</span>
              <h2>MI PLANTILLA</h2>
            </div>
            <div className="poster__numeros">
              <span>
                <strong>{media}</strong>media
              </span>
              <span>
                <strong>
                  {quimica}
                  <em>/{quimicaTope}</em>
                </strong>
                química
              </span>
            </div>
          </div>

          <div className="poster__cancha">
            {slots.map((slot, i) => {
              const jugador = titulares[i] ? jugadorPorId(titulares[i]!) : null
              return (
                <div
                  key={i}
                  className="poster__slot"
                  style={{ left: `${12 + slot.x * 0.76}%`, top: `${10 + slot.y * 0.8}%` }}
                >
                  {jugador && <Carta jugador={jugador} tamano={46} />}
                </div>
              )
            })}
          </div>

          <p className="poster__pie">{formacion} · DJM</p>
        </div>

        <div className="poster__acciones">
          <button type="button" className="boton-oro" onClick={guardar} disabled={estado === 'generando'}>
            {estado === 'generando' ? 'GENERANDO…' : 'GUARDAR IMAGEN'}
          </button>
          <button type="button" className="boton-linea" onClick={onCerrar}>
            CERRAR
          </button>
        </div>
        {estado === 'error' && <p className="poster__error">No se pudo generar la imagen. Probá de nuevo.</p>}
      </div>
    </div>
  )
}
