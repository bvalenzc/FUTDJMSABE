import { useState } from 'react'
import { sobrePorId } from '../../config/juego'
import { useJuego } from '../../juego/useJuego'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { AperturaSobre } from './AperturaSobre'

type Props = {
  sobreId: string
  onVolver: () => void
}

/** Apertura de un sobre comprado: consume una unidad de "Mis sobres". */
export function AbrirSobre({ sobreId, onVolver }: Props) {
  const sobre = sobrePorId(sobreId)
  const { consumirSobre } = useJuego()
  const [aviso, avisoSet] = useState<string | null>(null)

  if (!sobre) return null

  return (
    <Pantalla titulo={sobre.nombre} onVolver={onVolver}>
      <AperturaSobre
        sobre={sobre}
        alAbrir={() => {
          if (consumirSobre(sobreId)) return true
          avisoSet('No te quedan sobres de este tipo')
          window.setTimeout(() => avisoSet(null), 1800)
          return false
        }}
      />
      {aviso && <div className="aviso-toast">{aviso}</div>}
    </Pantalla>
  )
}
