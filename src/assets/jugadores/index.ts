/**
 * Fotos de las cartas. Solo se empaquetan los recortes con fondo transparente
 * (src/assets/recortes). Las fotos originales viven en /fotos-originales, fuera
 * del bundle: son la materia prima para regenerar los recortes con recorte.html.
 */
const recortes = import.meta.glob('../recortes/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const registro: Record<string, string> = {}
for (const ruta in recortes) {
  registro[ruta.split('/').pop()!.replace(/\.[^.]+$/, '')] = recortes[ruta]
}

export function obtenerFoto(clave?: string): string | undefined {
  if (!clave) return undefined
  return registro[clave]
}

/** Hoy todas las fotos disponibles vienen recortadas. */
export function tieneRecorte(clave?: string): boolean {
  return !!clave && clave in registro
}
