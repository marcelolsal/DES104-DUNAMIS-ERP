import { z } from "zod";
import { fechaPayloadSchema } from "./fecha.js";

// Rango máximo del filtro: un año calendario (366 días contando ambos extremos).
const MAX_DIAS_RANGO = 366;
const MS_POR_DIA = 86_400_000;

const diasEntre = (desde: string, hasta: string): number =>
  (Date.parse(hasta) - Date.parse(desde)) / MS_POR_DIA + 1;

// Filtro del reporte financiero. `desde` y `hasta` son fechas de calendario
// (YYYY-MM-DD), ambas inclusivas, y van juntas; sin ellas el reporte cubre todo
// el historial.
export const reporteFinancieroQuerySchema = z
  .object({ desde: fechaPayloadSchema.optional(), hasta: fechaPayloadSchema.optional() })
  .refine(({ desde, hasta }) => (desde === undefined) === (hasta === undefined), {
    message: "desde y hasta deben enviarse juntos",
    path: ["desde"],
  })
  .refine(({ desde, hasta }) => !desde || !hasta || desde <= hasta, {
    message: "desde no puede ser posterior a hasta",
    path: ["desde"],
  })
  // Negado a propósito: con una fecha mal formada (NaN) solo se reporta el formato.
  .refine(({ desde, hasta }) => !desde || !hasta || !(diasEntre(desde, hasta) > MAX_DIAS_RANGO), {
    message: `El rango no puede superar ${String(MAX_DIAS_RANGO)} días`,
    path: ["hasta"],
  });
export type ReporteFinancieroQuery = z.infer<typeof reporteFinancieroQuerySchema>;

// Indicadores del panel financiero. Los tres totales suman abonos cuya fecha cae
// en el rango, según su estado efectivo (un pendiente con fecha pasada es vencido).
// `ingreso_del_dia` es lo cobrado en `hoy` (fecha de El Salvador) y no depende del rango.
export const reporteFinancieroSchema = z.object({
  desde: fechaPayloadSchema.nullable(),
  hasta: fechaPayloadSchema.nullable(),
  total_recaudado: z.number().nonnegative(),
  pendiente_de_cobro: z.number().nonnegative(),
  cobros_vencidos: z.number().nonnegative(),
  hoy: fechaPayloadSchema,
  ingreso_del_dia: z.number().nonnegative(),
});
export type ReporteFinanciero = z.infer<typeof reporteFinancieroSchema>;
