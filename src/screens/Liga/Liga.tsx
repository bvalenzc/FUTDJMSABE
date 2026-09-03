import { useState } from 'react'
import { GRUPOS_LIGA, GRUPO_DJM, copaInfo, jornadasTotales, type Copa } from '../../config/liga'
import { clasificacion } from '../../juego/liga'
import { useJuego } from '../../juego/useJuego'
import { EscudoEquipo } from '../../components/EscudoEquipo/EscudoEquipo'
import { Pantalla } from '../../components/Pantalla/Pantalla'
import './Liga.css'

type Props = { onVolver: () => void; onJugarFecha: () => void }

export function Liga({ onVolver, onJugarFecha }: Props) {
  const { guardado, reiniciarLiga } = useJuego()
  const liga = guardado.liga

  const indiceGrupoDjm = GRUPOS_LIGA.findIndex((g) => g.id === GRUPO_DJM)
  const [indiceVisto, indiceVistoSet] = useState(indiceGrupoDjm)
  const grupo = GRUPOS_LIGA[indiceVisto]
  const esGrupoDjm = grupo.id === GRUPO_DJM

  if (!liga) {
    return (
      <Pantalla titulo="Liga" onVolver={onVolver}>
        <p className="liga__vacio">Terminá un draft y tocá IR A LIGA para arrancar la temporada.</p>
      </Pantalla>
    )
  }

  const filas = clasificacion(grupo, liga.tablas[grupo.id])
  const total = jornadasTotales(grupo)
  const temporadaTerminada = liga.fase === 'copas'
  const copaDjm = liga.copas?.['djm']

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

      {!temporadaTerminada && (
        <p className="liga__jornada-actual">
          Fecha <strong>{Math.min(liga.jornada, total)}</strong> de {total}
        </p>
      )}

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
          const copa = liga.copas?.[fila.id]
          return (
            <div key={fila.id} className={`liga__fila${fila.equipo.esDjm ? ' liga__fila--djm' : ''}`}>
              <span className="liga__pos">
                {puesto}
                {copa && <i className="liga__pastilla-copa" style={{ background: copaInfo(copa).color }} title={copaInfo(copa).nombre} />}
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

      {temporadaTerminada && (
        <div className="liga__leyenda">
          {(['oro', 'plata', 'bronce', 'plumavit'] as Copa[]).map((c) => {
            const info = copaInfo(c)
            return (
              <span key={c} className="liga__leyenda-item">
                <i style={{ background: info.color }} /> {info.nombre}
              </span>
            )
          })}
        </div>
      )}

      {esGrupoDjm && (
        <div className="liga__accion">
          {temporadaTerminada && copaDjm ? (
            <div className="liga__final" style={{ borderColor: copaInfo(copaDjm).color }}>
              <span className="rotulo">Fase de grupos terminada</span>
              <strong style={{ color: copaInfo(copaDjm).color }}>Clasificaste a {copaInfo(copaDjm).nombre}</strong>
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

      <button type="button" className="liga__reiniciar" onClick={reiniciarLiga}>
        Reiniciar liga desde cero
      </button>
    </Pantalla>
  )
}
