import { z } from "zod";
import { fechaPayloadSchema } from "./fecha.js";

const NUMERIC_10_2_MAX = 99_999_999.99;

const mantenimientoPayloadSchema = z.object({
  id_vehiculo: z.number().int().positive(),
  fecha: fechaPayloadSchema,
  descripcion: z.string().min(1).max(255),
  costo: z.number().nonnegative().max(NUMERIC_10_2_MAX).multipleOf(0.01),
});

export const mantenimientoSchema = mantenimientoPayloadSchema.extend({
  id_mantenimiento: z.number().int().positive(),
  fecha: z.coerce.date(),
});
export type Mantenimiento = z.infer<typeof mantenimientoSchema>;

// Payloads de escritura: el id lo genera la base de datos.
export const nuevoMantenimientoSchema = mantenimientoPayloadSchema;
export type NuevoMantenimiento = z.infer<typeof nuevoMantenimientoSchema>;

export const actualizarMantenimientoSchema = nuevoMantenimientoSchema;
export type ActualizarMantenimiento = z.infer<typeof actualizarMantenimientoSchema>;

export const listarMantenimientosQuerySchema = z.object({
  id_vehiculo: z.coerce.number().int().positive().optional(),
});

export const idMantenimientoParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
