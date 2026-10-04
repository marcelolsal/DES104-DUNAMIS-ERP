import { z } from "zod";

const INT4_MAX = 2_147_483_647;

export const instructorSchema = z.object({
  id_instructor: z.number().int().positive(),
  nombre: z.string().trim().min(1).max(160),
  especialidad: z.string().trim().min(1).max(120),
  telefono: z.string().trim().min(1).max(30),
});
export type Instructor = z.infer<typeof instructorSchema>;

// Payloads de escritura: el id lo genera la base de datos.
export const nuevoInstructorSchema = instructorSchema.omit({ id_instructor: true });
export type NuevoInstructor = z.infer<typeof nuevoInstructorSchema>;

export const actualizarInstructorSchema = nuevoInstructorSchema;
export type ActualizarInstructor = z.infer<typeof actualizarInstructorSchema>;

export const idInstructorParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(INT4_MAX),
});
