import { rayosGrabado } from './guilloche'

const RAYOS = rayosGrabado()

/** Guilloché grabado: 34 rayos + 3 anillos, enmascarado con desvanecido radial. */
export function GrabadoSvg() {
  return (
    <svg className="carta__grabado" viewBox="0 0 330 486" xmlns="http://www.w3.org/2000/svg">
      <g mask="url(#carta-burst-mask)" stroke="currentColor" fill="none" strokeWidth="0.9" opacity="0.6">
        <g transform="translate(165,146)">
          {RAYOS.map((r, i) => (
            <line key={i} x1="0" y1="0" x2={r.x2} y2={r.y2} />
          ))}
        </g>
        <circle cx="165" cy="146" r="96" strokeWidth="1.1" />
        <circle cx="165" cy="146" r="104" strokeWidth="0.6" />
        <circle cx="165" cy="146" r="140" strokeWidth="0.6" opacity="0.6" />
      </g>
    </svg>
  )
}
