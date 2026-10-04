import type { NuevoInstructor, ActualizarInstructor } from "@dunamis/contracts";
import { config } from "../../shared/config.js";
import { instructoresRepository } from "./instructores.repository.js";
import { calcularMetricas } from "./metricas.js";

const errorDeNegocio = (mensaje: string, statusCode: number) =>
  Object.assign(new Error(mensaje), { statusCode });

const tieneCodigoPg = (error: unknown, codigo: string) =>
  typeof error === "object" && error !== null && "code" in error && error.code === codigo;
const esViolacionDeClaveForanea = (error: unknown) => tieneCodigoPg(error, "23503");

const obtenerInstructor = async (id: number) => {
  const instructor = await instructoresRepository.obtener(id);
  if (!instructor) throw errorDeNegocio("Instructor no encontrado", 404);
  return instructor;
};

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const instructoresService = {
  listar: () => instructoresRepository.listar(),

  obtener: obtenerInstructor,

  crear: (datos: NuevoInstructor) => instructoresRepository.crear(datos),

  actualizar: async (id: number, datos: ActualizarInstructor) => {
    const instructor = await instructoresRepository.actualizar(id, datos);
    if (!instructor) throw errorDeNegocio("Instructor no encontrado", 404);
    return instructor;
  },

  eliminar: async (id: number) => {
    await obtenerInstructor(id);
    if (await instructoresRepository.tieneClases(id)) {
      throw errorDeNegocio("No se puede eliminar un instructor con clases asociadas", 409);
    }
    try {
      await instructoresRepository.eliminar(id);
    } catch (error) {
      if (esViolacionDeClaveForanea(error)) {
        throw errorDeNegocio("No se puede eliminar un instructor con clases asociadas", 409);
      }
      throw error;
    }
  },

  obtenerMetricas: async (id: number) => {
    await obtenerInstructor(id);
    const clases = await instructoresRepository.clasesDeInstructor(id);
    return { id_instructor: id, ...calcularMetricas(clases, config.CLASE_DURACION_MIN) };
  },
};
