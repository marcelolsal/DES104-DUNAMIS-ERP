import { z } from "zod";

export const alumnoSchema = z.object({
  id_alumno: z.number().int().positive(),
  nombre: z.string().min(1),
  dui: z.string().min(1),
  correo: z.string().email(),
  telefono: z.string().min(1),
  contacto_emergencia: z.string().min(1),
  fecha_inscripcion: z.coerce.date(),
  id_paquete: z.number().int().positive(),
});
export type Alumno = z.infer<typeof alumnoSchema>;

// Payload de creación: sin id (lo genera la BD).
export const nuevoAlumnoSchema = alumnoSchema.omit({ id_alumno: true });
export type NuevoAlumno = z.infer<typeof nuevoAlumnoSchema>;
