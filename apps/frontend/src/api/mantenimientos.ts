import type { ActualizarMantenimiento, Mantenimiento, NuevoMantenimiento } from "@dunamis/contracts";
import { api } from "./client.js";

export const mantenimientosApi = {
  listar: () => api<Mantenimiento[]>("/api/mantenimientos"),
  crear: (datos: NuevoMantenimiento) =>
    api<Mantenimiento>("/api/mantenimientos", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: ActualizarMantenimiento) =>
    api<Mantenimiento>(`/api/mantenimientos/${String(id)}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id: number) => api<undefined>(`/api/mantenimientos/${String(id)}`, { method: "DELETE" }),
};
