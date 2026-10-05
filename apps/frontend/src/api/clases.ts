import type { Clase, ClaseAgenda, NuevoClase } from "@dunamis/contracts";
import { api } from "./client.js";

export interface OpcionesClase {
  alumnos: { id: number; nombre: string }[];
  instructores: { id: number; nombre: string; especialidad: string }[];
  vehiculos: { id: number; modelo: string; placa: string; estado: string }[];
  duracion_min: number;
}

export const clasesApi = {
  agenda: (desde: Date, hasta: Date) => {
    const params = new URLSearchParams({ desde: desde.toISOString(), hasta: hasta.toISOString() });
    return api<ClaseAgenda[]>(`/api/clases/agenda?${params}`);
  },
  opciones: () => api<OpcionesClase>("/api/clases/opciones"),
  crear: (datos: NuevoClase) =>
    api<Clase>("/api/clases", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: NuevoClase) =>
    api<Clase>(`/api/clases/${String(id)}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id: number) => api<undefined>(`/api/clases/${String(id)}`, { method: "DELETE" }),
};
