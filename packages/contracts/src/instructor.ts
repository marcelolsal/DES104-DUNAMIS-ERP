import { z } from "zod";

export const instructorSchema = z.object({
  id_instructor: z.number().int().positive(),
  nombre: z.string().min(1),
  especialidad: z.string().min(1),
  telefono: z.string().min(1),
});
export type Instructor = z.infer<typeof instructorSchema>;

// Payload de creación (sin id_instructor)
export const nuevoInstructorSchema = instructorSchema.omit({ id_instructor: true });
export type NuevoInstructor = z.infer<typeof nuevoInstructorSchema>;

// Payload de actualización (campos opcionales)
export const actualizarInstructorSchema = nuevoInstructorSchema.partial();
export type ActualizarInstructor = z.infer<typeof actualizarInstructorSchema>;

// Tipo para respuesta con métricas
export type InstructorConMetricas = Instructor & {
  horas_impartidas: number;
  estudiantes_asignados: number;
};