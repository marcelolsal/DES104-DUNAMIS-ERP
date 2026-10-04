// Validación pura del rango de la agenda. Sin BD ni env → testeable en aislamiento.
const RANGO_MAXIMO_DIAS = 62;

// Devuelve el rango ya convertido a Date, o null si es inválido: fechas no
// parseables, fin <= inicio, o más largo que RANGO_MAXIMO_DIAS.
export const rangoAgenda = (
  desdeIso: string,
  hastaIso: string,
): { desde: Date; hasta: Date } | null => {
  const desde = new Date(desdeIso);
  const hasta = new Date(hastaIso);
  const duracion = hasta.getTime() - desde.getTime();
  // NaN (fecha inválida) no cumple ninguna comparación → cae en el null.
  if (!(duracion > 0 && duracion <= RANGO_MAXIMO_DIAS * 24 * 60 * 60 * 1000)) return null;
  return { desde, hasta };
};
