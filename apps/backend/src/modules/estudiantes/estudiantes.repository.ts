import { eq } from "drizzle-orm";
import type { NuevoAlumno } from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { alumno } from "../../shared/db/schema.js";

// Única capa que toca la BD (Drizzle). ADR-0004.
export const estudiantesRepository = {
  listar: () => db.select().from(alumno),

  obtener: (id: number) =>
    db.select().from(alumno).where(eq(alumno.id_alumno, id)).then((r) => r[0] ?? null),

  crear: (datos: NuevoAlumno) =>
    db
      .insert(alumno)
      .values({ ...datos, fecha_inscripcion: datos.fecha_inscripcion.toISOString().slice(0, 10) })
      .returning()
      .then((r) => r[0]!),
};
