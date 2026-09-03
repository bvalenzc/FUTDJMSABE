import { useEffect, useMemo, useRef, useState } from 'react'
import { MEDIA_ESPECIAL, precioVenta, type Sobre } from '../../config/juego'
import { calcularRareza, COLOR_RAREZA } from '../../config/rareza'
import { abrirSobre } from '../../juego/sorteo'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { CartaAmpliada } from '../../components/CartaAmpliada/CartaAmpliada'
import { Moneda } from '../../components/Moneda/Moneda'
import type { Jugador } from '../../types/jugador'
import './AperturaSobre.css'

type Etapa = 'cerrado' | 'girando' | 'blanco' | 'media' | 'posicion' | 'carta' | 'todas'

type Props = {
  sobre: Sobre
  /** Se ejecuta al pedir la apertura; devolver false la cancela (sin monedas, sin stock). */
  alAbrir?: () => boolean
  /** Texto del botón cuando el sobre está cerrado. */
  textoBoton?: string
  /** false cuando no queda stock de este sobre: "OTRO SOBRE" manda a onSinMas en vez de reabrir. */
  quedanSobres?: boolean
  onSinMas?: () => void
}

const GIRO_NORMAL = 900
const GIRO_ESPECIAL = 700
const BLANCO = 500
const MEDIA = 1500
const POSICION = 800

