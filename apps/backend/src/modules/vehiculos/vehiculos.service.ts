import type { ActualizarVehiculo, NuevoVehiculo } from "@dunamis/contracts";
import { vehiculosRepository } from "./vehiculos.repository.js";

const errorDeNegocio = (mensaje: string, statusCode: number) =>
  Object.assign(new Error(mensaje), { statusCode });

const tieneCodigoPg = (error: unknown, codigo: string) =>
  typeof error === "object" && error !== null && "code" in error && error.code === codigo;
const esViolacionDeClaveForanea = (error: unknown) => tieneCodigoPg(error, "23503");

// La unicidad de la placa la garantiza la BD; aquí solo se traduce a 409.
const conPlacaUnica = async <T>(operacion: Promise<T>) => {
  try {
    return await operacion;
  } catch (error) {
    if (tieneCodigoPg(error, "23505")) throw errorDeNegocio("Ya existe un vehículo con esa placa", 409);
    throw error;
  }
};

const obtenerVehiculo = async (id: number) => {
  const vehiculo = await vehiculosRepository.obtener(id);
  if (!vehiculo) throw errorDeNegocio("Vehículo no encontrado", 404);
  return vehiculo;
};

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const vehiculosService = {
  listar: () => vehiculosRepository.listar(),

  obtener: obtenerVehiculo,

  crear: (datos: NuevoVehiculo) => conPlacaUnica(vehiculosRepository.crear(datos)),

  actualizar: async (id: number, datos: ActualizarVehiculo) => {
    const vehiculo = await conPlacaUnica(vehiculosRepository.actualizar(id, datos));
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
