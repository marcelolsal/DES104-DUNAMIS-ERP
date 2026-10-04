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

export const estadoAlumno = z.enum(["Activo", "Graduado"]);

export const estudianteListadoSchema = z.object({
  id_alumno: z.number().int().positive(),
  nombre: z.string().min(1),
  dui: z.string().min(1),
  correo: z.string().email(),
  telefono: z.string().min(1),
  contacto_emergencia: z.string().min(1),
  fecha_inscripcion: z.string(),
  id_paquete: z.number().int().positive(),
  curso: z.string().min(1),
  instructor: z.string().nullable(),
  horas_completadas: z.number().int().nonnegative(),
  horas_totales: z.number().int().positive(),
  progreso: z.number().int().min(0).max(100),
  estado: estadoAlumno,
});
export type EstudianteListado = z.infer<typeof estudianteListadoSchema>;
