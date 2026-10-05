import type { Alumno, EstudianteListado, NuevoAlumno, Paquete } from "@dunamis/contracts";
import { api } from "./client.js";

// Tipos compartidos con el backend vía @dunamis/contracts: un solo contrato.
export const estudiantesApi = {
  listar: () => api<EstudianteListado[]>("/api/estudiantes"),
  paquetes: () => api<Paquete[]>("/api/estudiantes/paquetes"),
  obtener: (id: number) => api<Alumno>(`/api/estudiantes/${String(id)}`),
  inscribir: (datos: NuevoAlumno) =>
    api<Alumno>("/api/estudiantes", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: NuevoAlumno) =>
    api<Alumno>(`/api/estudiantes/${String(id)}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id: number) => api<undefined>(`/api/estudiantes/${String(id)}`, { method: "DELETE" }),
};
