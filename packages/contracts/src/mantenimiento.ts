import { z } from "zod";

export const mantenimientoSchema = z.object({
  id_mantenimiento: z.number().int().positive(),
  id_vehiculo: z.number().int().positive(),
  fecha: z.coerce.date(),
  descripcion: z.string().min(1),
  costo: z.number().nonnegative(),
});
export type Mantenimiento = z.infer<typeof mantenimientoSchema>;
