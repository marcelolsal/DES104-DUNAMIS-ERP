// Lógica pura de métricas de un instructor. Sin BD ni env → testeable en aislamiento.
// Horas: solo clases impartidas, a duración fija (CLASE_DURACION_MIN).
// Estudiantes asignados: alumnos distintos con alguna clase no cancelada.

export interface ClaseDeInstructor {
  id_alumno: number;
  estado: string;
}

export const calcularMetricas = (clases: ClaseDeInstructor[], duracionMin: number) => ({
  horas_impartidas: (clases.filter((c) => c.estado === "impartida").length * duracionMin) / 60,
  estudiantes_asignados: new Set(
    clases.filter((c) => c.estado !== "cancelada").map((c) => c.id_alumno),
  ).size,
});
