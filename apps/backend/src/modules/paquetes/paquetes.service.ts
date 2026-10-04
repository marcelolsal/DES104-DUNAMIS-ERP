import type { ActualizarPaquete, NuevoPaquete } from "@dunamis/contracts";
import { paquetesRepository } from "./paquetes.repository.js";

const errorDeNegocio = (mensaje: string, statusCode: number) =>
  Object.assign(new Error(mensaje), { statusCode });

const esViolacionDeClaveForanea = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "23503";

const obtenerPaquete = async (id: number) => {
  const paquete = await paquetesRepository.obtener(id);
  if (!paquete) throw errorDeNegocio("Paquete no encontrado", 404);
  return paquete;
};

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const paquetesService = {
  listar: () => paquetesRepository.listar(),

  obtener: obtenerPaquete,

  crear: (datos: NuevoPaquete) => paquetesRepository.crear(datos),

  actualizar: async (id: number, datos: ActualizarPaquete) => {
    const paquete = await paquetesRepository.actualizar(id, datos);
    if (!paquete) throw errorDeNegocio("Paquete no encontrado", 404);
    return paquete;
  },

  eliminar: async (id: number) => {
    await obtenerPaquete(id);
    if (await paquetesRepository.tieneAlumnos(id)) {
      throw errorDeNegocio("No se puede eliminar un paquete asignado a alumnos", 409);
    }
    try {
      await paquetesRepository.eliminar(id);
    } catch (error) {
      if (esViolacionDeClaveForanea(error)) {
        throw errorDeNegocio("No se puede eliminar un paquete asignado a alumnos", 409);
      }
      throw error;
    }
  },
};
