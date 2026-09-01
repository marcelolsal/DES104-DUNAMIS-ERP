import { z } from "zod";

export const estadoClase = z.enum(["programada", "impartida", "cancelada"]);

export const claseSchema = z.object({
  id_clase: z.number().int().positive(),
  id_alumno: z.number().int().positive(),
  id_instructor: z.number().int().positive(),
  id_vehiculo: z.number().int().positive(),
  fecha_hora: z.coerce.date(),
  estado: estadoClase,
});
export type Clase = z.infer<typeof claseSchema>;
