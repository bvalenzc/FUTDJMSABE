import { useState } from 'react'
import { RAREZAS, type Jugador, type Rareza, type TipoStats } from '../../types/jugador'
import { ETIQUETAS_ARQUERO, ETIQUETAS_CAMPO } from '../../config/statsLabels'
import { useJuego } from '../../juego/useJuego'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { Carta } from '../../components/Carta/Carta'
import './Admin.css'

type Props = { onVolver: () => void }

const CLAVE = '1234'
const POSICIONES = ['ARQ', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'MI', 'MD', 'DC']

export function Admin({ onVolver }: Props) {
  const [clave, claveSet] = useState('')
  const [entro, entroSet] = useState(false)
  const [error, errorSet] = useState(false)

  if (!entro) {
    return (
      <Pantalla titulo="Admin" onVolver={onVolver}>
        <form
          className="admin__acceso"
          onSubmit={(e) => {
            e.preventDefault()
            if (clave === CLAVE) entroSet(true)
            else {
              errorSet(true)
              claveSet('')
            }
          }}
        >
          <p className="rotulo">Contraseña</p>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={clave}
            onChange={(e) => {
              claveSet(e.target.value)
              errorSet(false)
            }}
            aria-label="Contraseña de admin"
          />
          {error && <span className="admin__error">Contraseña incorrecta</span>}
          <button type="submit" className="boton-oro">
            ENTRAR
          </button>
        </form>
      </Pantalla>
    )
  }

  return <PanelAdmin onVolver={onVolver} />
}

function PanelAdmin({ onVolver }: { onVolver: () => void }) {
  const { guardado, crearCarta, borrarCartaPropia, agregarCartas } = useJuego()

  const [nombre, nombreSet] = useState('')
  const [posicion, posicionSet] = useState('MC')
  const [rareza, rarezaSet] = useState<Rareza>('oro-raro')
  const [tipoStats, tipoStatsSet] = useState<TipoStats>('campo')
  const [valores, valoresSet] = useState<number[]>([80, 80, 80, 80, 80, 80])
  const [fotoUrl, fotoUrlSet] = useState<string | undefined>()
  const [aviso, avisoSet] = useState<string | null>(null)

  const etiquetas = tipoStats === 'arquero' ? ETIQUETAS_ARQUERO : ETIQUETAS_CAMPO
  const media = Math.round(valores.reduce((s, v) => s + v, 0) / valores.length)

  const vistaPrevia: Jugador = {
    id: 'vista-previa',
    nombre: nombre.trim() || 'NOMBRE',
    posicion,
    posiciones: [posicion],
    tipo: 'plantel',
    tipoStats,
    media,
    rareza,
    fotoUrl,
    stats: Object.fromEntries(etiquetas.map(([clave], i) => [clave, valores[i]])) as Jugador['stats'],
  }

  const elegirImagen = async (archivo: File) => {
    const dataUrl = await comprimirImagen(archivo, 700)
    fotoUrlSet(dataUrl)
  }

  const guardar = () => {
    const limpio = nombre.trim().toUpperCase()
    if (!limpio) {
      avisoSet('Poné un nombre')
      window.setTimeout(() => avisoSet(null), 1800)
      return
    }
    const id = `propia-${limpio.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
    const carta: Jugador = { ...vistaPrevia, id, nombre: limpio, propia: true }
    if (!crearCarta(carta)) {
      avisoSet('Ya existe una carta con ese id')
      window.setTimeout(() => avisoSet(null), 1800)
      return
    }
    agregarCartas([id])
    avisoSet(`${limpio} creada y agregada a Mi equipo`)
    window.setTimeout(() => avisoSet(null), 2400)
    nombreSet('')
    fotoUrlSet(undefined)
  }

  return (
    <Pantalla titulo="Admin · Cartas" onVolver={onVolver}>
      <div className="admin">
        <div className="admin__previa">
          <Carta jugador={vistaPrevia} tamano={168} />
          <span className="admin__media">Media {media}</span>
        </div>

        <label className="admin__campo">
          <span className="rotulo">Nombre</span>
          <input value={nombre} onChange={(e) => nombreSet(e.target.value)} placeholder="Ej: VARELA" />
        </label>

        <div className="admin__fila">
          <label className="admin__campo">
            <span className="rotulo">Posición</span>
            <select
              value={posicion}
              onChange={(e) => {
                posicionSet(e.target.value)
                tipoStatsSet(e.target.value === 'ARQ' ? 'arquero' : 'campo')
              }}
            >
              {POSICIONES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="admin__campo">
            <span className="rotulo">Tipo de carta</span>
            <select value={rareza} onChange={(e) => rarezaSet(e.target.value as Rareza)}>
              {RAREZAS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin__campo">
          <span className="rotulo">Estadísticas</span>
          <div className="admin__stats">
            {etiquetas.map(([, etiqueta], i) => (
              <label key={etiqueta} className="admin__stat">
                <span>{etiqueta}</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={valores[i]}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(99, Number(e.target.value) || 0))
                    valoresSet(valores.map((v, k) => (k === i ? n : v)))
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <label className="admin__campo">
          <span className="rotulo">Imagen del jugador</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (archivo) void elegirImagen(archivo)
            }}
          />
          <small>Ideal: PNG con fondo transparente. Se achica a 700px de alto.</small>
        </label>

        <button type="button" className="boton-oro admin__guardar" onClick={guardar}>
          CREAR CARTA
        </button>

        {guardado.cartasPropias.length > 0 && (
          <section className="admin__lista">
            <p className="rotulo">Cartas creadas · {guardado.cartasPropias.length}</p>
            {guardado.cartasPropias.map((c) => (
              <div key={c.id} className="admin__item">
                <Carta jugador={c} tamano={72} />
                <div>
                  <strong>{c.nombre}</strong>
                  <span>
                    {c.posicion} · media {c.media}
                  </span>
                </div>
                <button type="button" className="admin__borrar" onClick={() => borrarCartaPropia(c.id)}>
                  Borrar
                </button>
              </div>
            ))}
          </section>
        )}
      </div>

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </Pantalla>
  )
}

/** Achica la imagen antes de guardarla: una foto de cámara llena el localStorage. */
function comprimirImagen(archivo: File, altoMax: number): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onerror = () => rechazar(lector.error)
    lector.onload = () => {
      const img = new Image()
      img.onerror = () => rechazar(new Error('imagen inválida'))
      img.onload = () => {
        const escala = Math.min(1, altoMax / img.height)
        const lienzo = document.createElement('canvas')
        lienzo.width = Math.round(img.width * escala)
        lienzo.height = Math.round(img.height * escala)
        lienzo.getContext('2d')!.drawImage(img, 0, 0, lienzo.width, lienzo.height)
        resolver(lienzo.toDataURL('image/png'))
      }
      img.src = lector.result as string
    }
    lector.readAsDataURL(archivo)
  })
}
