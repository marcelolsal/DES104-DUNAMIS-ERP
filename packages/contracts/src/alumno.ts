import { z } from "zod";
import { fechaPayloadSchema } from "./fecha.js";

const INT4_MAX = 2_147_483_647;

// Longitudes = varchar de la BD: un texto más largo es 400, no un 500 de Postgres.
export const alumnoSchema = z.object({
  id_alumno: z.number().int().positive(),
  nombre: z.string().min(1).max(160),
  dui: z.string().min(1).max(20),
  correo: z.string().email().max(160),
  telefono: z.string().min(1).max(30),
  contacto_emergencia: z.string().min(1).max(160),
  fecha_inscripcion: z.coerce.date(),
  id_paquete: z.number().int().positive(),
});
export type Alumno = z.infer<typeof alumnoSchema>;

// Payload de creación: sin id (lo genera la BD). La fecha va como YYYY-MM-DD
// (columna `date`): un Date pasaría por UTC y correría el día después de las 18:00 en SV.
export const nuevoAlumnoSchema = alumnoSchema.omit({ id_alumno: true }).extend({
  fecha_inscripcion: fechaPayloadSchema,
  id_paquete: z.number().int().positive().max(INT4_MAX),
});
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

// Ids de ruta: solo dígitos (z.coerce aceptaría "0x10" o "1e3") y dentro de int4.
export const idAlumnoParamsSchema = z.object({
  id: z.string().regex(/^\d+$/u).pipe(z.coerce.number().int().positive().max(INT4_MAX)),
});
