import type { EstudianteListado, NuevoAlumno } from "@dunamis/contracts";
import { estudiantesRepository } from "./estudiantes.repository.js";

const conDependencias = () =>
  Object.assign(new Error("No se puede eliminar un alumno con clases o pagos asociados"), {
    statusCode: 409,
  });

// FK de Postgres (23503). Al escribir un alumno la única FK es id_paquete.
const esViolacionFk = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "23503";

// Paquete inexistente → 400 legible en vez de un 500 por la FK.
const conPaqueteValido = async <T>(datos: NuevoAlumno, escribir: () => Promise<T>) => {
  try {
    return await escribir();
  } catch (error) {
    if (!esViolacionFk(error)) throw error;
    throw Object.assign(new Error(`El paquete ${String(datos.id_paquete)} no existe`), {
      statusCode: 400,
    });
  }
};

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const estudiantesService = {
  listar: () => estudiantesRepository.listar(),

  listarConDetalle: async (): Promise<EstudianteListado[]> => {
    const rows = await estudiantesRepository.listarConDetalle();
    const grouped = new Map<number, (typeof rows)[number] & { horas_completadas: number }>();

    for (const row of rows) {
      const current = grouped.get(row.id_alumno);
      if (!current) {
        grouped.set(row.id_alumno, {
          ...row,
          horas_completadas: row.estado_clase === "impartida" ? 1 : 0,
        });
        continue;
      }
      if (row.estado_clase === "impartida") current.horas_completadas += 1;
    }

    return [...grouped.values()].map((row) => {
      const horasCompletadas = Math.min(row.horas_completadas, row.horas_totales);
      const progreso = Math.round((horasCompletadas / row.horas_totales) * 100);
      return {
        id_alumno: row.id_alumno,
        nombre: row.nombre,
        dui: row.dui,
        correo: row.correo,
        telefono: row.telefono,
        contacto_emergencia: row.contacto_emergencia,
        id_paquete: row.id_paquete,
        fecha_inscripcion: row.fecha_inscripcion,
        curso: row.curso,
        instructor: row.instructor,
        horas_completadas: horasCompletadas,
        horas_totales: row.horas_totales,
        progreso,
        estado: progreso >= 100 ? "Graduado" : "Activo",
      };
    });
  },

  paquetes: () => estudiantesRepository.listarPaquetes(),

  obtener: async (id: number) => {
    const alumno = await estudiantesRepository.obtener(id);
    if (!alumno) throw Object.assign(new Error("Alumno no encontrado"), { statusCode: 404 });
    return alumno;
  },

  inscribir: (datos: NuevoAlumno) =>
    conPaqueteValido(datos, () => estudiantesRepository.crear(datos)),

  actualizar: async (id: number, datos: NuevoAlumno) => {
    const alumno = await conPaqueteValido(datos, () => estudiantesRepository.actualizar(id, datos));
    if (!alumno) throw Object.assign(new Error("Alumno no encontrado"), { statusCode: 404 });
    return alumno;
  },

  eliminar: async (id: number) => {
    const alumno = await estudiantesRepository.obtener(id);
    if (!alumno) throw Object.assign(new Error("Alumno no encontrado"), { statusCode: 404 });
    if (await estudiantesRepository.tieneDependencias(id)) throw conDependencias();
    try {
      await estudiantesRepository.eliminar(id);
    } catch (error) {
      // FK (23503): cubre la carrera entre la comprobación y el borrado.
      throw esViolacionFk(error) ? conDependencias() : error;
    }
  },
};
