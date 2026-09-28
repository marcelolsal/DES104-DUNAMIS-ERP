import { z } from "zod";

export const estadoVehiculo = z.enum(["activo", "en_mantenimiento", "baja"]);

export const vehiculoSchema = z.object({
  id_vehiculo: z.number().int().positive(),
  placa: z.string().min(1),
  modelo: z.string().min(1),
  kilometraje: z.number().int().nonnegative(),
  estado: estadoVehiculo,
});
export type Vehiculo = z.infer<typeof vehiculoSchema>;

// Payloads de escritura: el id lo genera la base de datos.
export const nuevoVehiculoSchema = vehiculoSchema.omit({ id_vehiculo: true });
export type NuevoVehiculo = z.infer<typeof nuevoVehiculoSchema>;

export const actualizarVehiculoSchema = nuevoVehiculoSchema;
export type ActualizarVehiculo = z.infer<typeof actualizarVehiculoSchema>;
