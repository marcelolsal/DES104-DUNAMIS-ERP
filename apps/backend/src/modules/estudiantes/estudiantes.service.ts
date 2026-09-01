import type { NuevoAlumno } from "@dunamis/contracts";
import { estudiantesRepository } from "./estudiantes.repository.js";

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const estudiantesService = {
  listar: () => estudiantesRepository.listar(),

  obtener: async (id: number) => {
    const alumno = await estudiantesRepository.obtener(id);
    if (!alumno) throw Object.assign(new Error("Alumno no encontrado"), { statusCode: 404 });
    return alumno;
  },

  inscribir: (datos: NuevoAlumno) => estudiantesRepository.crear(datos),
};
