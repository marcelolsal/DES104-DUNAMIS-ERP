import type { ActualizarInstructor, Instructor, NuevoInstructor } from "@dunamis/contracts";
import { api } from "./client.js";

export interface MetricasInstructor {
  id_instructor: number;
  horas_impartidas: number;
  estudiantes_asignados: number;
}

export const instructoresApi = {
  listar: () => api<Instructor[]>("/api/instructores"),
  metricas: (id: number) => api<MetricasInstructor>(`/api/instructores/${String(id)}/metricas`),
  crear: (datos: NuevoInstructor) =>
    api<Instructor>("/api/instructores", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: ActualizarInstructor) =>
    api<Instructor>(`/api/instructores/${String(id)}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  eliminar: (id: number) => api<undefined>(`/api/instructores/${String(id)}`, { method: "DELETE" }),
};
