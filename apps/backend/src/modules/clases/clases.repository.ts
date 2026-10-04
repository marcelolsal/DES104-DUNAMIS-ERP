import { and, desc, eq, gte, lt, ne, or } from "drizzle-orm";
import type { NuevoClase } from "@dunamis/contracts";
import { config } from "../../shared/config.js";
import { db } from "../../shared/db/client.js";
import { alumno, clase, instructor, vehiculo } from "../../shared/db/schema.js";

// Única capa que toca la BD (Drizzle). ADR-0004.
export const clasesRepository = {
  listar: () => db.select().from(clase),

  listarAgenda: (desde: Date, hasta: Date) =>
    db
      .select({
        id_clase: clase.id_clase,
        id_alumno: clase.id_alumno,
        id_instructor: clase.id_instructor,
        id_vehiculo: clase.id_vehiculo,
        fecha_hora: clase.fecha_hora,
        estado: clase.estado,
        alumno_nombre: alumno.nombre,
        instructor_nombre: instructor.nombre,
        vehiculo_modelo: vehiculo.modelo,
        vehiculo_placa: vehiculo.placa,
      })
      .from(clase)
      .innerJoin(alumno, eq(clase.id_alumno, alumno.id_alumno))
      .innerJoin(instructor, eq(clase.id_instructor, instructor.id_instructor))
      .innerJoin(vehiculo, eq(clase.id_vehiculo, vehiculo.id_vehiculo))
      .where(and(
        // Incluir clases que empiezan antes del rango, pero todavía ocupan una
        // franja dentro de él. El fin de cada clase es exclusivo.
        lt(clase.fecha_hora, hasta),
        gte(clase.fecha_hora, new Date(desde.getTime() - config.CLASE_DURACION_MIN * 60_000)),
      ))
      .orderBy(desc(clase.fecha_hora)),

  listarOpciones: async () => {
    const [alumnos, instructores, vehiculos] = await Promise.all([
      db.select({ id: alumno.id_alumno, nombre: alumno.nombre }).from(alumno).orderBy(alumno.nombre),
      db.select({ id: instructor.id_instructor, nombre: instructor.nombre, especialidad: instructor.especialidad }).from(instructor).orderBy(instructor.nombre),
      db.select({ id: vehiculo.id_vehiculo, modelo: vehiculo.modelo, placa: vehiculo.placa, estado: vehiculo.estado }).from(vehiculo).orderBy(vehiculo.placa),
    ]);
    return { alumnos, instructores, vehiculos };
  },

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
