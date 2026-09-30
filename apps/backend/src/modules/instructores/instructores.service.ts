import type { NuevoInstructor, ActualizarInstructor } from "@dunamis/contracts";
import { instructoresRepository } from "./instructores.repository.js";

export const instructoresService = {
  listar: () => instructoresRepository.listar(),

  obtener: async (id: number) => {
    const inst = await instructoresRepository.obtener(id);
    if (!inst) throw Object.assign(new Error("Instructor no encontrado"), { statusCode: 404 });
    return inst;
  },

  crear: (datos: NuevoInstructor) => instructoresRepository.crear(datos),

  actualizar: async (id: number, datos: ActualizarInstructor) => {
    const inst = await instructoresRepository.obtener(id);
    if (!inst) throw Object.assign(new Error("Instructor no encontrado"), { statusCode: 404 });
    return instructoresRepository.actualizar(id, datos);
  },

  eliminar: async (id: number) => {
    const inst = await instructoresRepository.obtener(id);
    if (!inst) throw Object.assign(new Error("Instructor no encontrado"), { statusCode: 404 });
    return instructoresRepository.eliminar(id);
  },

  obtenerMetricas: async (id: number) => {
    const inst = await instructoresRepository.obtener(id);
    if (!inst) throw Object.assign(new Error("Instructor no encontrado"), { statusCode: 404 });
    return instructoresRepository.obtenerMetricas(id);
  },
};