import { useState } from 'react'
import { GRUPOS_LIGA, copaDePuesto, copaInfo, jornadasTotales } from '../../config/liga'
import { clasificacion, ligaInicial } from '../../juego/liga'
import { useJuego } from '../../juego/useJuego'
import { EscudoEquipo } from '../../components/EscudoEquipo/EscudoEquipo'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import './Liga.css'

type Props = { onVolver: () => void; onJugarFecha: () => void }

export function Liga({ onVolver, onJugarFecha }: Props) {
  const { guardado } = useJuego()
  const liga = guardado.liga

  const indiceGrupoDjm = liga ? GRUPOS_LIGA.findIndex((g) => g.id === liga.grupoId) : 0
  const [indiceVisto, indiceVistoSet] = useState(indiceGrupoDjm)
  const grupo = GRUPOS_LIGA[indiceVisto]
  const esGrupoDjm = liga?.grupoId === grupo.id

  if (!liga) {
    return (
      <Pantalla titulo="Liga" onVolver={onVolver}>
        <p className="liga__vacio">Terminá un draft y tocá IR A LIGA para arrancar la temporada.</p>
      </Pantalla>
    )
  }

  const tabla = esGrupoDjm ? liga.tabla : ligaInicial(grupo.id).tabla
  const filas = clasificacion(grupo, tabla)
  const total = jornadasTotales(grupo)
  const temporadaTerminada = esGrupoDjm && liga.jornada > total

  return (
    <Pantalla titulo="Liga" onVolver={onVolver}>
      <div className="liga__switch">
        <button
          type="button"
          className="liga__flecha"
          onClick={() => indiceVistoSet((i) => (i - 1 + GRUPOS_LIGA.length) % GRUPOS_LIGA.length)}
          aria-label="Grupo anterior"
        >
          ‹
        </button>
        <span className="liga__grupo-nombre">
          GRUPO {grupo.nombre}
          {esGrupoDjm && <em>TU GRUPO</em>}
        </span>
        <button
          type="button"
          className="liga__flecha"
          onClick={() => indiceVistoSet((i) => (i + 1) % GRUPOS_LIGA.length)}
          aria-label="Siguiente grupo"
        >
          ›
        </button>
      </div>

      <div className="liga__tabla tarjeta">
        <div className="liga__fila liga__fila--cabecera">
          <span className="liga__pos">#</span>
          <span className="liga__equipo">EQUIPO</span>
          <span>PJ</span>
          <span>G</span>
          <span>E</span>
          <span>P</span>
          <span>DG</span>
          <span>PTS</span>
        </div>
        {filas.map((fila, i) => {
          const puesto = i + 1
          const copa = copaInfo(copaDePuesto(puesto))
          return (
            <div key={fila.id} className={`liga__fila${fila.equipo.esDjm ? ' liga__fila--djm' : ''}`}>
              <span className="liga__pos">
                {puesto}
                <i className="liga__pastilla-copa" style={{ background: copa.color }} title={copa.nombre} />
              </span>
              <span className="liga__equipo">
                <EscudoEquipo equipo={fila.equipo} tamano={24} />
                {fila.equipo.nombre}
              </span>
              <span>{fila.pj}</span>
              <span>{fila.g}</span>
              <span>{fila.e}</span>
              <span>{fila.p}</span>
              <span>{fila.gf - fila.gc}</span>
              <span className="liga__pts">{fila.pts}</span>
            </div>
          )
        })}
      </div>

      <div className="liga__leyenda">
        {['oro', 'plata', 'bronce', 'plumavit'].map((c) => {
          const info = copaInfo(c as 'oro' | 'plata' | 'bronce' | 'plumavit')
          return (
            <span key={c} className="liga__leyenda-item">
              <i style={{ background: info.color }} /> {info.nombre}
            </span>
          )
        })}
      </div>

      {esGrupoDjm && (
        <div className="liga__accion">
          {temporadaTerminada && liga.copaAsignada ? (
            <div className="liga__final" style={{ borderColor: copaInfo(liga.copaAsignada).color }}>
              <span className="rotulo">Fase de grupos terminada</span>
              <strong style={{ color: copaInfo(liga.copaAsignada).color }}>
                Clasificaste a {copaInfo(liga.copaAsignada).nombre}
              </strong>
            </div>
          ) : liga.equipoPendiente ? (
            <button type="button" className="boton-oro liga__boton-fecha" onClick={onJugarFecha}>
              FECHA {liga.jornada}
            </button>
          ) : (
            <p className="liga__pista">Terminá un draft nuevo para jugar la fecha {liga.jornada}.</p>
          )}
        </div>
      )}
    </Pantalla>
  )
}
