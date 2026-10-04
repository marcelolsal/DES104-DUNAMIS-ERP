import type { ActualizarVehiculo, NuevoVehiculo, Vehiculo } from "@dunamis/contracts";
import { api } from "./client.js";

export const vehiculosApi = {
  listar: () => api<Vehiculo[]>("/api/vehiculos"),
  crear: (datos: NuevoVehiculo) =>
    api<Vehiculo>("/api/vehiculos", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: ActualizarVehiculo) =>
    api<Vehiculo>(`/api/vehiculos/${String(id)}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id: number) => api<undefined>(`/api/vehiculos/${String(id)}`, { method: "DELETE" }),
};