export function AperturaSobre({ sobre, alAbrir, textoBoton = 'ABRIR SOBRE', quedanSobres, onSinMas }: Props) {
  const { guardado, agregarCartas, quitarCartas, agregarMonedas } = useJuego()

  const [etapa, etapaSet] = useState<Etapa>('cerrado')
  const [cartas, cartasSet] = useState<Jugador[]>([])
  const [repetidas, repetidasSet] = useState<string[]>([])
  const [cartaAmpliada, cartaAmpliadaSet] = useState<Jugador | null>(null)
  const temporizadores = useRef<number[]>([])

  useEffect(() => () => temporizadores.current.forEach(window.clearTimeout), [])

  const programar = (fn: () => void, ms: number) => {
    temporizadores.current.push(window.setTimeout(fn, ms))
  }

  // La mejor carta del sobre es la que se revela.
  const mejor = cartas[0]
  const rareza = mejor ? calcularRareza(mejor) : 'oro'
  const color = COLOR_RAREZA[rareza]
  const esEspecial = !!mejor && mejor.media >= MEDIA_ESPECIAL

  const abrir = () => {
    if (alAbrir && !alAbrir()) return

    const sacadas = abrirSobre(sobre.probs, sobre.cartas).sort((a, b) => b.media - a.media)
    const yaTenia = { ...guardado.coleccion }
    const dobles: string[] = []
    sacadas.forEach((j) => {
      if ((yaTenia[j.id] ?? 0) > 0) dobles.push(j.id)
      yaTenia[j.id] = (yaTenia[j.id] ?? 0) + 1
    })
    agregarCartas(sacadas.map((j) => j.id))

    cartasSet(sacadas)
    repetidasSet(dobles)
    etapaSet('girando')

    if (sacadas[0].media >= MEDIA_ESPECIAL) {
      programar(() => etapaSet('blanco'), GIRO_ESPECIAL)
      programar(() => etapaSet('media'), GIRO_ESPECIAL + BLANCO)
      programar(() => etapaSet('posicion'), GIRO_ESPECIAL + BLANCO + MEDIA)
      programar(() => etapaSet('carta'), GIRO_ESPECIAL + BLANCO + MEDIA + POSICION)
    } else {
      programar(() => etapaSet('carta'), GIRO_NORMAL)
    }
  }

  const totalRepetidas = useMemo(
    () => repetidas.reduce((s, id) => s + precioVenta(cartas.find((c) => c.id === id)?.media ?? 0), 0),
    [repetidas, cartas],
  )

  const reiniciar = () => {
    cartasSet([])
    repetidasSet([])
    etapaSet('cerrado')
  }

  const enBlanco = etapa === 'blanco' || etapa === 'media' || etapa === 'posicion'

  return (
    <div className={`apertura${enBlanco ? ' apertura--blanco' : ''}`}>
      {etapa === 'cerrado' && (
        <div className="apertura__centro">
          <button type="button" className="apertura__sobre-boton" onClick={abrir}>
            <ArteSobre sobre={sobre} />
          </button>
          <button type="button" className="boton-oro apertura__boton" onClick={abrir}>
            {textoBoton}
          </button>
        </div>
      )}

      {etapa === 'girando' && (
        <div className="apertura__centro">
          <div className={`apertura__giro${esEspecial ? ' apertura__giro--rapido' : ' apertura__giro--normal'}`}>
            <div className="apertura__cara apertura__cara--frente">
              <ArteSobre sobre={sobre} />
            </div>
            <div className="apertura__cara apertura__cara--dorso" style={{ ['--brillo' as string]: color }}>
              <span className="apertura__destellos" />
            </div>
          </div>
        </div>
      )}

      {enBlanco && mejor && (
        <div className="apertura__revelado">
          {etapa !== 'blanco' && <ContadorMedia valor={mejor.media} duracion={MEDIA} />}
          {etapa === 'posicion' && <span className="apertura__posicion">{mejor.posicion}</span>}
        </div>
      )}

      {etapa === 'carta' && mejor && (
        <div className="apertura__centro">
          <button type="button" className="apertura__carta-boton" onClick={() => cartaAmpliadaSet(mejor)}>
            <Carta jugador={mejor} tamano={236} className="apertura__carta" />
          </button>
          {repetidas.includes(mejor.id) && <span className="apertura__repetida">REPETIDA</span>}
          <button type="button" className="boton-oro apertura__boton" onClick={() => etapaSet('todas')}>
            VER LAS {cartas.length} CARTAS
          </button>
        </div>
      )}

      {etapa === 'todas' && (
        <div className="apertura__resumen">
          <div className="apertura__grilla">
            {cartas.map((j, i) => (
              <button
                key={j.id + i}
                type="button"
                className="apertura__carta-boton"
                onClick={() => cartaAmpliadaSet(j)}
              >
                <Carta jugador={j} tamano={122} />
              </button>
            ))}
          </div>
          {repetidas.length > 0 && (
            <button
              type="button"
              className="boton-oro apertura__boton"
              onClick={() => {
                if (!quitarCartas(repetidas)) return
                agregarMonedas(totalRepetidas)
                repetidasSet([])
              }}
            >
              VENDER {repetidas.length} REPETIDA{repetidas.length > 1 ? 'S' : ''} <Moneda tamano={14} />{' '}
              {totalRepetidas.toLocaleString('es-CL')}
            </button>
          )}
          <button
            type="button"
            className="boton-linea"
            onClick={quedanSobres === false ? onSinMas : reiniciar}
          >
            {quedanSobres === false ? 'IR A LA TIENDA' : 'OTRO SOBRE'}
          </button>
        </div>
      )}

      {cartaAmpliada && <CartaAmpliada jugador={cartaAmpliada} onCerrar={() => cartaAmpliadaSet(null)} />}
    </div>
  )
}

/** Diseño del sobre: mismas proporciones que una carta. */
function ArteSobre({ sobre }: { sobre: Sobre }) {
  return (
    <div className={`sobre-arte sobre-arte--${sobre.tema}`}>
      <span className="sobre-arte__brillo" />
      <span className="sobre-arte__trama" />
      <span className="sobre-arte__marco" />
      <span className="sobre-arte__esquina sobre-arte__esquina--si" />
      <span className="sobre-arte__esquina sobre-arte__esquina--sd" />
      <span className="sobre-arte__esquina sobre-arte__esquina--ii" />
      <span className="sobre-arte__esquina sobre-arte__esquina--id" />
      <span className="sobre-arte__djm">DJM</span>
      <span className="sobre-arte__nombre">{sobre.nombre}</span>
      <span className="sobre-arte__cartas">{sobre.cartas} cartas</span>
    </div>
  )
}

function ContadorMedia({ valor, duracion }: { valor: number; duracion: number }) {
  const [actual, actualSet] = useState(0)

  useEffect(() => {
    const desde = performance.now()
    let id = 0
    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - desde) / duracion)
      actualSet(Math.round(valor * avance))
      if (avance < 1) id = requestAnimationFrame(paso)
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [valor, duracion])

  return <span className="apertura__media">{actual}</span>
}
