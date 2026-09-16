import { useState } from 'react'
import { IconoMosaico } from '../../components/Mosaico/IconoMosaico'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import { Ruleta } from './Ruleta'
import './Casino.css'

type Props = { onVolver: () => void }

/** Los 4 juegos del Casino: hoy solo Ruleta funciona, el resto es un candado. */
export function Casino({ onVolver }: Props) {
  const [jugando, jugandoSet] = useState<'ruleta' | null>(null)

  if (jugando === 'ruleta') return <Ruleta onVolver={() => jugandoSet(null)} />

  return (
    <Pantalla titulo="Casino" onVolver={onVolver}>
      <p className="casino__intro">
        Apostá cartas que tengas de sobra: lo que ganes (o pierdas) queda guardado, no se borra si salís.
      </p>

      <div className="casino__grilla">
        <button type="button" className="casino__juego" onClick={() => jugandoSet('ruleta')}>
          <IconoMosaico clave="ruleta" />
          <span>RULETA</span>
        </button>

        {[1, 2, 3].map((n) => (
          <button key={n} type="button" className="casino__juego casino__juego--bloqueado" disabled>
            <IconoMosaico clave="candado" />
            <span>PRÓXIMAMENTE</span>
          </button>
        ))}
      </div>
    </Pantalla>
  )
}
