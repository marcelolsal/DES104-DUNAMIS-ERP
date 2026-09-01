import type { Alumno, NuevoAlumno } from "@dunamis/contracts";
import { api } from "./client.js";

// Tipos compartidos con el backend vía @dunamis/contracts: un solo contrato.
export const estudiantesApi = {
  listar: () => api<Alumno[]>("/api/estudiantes"),
  obtener: (id: number) => api<Alumno>(`/api/estudiantes/${id}`),
  inscribir: (datos: NuevoAlumno) =>
    api<Alumno>("/api/estudiantes", { method: "POST", body: JSON.stringify(datos) }),
};
