import { z } from "zod";

export const instructorSchema = z.object({
  id_instructor: z.number().int().positive(),
  nombre: z.string().min(1),
  especialidad: z.string().min(1),
  telefono: z.string().min(1),
});
export type Instructor = z.infer<typeof instructorSchema>;
