/** Escudos reales de los equipos rivales, recortados de las tablas de la liga. */
const escudos = import.meta.glob('./*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const registro: Record<string, string> = {}
for (const ruta in escudos) {
  registro[ruta.split('/').pop()!.replace(/\.[^.]+$/, '')] = escudos[ruta]
}

export function obtenerEscudo(equipoId: string): string | undefined {
  return registro[equipoId]
}
