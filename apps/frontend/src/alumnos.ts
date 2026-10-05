// Etiqueta de un alumno en los selectores. Si otro alumno se llama igual
// (sin distinguir mayúsculas ni espacios), se agrega el id para diferenciarlos.
export const etiquetadorAlumnos = (
  alumnos: { id: number; nombre: string }[],
): ((alumno: { id: number; nombre: string }) => string) => {
  const clave = (nombre: string) => nombre.trim().toLowerCase();
  const veces = new Map<string, number>();
  for (const { nombre } of alumnos) veces.set(clave(nombre), (veces.get(clave(nombre)) ?? 0) + 1);
  return ({ id, nombre }) =>
    (veces.get(clave(nombre)) ?? 0) > 1 ? `${nombre} — #${String(id)}` : nombre;
};
