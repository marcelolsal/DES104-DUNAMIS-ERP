import { z } from "zod";

const INT4_MAX = 2_147_483_647;
const idEntero = z.number().int().positive().max(INT4_MAX);

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

// Payload de creación/edición: sin id (lo genera la BD); estado por defecto "programada".
export const nuevoClaseSchema = claseSchema.omit({ id_clase: true, estado: true }).extend({
  id_alumno: idEntero,
  id_instructor: idEntero,
  id_vehiculo: idEntero,
  estado: estadoClase.default("programada"),
});
export type NuevoClase = z.infer<typeof nuevoClaseSchema>;

export const claseAgendaSchema = claseSchema.extend({
  alumno_nombre: z.string(),
  instructor_nombre: z.string(),
  vehiculo_modelo: z.string(),
  vehiculo_placa: z.string(),
});
export type ClaseAgenda = z.infer<typeof claseAgendaSchema>;

// Ids de ruta: solo dígitos (z.coerce aceptaría "0x10" o "1e3") y dentro de int4.
export const idClaseParamsSchema = z.object({
  id: z.string().regex(/^\d+$/u).pipe(z.coerce.number().int().positive().max(INT4_MAX)),
});
