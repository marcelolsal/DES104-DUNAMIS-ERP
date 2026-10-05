import { eq } from "drizzle-orm";
import {
  instructorSchema,
  type NuevoInstructor,
  type ActualizarInstructor,
  type Instructor,
} from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { instructor, clase } from "../../shared/db/schema.js";

// Drizzle devuelve `date` como "YYYY-MM-DD"; el contrato la expone como Date
// (medianoche UTC), igual que pagos y mantenimientos.
const aInstructor = (registro: typeof instructor.$inferSelect): Instructor =>
  instructorSchema.parse(registro);

// Única capa que toca la BD (Drizzle). ADR-0004.
export const instructoresRepository = {
  listar: () =>
    db
      .select()
      .from(instructor)
      .then((r) => r.map(aInstructor)),

  obtener: (id: number) =>
    db
      .select()
      .from(instructor)
      .where(eq(instructor.id_instructor, id))
      .then((r) => (r[0] ? aInstructor(r[0]) : null)),

  crear: (datos: NuevoInstructor) =>
    db
      .insert(instructor)
      .values(datos)
      .returning()
      .then((r) => {
        const creado = r[0];
        if (!creado) throw new Error("No se pudo crear el instructor");
        return aInstructor(creado);
      }),

  actualizar: (id: number, datos: ActualizarInstructor) =>
    db
      .update(instructor)
      .set(datos)
      .where(eq(instructor.id_instructor, id))
      .returning()
      .then((r) => (r[0] ? aInstructor(r[0]) : null)),

  eliminar: (id: number) => db.delete(instructor).where(eq(instructor.id_instructor, id)),

  tieneClases: (id: number) =>
    db
      .select({ id_clase: clase.id_clase })
      .from(clase)
      .where(eq(clase.id_instructor, id))
      .limit(1)
      .then((r) => r.length > 0),

  // Alumno y estado de cada clase del instructor; las métricas se calculan en metricas.ts.
  clasesDeInstructor: (id: number) =>
    db
      .select({ id_alumno: clase.id_alumno, estado: clase.estado })
      .from(clase)
      .where(eq(clase.id_instructor, id)),
};
