import { z } from "zod";
import { fechaPayloadSchema } from "./fecha.js";

const INT4_MAX = 2_147_483_647;

// Fecha de ingreso (antigüedad): opcional; null la borra. No puede ser futura
// ("hoy" es el día calendario en El Salvador, no en UTC).
const diaEnElSalvador = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" });
const fechaIngresoPayloadSchema = fechaPayloadSchema.refine(
  (fecha) => fecha <= diaEnElSalvador.format(new Date()),
  "La fecha de ingreso no puede ser futura",
);

const instructorPayloadSchema = z.object({
  nombre: z.string().trim().min(1).max(160),
  especialidad: z.string().trim().min(1).max(120),
  telefono: z.string().trim().min(1).max(30),
  fecha_ingreso: fechaIngresoPayloadSchema.nullable().optional(),
});

export const instructorSchema = instructorPayloadSchema.extend({
  id_instructor: z.number().int().positive(),
  fecha_ingreso: z.coerce.date().nullable(),
});
export type Instructor = z.infer<typeof instructorSchema>;

// Payloads de escritura: el id lo genera la base de datos.
export const nuevoInstructorSchema = instructorPayloadSchema;
export type NuevoInstructor = z.infer<typeof nuevoInstructorSchema>;

export const actualizarInstructorSchema = nuevoInstructorSchema;
export type ActualizarInstructor = z.infer<typeof actualizarInstructorSchema>;

export const idInstructorParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(INT4_MAX),
});
