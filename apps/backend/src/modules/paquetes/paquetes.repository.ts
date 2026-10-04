import { eq } from "drizzle-orm";
import type { ActualizarPaquete, NuevoPaquete, Paquete } from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { alumno, paquete } from "../../shared/db/schema.js";

// PostgreSQL numeric se representa como string en Drizzle. La API conserva el
// contrato compartido, que expone precio como number.
const aPaquete = (registro: typeof paquete.$inferSelect): Paquete => ({
  ...registro,
  precio: Number(registro.precio),
});

const aValoresDePersistencia = (datos: NuevoPaquete) => ({
  ...datos,
  precio: String(datos.precio),
});

// Única capa que toca la BD (Drizzle). ADR-0004.
export const paquetesRepository = {
  listar: async () => (await db.select().from(paquete)).map(aPaquete),

  obtener: (id: number) =>
    db
      .select()
      .from(paquete)
      .where(eq(paquete.id_paquete, id))
      .then((resultados) => (resultados[0] ? aPaquete(resultados[0]) : null)),

  crear: (datos: NuevoPaquete) =>
    db
      .insert(paquete)
      .values(aValoresDePersistencia(datos))
      .returning()
      .then((resultados) => {
        const creado = resultados[0];
        if (!creado) throw new Error("No se pudo crear el paquete");
        return aPaquete(creado);
      }),

  actualizar: (id: number, datos: ActualizarPaquete) =>
    db
      .update(paquete)
      .set(aValoresDePersistencia(datos))
      .where(eq(paquete.id_paquete, id))
      .returning()
      .then((resultados) => (resultados[0] ? aPaquete(resultados[0]) : null)),

  tieneAlumnos: (idPaquete: number) =>
    db
      .select({ id_alumno: alumno.id_alumno })
      .from(alumno)
      .where(eq(alumno.id_paquete, idPaquete))
      .limit(1)
      .then((resultados) => resultados.length > 0),

  eliminar: (id: number) => db.delete(paquete).where(eq(paquete.id_paquete, id)),
};
