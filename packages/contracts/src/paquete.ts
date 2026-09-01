import { z } from "zod";

export const paqueteSchema = z.object({
  id_paquete: z.number().int().positive(),
  nombre: z.string().min(1),
  total_horas: z.number().int().nonnegative(),
  precio: z.number().nonnegative(),
});
export type Paquete = z.infer<typeof paqueteSchema>;
