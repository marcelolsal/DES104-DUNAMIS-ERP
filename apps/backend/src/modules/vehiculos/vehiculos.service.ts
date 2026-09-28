import type { ActualizarVehiculo, NuevoVehiculo } from "@dunamis/contracts";
import { vehiculosRepository } from "./vehiculos.repository.js";

const errorDeNegocio = (mensaje: string, statusCode: number) =>
  Object.assign(new Error(mensaje), { statusCode });

const esViolacionDeClaveForanea = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "23503";

const obtenerVehiculo = async (id: number) => {
  const vehiculo = await vehiculosRepository.obtener(id);
  if (!vehiculo) throw errorDeNegocio("Vehículo no encontrado", 404);
  return vehiculo;
};

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const vehiculosService = {
  listar: () => vehiculosRepository.listar(),

  obtener: obtenerVehiculo,

  crear: (datos: NuevoVehiculo) => vehiculosRepository.crear(datos),

  actualizar: async (id: number, datos: ActualizarVehiculo) => {
    const vehiculo = await vehiculosRepository.actualizar(id, datos);
    if (!vehiculo) throw errorDeNegocio("Vehículo no encontrado", 404);
    return vehiculo;
  },

  eliminar: async (id: number) => {
    await obtenerVehiculo(id);
    if (await vehiculosRepository.tieneDependencias(id)) {
      throw errorDeNegocio("No se puede eliminar un vehículo con clases o mantenimientos asociados", 409);
    }
    try {
      await vehiculosRepository.eliminar(id);
    } catch (error) {
      if (esViolacionDeClaveForanea(error)) {
        throw errorDeNegocio("No se puede eliminar un vehículo con clases o mantenimientos asociados", 409);
      }
      throw error;
    }
  },
};
