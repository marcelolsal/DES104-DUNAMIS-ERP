import { z } from "zod";

export const paqueteSchema = z.object({
  id_paquete: z.number().int().positive(),
  nombre: z.string().min(1),
  total_horas: z.number().int().nonnegative(),
  precio: z.number().nonnegative(),
});
export type Paquete = z.infer<typeof paqueteSchema>;

// Payloads de escritura: el id lo genera la base de datos.
export const nuevoPaqueteSchema = paqueteSchema.omit({ id_paquete: true });
export type NuevoPaquete = z.infer<typeof nuevoPaqueteSchema>;

export const actualizarPaqueteSchema = nuevoPaqueteSchema;
export type ActualizarPaquete = z.infer<typeof actualizarPaqueteSchema>;
