import { z } from "zod";

const NUMERIC_10_2_MAX = 99_999_999.99;

const fechaPayloadSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "La fecha debe tener formato YYYY-MM-DD")
  .refine((fecha) => {
    const anio = Number(fecha.slice(0, 4));
    const mes = Number(fecha.slice(5, 7));
    const dia = Number(fecha.slice(8, 10));
    const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia));
    return anio >= 1
      && fechaUtc.getUTCFullYear() === anio
      && fechaUtc.getUTCMonth() === mes - 1
      && fechaUtc.getUTCDate() === dia;
  }, "La fecha no es válida");

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
