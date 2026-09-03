import { obtenerRoster, jugadorPorId } from './juego/roster'
import { ProveedorJuego } from './juego/useJuego'
import { useNavegacion } from './router/useNavegacion'
import { Inicio } from './screens/Inicio/Inicio'
import { Coleccion } from './screens/Coleccion/Coleccion'
import { Detalle } from './screens/Detalle/Detalle'
import { Tienda } from './screens/Tienda/Tienda'
import { AbrirSobre } from './screens/Sobres/AbrirSobre'
import { Packs } from './screens/Sobres/Packs'
import { Admin } from './screens/Admin/Admin'
import { Mercado } from './screens/Mercado/Mercado'
import { MiEquipo } from './screens/MiEquipo/MiEquipo'
import { Draft } from './screens/Draft/Draft'
import { Sbc } from './screens/Sbc/Sbc'
import './App.css'

function Juego() {
  const { pantalla, ir, volver } = useNavegacion()

  switch (pantalla.tipo) {
    case 'coleccion':
      return <Coleccion jugadores={obtenerRoster()} onVolver={volver} onAbrirCarta={(id) => ir({ tipo: 'detalle', id })} />
    case 'detalle': {
      const jugador = jugadorPorId(pantalla.id)
      return jugador ? <Detalle jugador={jugador} onVolver={volver} /> : null
    }
    case 'tienda':
      return <Tienda onVolver={volver} onAbrirSobre={(sobreId) => ir({ tipo: 'sobre', sobreId })} />
    case 'sobre':
      return <AbrirSobre sobreId={pantalla.sobreId} onVolver={volver} />
    case 'packs':
      return <Packs onVolver={volver} />
    case 'admin':
      return <Admin onVolver={volver} />
    case 'mercado':
      return <Mercado onVolver={volver} />
    case 'miequipo':
      return <MiEquipo onVolver={volver} onAbrirCarta={(id) => ir({ tipo: 'detalle', id })} />
    case 'draft':
      return <Draft onVolver={volver} />
    case 'sbc':
      return <Sbc onVolver={volver} />
    default:
      return <Inicio jugadores={obtenerRoster()} onIr={(destino) => ir({ tipo: destino } as never)} />
  }
}

export function App() {
  return (
    <ProveedorJuego>
      <Juego />
    </ProveedorJuego>
  )
}
