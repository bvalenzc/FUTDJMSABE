import { useEffect, useMemo, useState } from 'react'
import type { EquipoLiga } from '../../config/liga'
import type { Jugador, StatsCampo } from '../../types/jugador'
import { Carta } from '../Carta/Carta'
import { EscudoEquipo } from '../EscudoEquipo/EscudoEquipo'
import './Minijuego.css'
import './MinijuegoPase.css'

const PERIODO_MS = 1300
const ANCHO_MIN = 16
const ANCHO_MAX = 54

type Props = {
  pasador: Jugador
  receptor: Jugador
  rival: EquipoLiga
  /** true si el receptor terminó anotando el gol. */
  onResuelto: (golAnotado: boolean) => void
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Probabilidad de gol según la media del que recibe el pase. */
function probabilidadGol(media: number): number {
  if (media >= 94) return 0.5
  if (media >= 86) return 0.2
  if (media >= 81) return 0.1
  return 0.05
}

/** Minijuego "pase-gol": hay que soltar la potencia con la aguja dentro del
 *  tramo marcado por los dos cursores rojos. Cuanto mejor pasa el jugador que
 *  la ejecuta, más ancho es ese tramo. Si el pase sale bien, se juega la
 *  definición del receptor con la probabilidad de gol de su media. */
export function MinijuegoPase({ pasador, receptor, rival, onResuelto }: Props) {
  const pas = (pasador.stats as StatsCampo).pas ?? pasador.media

  const objetivo = useMemo(() => {
    const ancho = clamp(ANCHO_MIN + ((pas - 65) / (99 - 65)) * (ANCHO_MAX - ANCHO_MIN), ANCHO_MIN, ANCHO_MAX)
    const centro = 26 + Math.random() * 48
    const lo = clamp(centro - ancho / 2, 3, 97)
    const hi = clamp(centro + ancho / 2, 3, 97)
    return { lo, hi }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const golAnotado = useMemo(() => Math.random() < probabilidadGol(receptor.media), [receptor])

  const [fase, faseSet] = useState<'potencia' | 'pase' | 'definicion' | 'gol'>('potencia')
  const [posicion, posicionSet] = useState(0)
  const [detenida, detenidaSet] = useState<number | null>(null)
  const [acerto, acertoSet] = useState(false)

  useEffect(() => {
    if (fase !== 'potencia') return
    const inicio = performance.now()
    let raf = 0
    const paso = (ahora: number) => {
      const t = ((ahora - inicio) % PERIODO_MS) / PERIODO_MS
      posicionSet(t < 0.5 ? t * 200 : 200 - t * 200)
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [fase])

  const golpear = () => {
    if (detenida !== null) return
    const congelada = posicion
    const paseOk = congelada >= objetivo.lo && congelada <= objetivo.hi
    detenidaSet(congelada)
    acertoSet(paseOk)
    faseSet('pase')

    window.setTimeout(() => {
      if (!paseOk) {
        window.setTimeout(() => onResuelto(false), 900)
        return
      }
      faseSet('definicion')
      window.setTimeout(() => {
        faseSet('gol')
        window.setTimeout(() => onResuelto(golAnotado), 1300)
      }, 900)
    }, 900)
  }

  const mostrada = detenida ?? posicion

  return (
    <div className="minijuego">
      <p className="eyebrow minijuego__titulo">PASE-GOL</p>

      <div className="minijuego__duelo">
        <div className="minijuego__lado">
          <Carta jugador={pasador} tamano={70} />
        </div>
        <span className="minijuego__vs">→</span>
        <div className="minijuego__lado">
          <Carta jugador={receptor} tamano={70} />
        </div>
      </div>

      {fase === 'potencia' && <p className="pase__ayuda">Tocá PASAR cuando la aguja esté entre las marcas rojas.</p>}

      <div className={`pase__barra${fase !== 'potencia' ? ' pase__barra--quieta' : ''}`}>
        <span
          className="pase__objetivo"
          style={{ left: `${objetivo.lo}%`, width: `${objetivo.hi - objetivo.lo}%` }}
        />
        <span className="pase__cursor" style={{ left: `${objetivo.lo}%` }} />
        <span className="pase__cursor" style={{ left: `${objetivo.hi}%` }} />
        <span
          className={`pase__aguja${fase !== 'potencia' ? (acerto ? ' pase__aguja--ok' : ' pase__aguja--fallo') : ''}`}
          style={{ left: `${mostrada}%` }}
        />
      </div>

      {fase === 'potencia' && (
        <button type="button" className="boton-oro" onClick={golpear}>
          PASAR
        </button>
      )}

      {fase === 'pase' && (
        <p className={`minijuego__resultado${acerto ? ' minijuego__resultado--exito' : ' minijuego__resultado--fallo'}`}>
          {acerto ? 'PASE PRECISO' : 'PASE IMPRECISO'}
        </p>
      )}

      {fase === 'definicion' && <p className="minijuego__resultado">{receptor.nombre} DEFINE…</p>}

      {fase === 'gol' && (
        <p className={`minijuego__resultado${golAnotado ? ' minijuego__resultado--exito' : ' minijuego__resultado--fallo'}`}>
          {golAnotado ? '¡GOL!' : 'LA TAPA EL ARQUERO'}
        </p>
      )}

      <div className="minijuego__lado minijuego__lado--rival">
        <EscudoEquipo equipo={rival} tamano={40} />
        <span>{rival.nombre}</span>
      </div>
    </div>
  )
}
