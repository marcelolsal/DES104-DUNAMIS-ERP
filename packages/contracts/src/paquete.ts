import { z } from "zod";

const INT4_MAX = 2_147_483_647;
const NUMERIC_10_2_MAX = 99_999_999.99;

export const paqueteSchema = z.object({
  id_paquete: z.number().int().positive(),
  nombre: z.string().min(1).max(120),
  total_horas: z.number().int().nonnegative().max(INT4_MAX),
  precio: z.number().nonnegative().max(NUMERIC_10_2_MAX).multipleOf(0.01),
});
export type Paquete = z.infer<typeof paqueteSchema>;

// Payloads de escritura: el id lo genera la base de datos.
export const nuevoPaqueteSchema = paqueteSchema.omit({ id_paquete: true });
export type NuevoPaquete = z.infer<typeof nuevoPaqueteSchema>;

export const actualizarPaqueteSchema = nuevoPaqueteSchema;
export type ActualizarPaquete = z.infer<typeof actualizarPaqueteSchema>;

export const idPaqueteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
