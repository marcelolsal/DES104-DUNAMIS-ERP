import { eq } from "drizzle-orm";
import {
  vehiculoSchema,
  type ActualizarVehiculo,
  type NuevoVehiculo,
  type Vehiculo,
} from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { clase, mantenimiento, vehiculo } from "../../shared/db/schema.js";

// Los fixtures históricos usan "en mantenimiento"; la API conserva el valor
// canónico del contrato, "en_mantenimiento", sin modificar datos existentes.
const aVehiculo = (registro: typeof vehiculo.$inferSelect): Vehiculo =>
  vehiculoSchema.parse({
    ...registro,
    estado: registro.estado === "en mantenimiento" ? "en_mantenimiento" : registro.estado,
  });

// Única capa que toca la BD (Drizzle). ADR-0004.
export const vehiculosRepository = {
  listar: async () => (await db.select().from(vehiculo)).map(aVehiculo),

  obtener: (id: number) =>
    db
      .select()
      .from(vehiculo)
      .where(eq(vehiculo.id_vehiculo, id))
      .then((resultados) => (resultados[0] ? aVehiculo(resultados[0]) : null)),

  crear: (datos: NuevoVehiculo) =>
    db
      .insert(vehiculo)
      .values(datos)
      .returning()
      .then((resultados) => {
        const creado = resultados[0];
        if (!creado) throw new Error("No se pudo crear el vehículo");
        return aVehiculo(creado);
      }),

  actualizar: (id: number, datos: ActualizarVehiculo) =>
    db
      .update(vehiculo)
      .set(datos)
      .where(eq(vehiculo.id_vehiculo, id))
      .returning()
      .then((resultados) => (resultados[0] ? aVehiculo(resultados[0]) : null)),

  tieneDependencias: async (idVehiculo: number) => {
    const [clases, mantenimientos] = await Promise.all([
      db
        .select({ id_clase: clase.id_clase })
        .from(clase)
        .where(eq(clase.id_vehiculo, idVehiculo))
        .limit(1),
      db
        .select({ id_mantenimiento: mantenimiento.id_mantenimiento })
        .from(mantenimiento)
        .where(eq(mantenimiento.id_vehiculo, idVehiculo))
        .limit(1),
    ]);
    return clases.length > 0 || mantenimientos.length > 0;
  },

  eliminar: (id: number) => db.delete(vehiculo).where(eq(vehiculo.id_vehiculo, id)),
};
