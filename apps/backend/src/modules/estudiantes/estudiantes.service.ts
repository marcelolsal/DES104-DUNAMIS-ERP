import type { ActualizarAlumno } from "@dunamis/contracts";
import { estudiantesRepository } from "./estudiantes.repository.js";

export const estudiantesService = {
  listar: () => estudiantesRepository.listar(),

  obtener: async (id: number) => {
    const alumno = await estudiantesRepository.obtener(id);
    if (!alumno) {
      throw Object.assign(new Error("Estudiante no encontrado"), { statusCode: 404 });
    }
    return alumno;
  },

  inscribir: (datos: any) => estudiantesRepository.crear(datos),

  actualizar: async (id: number, datos: ActualizarAlumno) => {
    const existe = await estudiantesRepository.obtener(id);
    if (!existe) {
      throw Object.assign(new Error("Estudiante no encontrado"), { statusCode: 404 });
    }
    return estudiantesRepository.actualizar(id, datos);
  },

  eliminar: async (id: number) => {
    const existe = await estudiantesRepository.obtener(id);
    if (!existe) {
      throw Object.assign(new Error("Estudiante no encontrado"), { statusCode: 404 });
    }

    const tieneDep = await estudiantesRepository.tieneDependencias(id);
    if (tieneDep) {
      throw Object.assign(
        new Error("No se puede eliminar el estudiante porque tiene clases o pagos asociados"),
        { statusCode: 409 }
      );
    }

    return estudiantesRepository.eliminar(id);
  },
};