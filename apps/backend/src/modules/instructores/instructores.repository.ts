import { eq, sql } from "drizzle-orm";
import type { NuevoInstructor, ActualizarInstructor } from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { instructor, clase } from "../../shared/db/schema.js";

export const instructoresRepository = {
  listar: () => db.select().from(instructor),

  obtener: (id: number) =>
    db.select().from(instructor).where(eq(instructor.id_instructor, id)).then((r) => r[0] ?? null),

  crear: (datos: NuevoInstructor) =>
    db.insert(instructor).values(datos).returning().then((r) => r[0]),

  actualizar: (id: number, datos: ActualizarInstructor) =>
    db.update(instructor).set(datos).where(eq(instructor.id_instructor, id)).returning().then((r) => r[0] ?? null),

  eliminar: (id: number) =>
    db.delete(instructor).where(eq(instructor.id_instructor, id)).returning().then((r) => r[0] ?? null),

  obtenerMetricas: async (id: number) => {
    // Calcula el total de clases/horas y la cantidad de alumnos únicos asignados
    const result = await db
      .select({
        total_clases: sql<number>`count(${clase.id_clase})::int`,
        estudiantes_asignados: sql<number>`count(distinct ${clase.id_alumno})::int`,
      })
      .from(clase)
      .where(eq(clase.id_instructor, id));

    const totalClases = result[0]?.total_clases ?? 0;
    const estudiantesAsignados = result[0]?.estudiantes_asignados ?? 0;

    // Asumiendo 1 hora por clase (o la lógica configurada en el sistema)
    return {
      id_instructor: id,
      horas_impartidas: totalClases,
      estudiantes_asignados: estudiantesAsignados,
    };
  },
};