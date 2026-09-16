import { useState } from 'react'
import { GRUPOS_LIGA, GRUPO_DJM, copaInfo, equipoLigaGlobalPorId, jornadasTotales, type Copa } from '../../config/liga'
import { clasificacion, nombreRonda, proximoPartidoCopaDjm, type CopaGuardado, type PartidoCopa } from '../../juego/liga'
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
          {temporadaTerminada && copaDjm && liga.copaDjm ? (
            <LlaveCopa copaDjm={liga.copaDjm} tieneEquipoPendiente={!!liga.equipoPendiente} onJugar={onJugarFecha} />
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

/** Llave completa de la copa de Don Julio De Milan: una ronda debajo de la otra, con
 *  el cruce de DJM resaltado, más el botón para jugar el que sigue (o el cartel de
 *  campeón/eliminado una vez que ya no queda nada por jugar). */
function LlaveCopa({
  copaDjm,
  tieneEquipoPendiente,
  onJugar,
}: {
  copaDjm: CopaGuardado
  tieneEquipoPendiente: boolean
  onJugar: () => void
}) {
  const info = copaInfo(copaDjm.copa)
  const proximo = proximoPartidoCopaDjm(copaDjm)
  const campeonNombre = copaDjm.campeon ? equipoLigaGlobalPorId(copaDjm.campeon)?.nombre : null

  return (
    <div className="liga__copa">
      <div className="liga__copa-cabecera" style={{ borderColor: info.color }}>
        <span className="rotulo">Fase de grupos terminada</span>
        <strong style={{ color: info.color }}>{info.nombre}</strong>
      </div>

      {copaDjm.rondas.map((ronda) => (
        <div key={ronda.ronda} className="liga__copa-ronda tarjeta">
          <p className="liga__copa-ronda-titulo">{nombreRonda(ronda.ronda).toUpperCase()}</p>
          {ronda.partidos.map((partido, i) => (
            <FilaPartidoCopa key={i} partido={partido} />
          ))}
        </div>
      ))}

      {copaDjm.campeon === 'djm' ? (
        <div className="liga__final" style={{ borderColor: info.color }}>
          <span className="rotulo">🏆 Campeón</span>
          <strong style={{ color: info.color }}>¡Ganaste la {info.nombre}!</strong>
        </div>
      ) : copaDjm.eliminadoEn ? (
        <div className="liga__final" style={{ borderColor: info.color }}>
          <span className="rotulo">Quedaste eliminado en {nombreRonda(copaDjm.eliminadoEn)}</span>
          {campeonNombre && <strong>Campeón: {campeonNombre}</strong>}
        </div>
      ) : proximo && tieneEquipoPendiente ? (
        <button type="button" className="boton-oro liga__boton-fecha" onClick={onJugar}>
          JUGAR {nombreRonda(proximo.ronda).toUpperCase()}
        </button>
      ) : proximo ? (
        <p className="liga__pista">Terminá un draft nuevo para jugar {nombreRonda(proximo.ronda).toLowerCase()}.</p>
      ) : null}
    </div>
  )
}

function FilaPartidoCopa({ partido }: { partido: PartidoCopa }) {
  const local = partido.local ? equipoLigaGlobalPorId(partido.local) : null
  const visita = partido.visita ? equipoLigaGlobalPorId(partido.visita) : null
  const jugado = partido.golesLocal !== null && partido.golesVisita !== null
  const esDjm = partido.local === 'djm' || partido.visita === 'djm'

  return (
    <div className={`liga__copa-partido${esDjm ? ' liga__copa-partido--djm' : ''}`}>
      <span className="liga__copa-equipo">
        {local ? (
          <>
            <EscudoEquipo equipo={local} tamano={20} />
            {local.nombre}
          </>
        ) : (
          <em>Por definir</em>
        )}
      </span>
      <span className="liga__copa-marcador">
        {jugado ? `${partido.golesLocal}-${partido.golesVisita}` : 'vs'}
        {partido.penalesGanador && <em> (pen)</em>}
      </span>
      <span className="liga__copa-equipo liga__copa-equipo--visita">
        {visita ? (
          <>
            {visita.nombre}
            <EscudoEquipo equipo={visita} tamano={20} />
          </>
        ) : (
          <em>Por definir</em>
        )}
      </span>
    </div>
  )
}
