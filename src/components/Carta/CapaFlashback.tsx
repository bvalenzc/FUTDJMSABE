/** Flechas hacia atrás en cinco filas, con desvanecido horizontal. */
function flechas() {
  const filas = [
    { y: 70, s: 1.25, n: 4, x: 250 },
    { y: 148, s: 1.7, n: 4, x: 275 },
    { y: 232, s: 1.7, n: 4, x: 262 },
    { y: 316, s: 1.35, n: 4, x: 288 },
    { y: 392, s: 1.05, n: 4, x: 240 },
  ]
  const salida: { x: number; y: number; s: number }[] = []
  filas.forEach((f) => {
    for (let i = 0; i < f.n; i++) {
      salida.push({ x: f.x - i * 34 * f.s, y: f.y, s: f.s })
    }
  })
  return salida
}

const FLECHAS = flechas()
const D_FLECHA = 'M 0 0 L 20 -24 L 32 -24 L 12 0 L 32 24 L 20 24 Z'

function Capa({ clase }: { clase: string }) {
  return (
    <div className={`carta__fb-capa ${clase}`}>
      <svg viewBox="0 0 330 486" xmlns="http://www.w3.org/2000/svg">
        <g mask="url(#carta-fb-mask)" fill="currentColor">
          {FLECHAS.map((f, i) => (
            <path key={i} transform={`translate(${f.x.toFixed(1)},${f.y}) scale(${f.s})`} d={D_FLECHA} />
          ))}
        </g>
      </svg>
    </div>
  )
}

/** Capa de fondo de la carta FLASHBACK: flechas con glitch RGB y líneas de escaneo. */
export function CapaFlashback() {
  return (
    <>
      <div className="carta__fb-pila">
        <Capa clase="carta__fb-base" />
        <Capa clase="carta__fb-cian" />
        <Capa clase="carta__fb-magenta" />
      </div>
      <div className="carta__fb-scan" />
    </>
  )
}
