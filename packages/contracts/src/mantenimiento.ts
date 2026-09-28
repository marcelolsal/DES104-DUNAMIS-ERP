import { z } from "zod";

export const mantenimientoSchema = z.object({
  id_mantenimiento: z.number().int().positive(),
  id_vehiculo: z.number().int().positive(),
  fecha: z.coerce.date(),
  descripcion: z.string().min(1),
  costo: z.number().nonnegative(),
});
export type Mantenimiento = z.infer<typeof mantenimientoSchema>;

// Payloads de escritura: el id lo genera la base de datos.
export const nuevoMantenimientoSchema = mantenimientoSchema.omit({ id_mantenimiento: true });
export type NuevoMantenimiento = z.infer<typeof nuevoMantenimientoSchema>;

export const actualizarMantenimientoSchema = nuevoMantenimientoSchema;
export type ActualizarMantenimiento = z.infer<typeof actualizarMantenimientoSchema>;

export const listarMantenimientosQuerySchema = z.object({
  id_vehiculo: z.coerce.number().int().positive().optional(),
});
