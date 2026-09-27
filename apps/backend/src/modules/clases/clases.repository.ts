import { and, eq, ne, or } from "drizzle-orm";
import type { NuevoClase } from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { alumno, clase, instructor, vehiculo } from "../../shared/db/schema.js";

// Única capa que toca la BD (Drizzle). ADR-0004.
export const clasesRepository = {
  listar: () => db.select().from(clase),

  obtener: (id: number) =>
    db.select().from(clase).where(eq(clase.id_clase, id)).then((r) => r[0] ?? null),

  crear: (datos: NuevoClase) =>
    db.insert(clase).values(datos).returning().then((r) => r[0]!),

  actualizar: (id: number, datos: NuevoClase) =>
    db
      .update(clase)
      .set(datos)
      .where(eq(clase.id_clase, id))
      .returning()
      .then((r) => r[0] ?? null),

  eliminar: (id: number) =>
    db.delete(clase).where(eq(clase.id_clase, id)).returning().then((r) => r[0] ?? null),

  // Clases activas (no canceladas) del mismo instructor o vehículo, para el
  // chequeo de solapes. `excluirId` evita que una clase choque consigo misma al editar.
  posiblesConflictos: (p: { id_instructor: number; id_vehiculo: number; excluirId?: number }) =>
    db
      .select()
      .from(clase)
      .where(
        and(
          or(eq(clase.id_instructor, p.id_instructor), eq(clase.id_vehiculo, p.id_vehiculo)),
          ne(clase.estado, "cancelada"),
          p.excluirId ? ne(clase.id_clase, p.excluirId) : undefined,
        ),
      ),

  existeAlumno: (id: number) =>
    db.select({ id: alumno.id_alumno }).from(alumno).where(eq(alumno.id_alumno, id)).then((r) => r.length > 0),
  existeInstructor: (id: number) =>
    db.select({ id: instructor.id_instructor }).from(instructor).where(eq(instructor.id_instructor, id)).then((r) => r.length > 0),
  existeVehiculo: (id: number) =>
    db.select({ id: vehiculo.id_vehiculo }).from(vehiculo).where(eq(vehiculo.id_vehiculo, id)).then((r) => r.length > 0),
};
