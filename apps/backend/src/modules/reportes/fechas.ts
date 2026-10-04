// Lógica pura de fechas del reporte financiero. Sin BD ni env → testeable en aislamiento.
// Las fechas de pago son de calendario (columna `date`): se comparan como YYYY-MM-DD.

// El Salvador es UTC-6 todo el año (sin horario de verano).
const DESFASE_EL_SALVADOR_MS = 6 * 60 * 60 * 1000;

const aFechaIso = (instante: Date): string => instante.toISOString().slice(0, 10);

// "Hoy" para el ingreso del día: la fecha que marca el calendario de la autoescuela.
export const hoyEnElSalvador = (ahora: Date): string =>
  aFechaIso(new Date(ahora.getTime() - DESFASE_EL_SALVADOR_MS));

// Un abono pendiente con fecha anterior a este corte está vencido. Es el día UTC,
// la misma regla que `estadoEfectivo` del módulo de pagos: así las tarjetas
// coinciden con el listado de pagos.
export const corteDeVencidos = (ahora: Date): string => aFechaIso(ahora);
