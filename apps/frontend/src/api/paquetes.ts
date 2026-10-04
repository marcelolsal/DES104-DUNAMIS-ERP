import type { ActualizarPaquete, NuevoPaquete, Paquete } from "@dunamis/contracts";
import { api } from "./client.js";

export const paquetesApi = {
  listar: () => api<Paquete[]>("/api/paquetes"),
  crear: (datos: NuevoPaquete) =>
    api<Paquete>("/api/paquetes", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: ActualizarPaquete) =>
    api<Paquete>(`/api/paquetes/${String(id)}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id: number) => api<undefined>(`/api/paquetes/${String(id)}`, { method: "DELETE" }),
};
