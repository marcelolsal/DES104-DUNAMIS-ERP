import { eq } from "drizzle-orm";
import type { NuevoAlumno, ActualizarAlumno } from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { alumno, clase, pago } from "../../shared/db/schema.js";

export const estudiantesRepository = {
  // Métodos existentes (listar, obtener, crear)...
  listar: () => db.select().from(alumno),

  obtener: (id: number) =>
    db.select().from(alumno).where(eq(alumno.id_alumno, id)).then((r) => r[0] ?? null),

  crear: (datos: NuevoAlumno) =>
    db.insert(alumno).values(datos).returning().then((r) => r[0]),

  actualizar: (id: number, datos: ActualizarAlumno) =>
    db.update(alumno).set(datos).where(eq(alumno.id_alumno, id)).returning().then((r) => r[0] ?? null),

  // Verifica si el alumno tiene registros asociados en clase o pago
  tieneDependencias: async (id: number) => {
    const clases = await db.select().from(clase).where(eq(clase.id_alumno, id)).limit(1);
    if (clases.length > 0) return true;

    const pagos = await db.select().from(pago).where(eq(pago.id_alumno, id)).limit(1);
    if (pagos.length > 0) return true;

    return false;
  },

  eliminar: (id: number) =>
    db.delete(alumno).where(eq(alumno.id_alumno, id)).returning().then((r) => r[0] ?? null),
};