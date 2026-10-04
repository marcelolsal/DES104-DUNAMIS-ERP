// Lógica pura de fechas del reporte financiero. Sin BD ni env → testeable en aislamiento.
// Las fechas de pago son de calendario (columna `date`): se comparan como YYYY-MM-DD.

const diaEnElSalvador = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" });

// "Hoy" en el calendario de la autoescuela. Sirve para el ingreso del día y como
// corte de vencidos (un pendiente con fecha anterior a hoy está vencido), la misma
// regla que `estadoEfectivo` del módulo de pagos.
export const hoyEnElSalvador = (ahora: Date): string => diaEnElSalvador.format(ahora);
