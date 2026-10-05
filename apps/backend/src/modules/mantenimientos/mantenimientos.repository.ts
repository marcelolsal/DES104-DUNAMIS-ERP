import { eq } from "drizzle-orm";
import {
  mantenimientoSchema,
  type ActualizarMantenimiento,
  type Mantenimiento,
  type NuevoMantenimiento,
} from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { parseSalida } from "../../shared/db/salida.js";
import { mantenimiento, vehiculo } from "../../shared/db/schema.js";

// PostgreSQL numeric se representa como string en Drizzle. La API conserva el
// contrato compartido, que expone costo como number y fecha como Date.
const aMantenimiento = (registro: typeof mantenimiento.$inferSelect): Mantenimiento =>
  parseSalida(mantenimientoSchema, {
    ...registro,
    costo: Number(registro.costo),
  });

const aValoresDePersistencia = (datos: NuevoMantenimiento) => ({
  ...datos,
  fecha: datos.fecha,
  costo: String(datos.costo),
});

// Única capa que toca la BD (Drizzle). ADR-0004.
export const mantenimientosRepository = {
  listar: async () => (await db.select().from(mantenimiento)).map(aMantenimiento),

  listarPorVehiculo: async (idVehiculo: number) =>
    (await db.select().from(mantenimiento).where(eq(mantenimiento.id_vehiculo, idVehiculo))).map(
      aMantenimiento,
    ),

  obtener: (id: number) =>
    db
      .select()
      .from(mantenimiento)
      .where(eq(mantenimiento.id_mantenimiento, id))
      .then((resultados) => (resultados[0] ? aMantenimiento(resultados[0]) : null)),

  existeVehiculo: (idVehiculo: number) =>
    db
      .select({ id_vehiculo: vehiculo.id_vehiculo })
      .from(vehiculo)
      .where(eq(vehiculo.id_vehiculo, idVehiculo))
      .limit(1)
      .then((resultados) => resultados.length > 0),

  crear: (datos: NuevoMantenimiento) =>
    db
      .insert(mantenimiento)
      .values(aValoresDePersistencia(datos))
      .returning()
      .then((resultados) => {
        const creado = resultados[0];
        if (!creado) throw new Error("No se pudo crear el mantenimiento");
        return aMantenimiento(creado);
      }),

  actualizar: (id: number, datos: ActualizarMantenimiento) =>
    db
      .update(mantenimiento)
      .set(aValoresDePersistencia(datos))
      .where(eq(mantenimiento.id_mantenimiento, id))
      .returning()
      .then((resultados) => (resultados[0] ? aMantenimiento(resultados[0]) : null)),

  eliminar: (id: number) => db.delete(mantenimiento).where(eq(mantenimiento.id_mantenimiento, id)),
};
