import { useMemo, useState } from 'react'
import { precioVenta } from '../../config/juego'
import { jugadorPorId } from '../../juego/roster'
import { useJuego } from '../../juego/useJuego'
import { Carta } from '../../components/Carta/Carta'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { Moneda } from '../../components/Moneda/Moneda'
import { FiltrosPosicion, cumpleGrupo, type GrupoPosicion } from '../../components/Filtros/FiltrosPosicion'
import { BuscadorPie } from '../../components/Filtros/BuscadorPie'
import type { Jugador } from '../../types/jugador'
import './MiEquipo.css'

type Props = {
  onVolver: () => void
  onAbrirCarta: (id: string) => void
}

export function MiEquipo({ onVolver, onAbrirCarta }: Props) {
  const { guardado, quitarCartas, agregarMonedas } = useJuego()
  const [grupo, grupoSet] = useState<GrupoPosicion>('todos')
  const [busqueda, busquedaSet] = useState('')
  const [soloRepetidas, soloRepetidasSet] = useState(false)
  const [aviso, avisoSet] = useState<string | null>(null)

  const cartas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return Object.entries(guardado.coleccion)
      .map(([id, cantidad]) => ({ jugador: jugadorPorId(id), cantidad }))
      .filter((x): x is { jugador: Jugador; cantidad: number } => !!x.jugador)
      .filter((x) => cumpleGrupo(x.jugador, grupo))
      .filter((x) => !texto || x.jugador.nombre.toLowerCase().includes(texto))
      .filter((x) => !soloRepetidas || x.cantidad > 1)
      .sort((a, b) => b.jugador.media - a.jugador.media)
  }, [guardado.coleccion, grupo, busqueda, soloRepetidas])

  const todas = Object.entries(guardado.coleccion)
  const totalCartas = todas.reduce((s, [, n]) => s + n, 0)
  const repetidas = todas.reduce((s, [, n]) => s + Math.max(0, n - 1), 0)
  const valorRepetidas = todas.reduce((s, [id, n]) => {
    const j = jugadorPorId(id)
    return j ? s + precioVenta(j.media) * Math.max(0, n - 1) : s
  }, 0)

  const vender = (id: string, media: number) => {
    if (!quitarCartas([id])) return
    agregarMonedas(precioVenta(media))
    avisoSet(`+${precioVenta(media).toLocaleString('es-CL')}`)
    window.setTimeout(() => avisoSet(null), 1400)
  }

  const venderTodas = () => {
    const aQuitar: string[] = []
    todas.forEach(([id, n]) => {
      for (let i = 0; i < n - 1; i++) aQuitar.push(id)
    })
    if (!aQuitar.length || !quitarCartas(aQuitar)) return
    agregarMonedas(valorRepetidas)
    avisoSet(`+${valorRepetidas.toLocaleString('es-CL')}`)
    window.setTimeout(() => avisoSet(null), 1800)
  }

  return (
    <Pantalla
      titulo="Mi equipo"
      onVolver={onVolver}
      accion={
        <button
          type="button"
          className={`mi-equipo__toggle${soloRepetidas ? ' activo' : ''}`}
          onClick={() => soloRepetidasSet(!soloRepetidas)}
        >
          Repetidas
        </button>
      }
      pie={<BuscadorPie valor={busqueda} onCambio={busquedaSet} total={cartas.length} />}
    >
      <div className="mi-equipo__panel">
        <div className="mi-equipo__metricas">
          <span>
            <strong>{todas.length}</strong> distintas
          </span>
          <span>
            <strong>{totalCartas}</strong> en total
          </span>
          <span>
            <strong>{repetidas}</strong> repetidas
          </span>
        </div>
        {repetidas > 0 && (
          <button type="button" className="boton-oro mi-equipo__vender-todo" onClick={venderTodas}>
            Vender repetidas <Moneda tamano={14} /> {valorRepetidas.toLocaleString('es-CL')}
          </button>
        )}
      </div>

      <FiltrosPosicion valor={grupo} onCambio={grupoSet} />

      {cartas.length === 0 && (
        <p className="mi-equipo__vacio">
          {todas.length === 0
            ? 'Todavía no tenés cartas. Abrí un pack gratis para empezar.'
            : 'Ninguna carta tuya entra en ese filtro.'}
        </p>
      )}

      <div className="mi-equipo__grilla">
        {cartas.map(({ jugador, cantidad }) => (
          <div key={jugador.id} className="mi-equipo__slot">
            <button type="button" className="mi-equipo__carta" onClick={() => onAbrirCarta(jugador.id)}>
              <Carta jugador={jugador} tamano={94} />
              {cantidad > 1 && <span className="mi-equipo__cantidad">×{cantidad}</span>}
            </button>
            {cantidad > 1 ? (
              <button type="button" className="mi-equipo__vender" onClick={() => vender(jugador.id, jugador.media)}>
                <Moneda tamano={11} /> {precioVenta(jugador.media).toLocaleString('es-CL')}
              </button>
            ) : (
              <span className="mi-equipo__unica">única</span>
            )}
          </div>
        ))}
      </div>

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </Pantalla>
  )
}
