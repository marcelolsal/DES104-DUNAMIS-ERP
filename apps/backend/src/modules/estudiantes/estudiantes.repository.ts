import { desc, eq } from "drizzle-orm";
import type { NuevoAlumno } from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { alumno, clase, instructor, paquete } from "../../shared/db/schema.js";

// Única capa que toca la BD (Drizzle). ADR-0004.
export const estudiantesRepository = {
  listar: () => db.select().from(alumno),

  listarConDetalle: () =>
    db
      .select({
        id_alumno: alumno.id_alumno,
        nombre: alumno.nombre,
        dui: alumno.dui,
        correo: alumno.correo,
        telefono: alumno.telefono,
        contacto_emergencia: alumno.contacto_emergencia,
        fecha_inscripcion: alumno.fecha_inscripcion,
        id_paquete: alumno.id_paquete,
        curso: paquete.nombre,
        horas_totales: paquete.total_horas,
        id_instructor: instructor.id_instructor,
        instructor: instructor.nombre,
        fecha_clase: clase.fecha_hora,
        estado_clase: clase.estado,
      })
      .from(alumno)
      .innerJoin(paquete, eq(alumno.id_paquete, paquete.id_paquete))
      .leftJoin(clase, eq(alumno.id_alumno, clase.id_alumno))
      .leftJoin(instructor, eq(clase.id_instructor, instructor.id_instructor))
      .orderBy(desc(clase.fecha_hora)),

  listarPaquetes: () => db.select().from(paquete),

  obtener: (id: number) =>
    db.select().from(alumno).where(eq(alumno.id_alumno, id)).then((r) => r[0] ?? null),

  crear: (datos: NuevoAlumno) =>
    db
      .insert(alumno)
      .values({ ...datos, fecha_inscripcion: datos.fecha_inscripcion.toISOString().slice(0, 10) })
      .returning()
      .then((r) => r[0]!),

  actualizar: (id: number, datos: NuevoAlumno) =>
    db
      .update(alumno)
      .set({ ...datos, fecha_inscripcion: datos.fecha_inscripcion.toISOString().slice(0, 10) })
      .where(eq(alumno.id_alumno, id))
      .returning()
      .then((r) => r[0] ?? null),
};
