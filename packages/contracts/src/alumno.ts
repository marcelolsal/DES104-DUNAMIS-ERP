import { z } from "zod";

export const alumnoSchema = z.object({
  id_alumno: z.number().int().positive(),
  nombre: z.string().min(1),
  dui: z.string().min(1),
  correo: z.string().email(),
  telefono: z.string().min(1),
  contacto_emergencia: z.string().min(1),
  fecha_inscripcion: z.string(),
  id_paquete: z.number().int().positive(),
});
export type Alumno = z.infer<typeof alumnoSchema>;

export const nuevoAlumnoSchema = alumnoSchema.omit({ id_alumno: true });
export type NuevoAlumno = z.infer<typeof nuevoAlumnoSchema>;

export const actualizarAlumnoSchema = nuevoAlumnoSchema.partial();
export type ActualizarAlumno = z.infer<typeof actualizarAlumnoSchema>;
