import { useMemo, useState } from 'react'
import type { Jugador } from '../../types/jugador'
import { Carta } from '../../components/Carta/Carta'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { FiltrosPosicion, type GrupoPosicion, cumpleGrupo } from '../../components/Filtros/FiltrosPosicion'
import { BuscadorPie } from '../../components/Filtros/BuscadorPie'
import './Coleccion.css'

type Props = {
  jugadores: Jugador[]
  onVolver: () => void
  onAbrirCarta: (id: string) => void
}

type Orden = 'media' | 'nombre'

export function Coleccion({ jugadores, onVolver, onAbrirCarta }: Props) {
  const [grupo, grupoSet] = useState<GrupoPosicion>('todos')
  const [busqueda, busquedaSet] = useState('')
  const [orden, ordenSet] = useState<Orden>('media')

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return jugadores
      .filter((j) => cumpleGrupo(j, grupo))
      .filter((j) => !texto || j.nombre.toLowerCase().includes(texto))
      .sort((a, b) => (orden === 'media' ? b.media - a.media : a.nombre.localeCompare(b.nombre)))
  }, [jugadores, grupo, busqueda, orden])

  const plantel = visibles.filter((j) => j.tipo === 'plantel')
  const parches = visibles.filter((j) => j.tipo === 'parche')

  return (
    <Pantalla
      titulo="Últimas cartas"
      onVolver={onVolver}
      accion={
        <button
          type="button"
          className="coleccion__orden"
          onClick={() => ordenSet(orden === 'media' ? 'nombre' : 'media')}
        >
          {orden === 'media' ? 'Media ↓' : 'A–Z'}
        </button>
      }
      pie={<BuscadorPie valor={busqueda} onCambio={busquedaSet} total={visibles.length} />}
    >
      <FiltrosPosicion valor={grupo} onCambio={grupoSet} />

      {visibles.length === 0 && <p className="coleccion__vacio">Ninguna carta coincide con el filtro.</p>}

      {plantel.length > 0 && (
        <>
          <p className="rotulo coleccion__rotulo">Plantel · {plantel.length}</p>
          <Grilla jugadores={plantel} onAbrirCarta={onAbrirCarta} />
        </>
      )}

      {parches.length > 0 && (
        <>
          <p className="rotulo coleccion__rotulo">Parches · {parches.length}</p>
          <Grilla jugadores={parches} onAbrirCarta={onAbrirCarta} />
        </>
      )}
    </Pantalla>
  )
}

function Grilla({ jugadores, onAbrirCarta }: { jugadores: Jugador[]; onAbrirCarta: (id: string) => void }) {
  return (
    <div className="coleccion__grilla">
      {jugadores.map((jugador) => (
        <button key={jugador.id} type="button" className="coleccion__slot" onClick={() => onAbrirCarta(jugador.id)}>
          <Carta jugador={jugador} tamano={94} />
        </button>
      ))}
    </div>
  )
}
