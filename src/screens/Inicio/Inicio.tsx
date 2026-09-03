import type { Jugador } from '../../types/jugador'
import { Mosaico } from '../../components/Mosaico/Mosaico'
import { IconoMosaico } from '../../components/Mosaico/IconoMosaico'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { useJuego } from '../../juego/useJuego'
import { Banner } from './Banner'
import './Inicio.css'

type Destino = 'coleccion' | 'tienda' | 'draft' | 'sbc' | 'mercado' | 'miequipo' | 'packs' | 'admin'

type Props = {
  jugadores: Jugador[]
  onIr: (destino: Destino) => void
}

export function Inicio({ jugadores, onIr }: Props) {
  const { guardado } = useJuego()

  const distintas = Object.keys(guardado.coleccion).length
  const sobres = Object.values(guardado.misSobres).reduce((s, n) => s + n, 0)
  const repetidas = Object.values(guardado.coleccion).reduce((s, n) => s + Math.max(0, n - 1), 0)
  const plantillasHechas = Object.keys(guardado.plantillasHechas).length

  return (
    <Pantalla sinScroll>
      <div className="inicio">
        <Banner onClick={() => onIr('draft')} />

        <div className="inicio__grilla">
          <Mosaico titulo="Packs" etiqueta="Gratis" onClick={() => onIr('packs')}>
            <IconoMosaico clave="packs" />
          </Mosaico>

          <Mosaico
            titulo="Mi equipo"
            etiqueta={distintas ? `${distintas} cartas` : 'vacío'}
            onClick={() => onIr('miequipo')}
          >
            <IconoMosaico clave="equipo" />
          </Mosaico>

          <Mosaico
            titulo="Tienda"
            etiqueta={sobres > 0 ? `${sobres} sin abrir` : undefined}
            onClick={() => onIr('tienda')}
          >
            <IconoMosaico clave="tienda" />
          </Mosaico>

          <Mosaico titulo="Últimas cartas" etiqueta={`${jugadores.length}`} onClick={() => onIr('coleccion')}>
            <IconoMosaico clave="cartas" />
          </Mosaico>

          <Mosaico
            titulo="Mercado"
            etiqueta={repetidas > 0 ? `${repetidas} repetidas` : undefined}
            onClick={() => onIr('mercado')}
          >
            <IconoMosaico clave="mercado" />
          </Mosaico>

          <Mosaico
            titulo="SBC"
            etiqueta={plantillasHechas > 0 ? `${plantillasHechas} hechas` : undefined}
            onClick={() => onIr('sbc')}
          >
            <IconoMosaico clave="sbc" />
          </Mosaico>
        </div>

        <button type="button" className="inicio__admin" onClick={() => onIr('admin')}>
          + añadir cartas
        </button>
      </div>
    </Pantalla>
  )
}
