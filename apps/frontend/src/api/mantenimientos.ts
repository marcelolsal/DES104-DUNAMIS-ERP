import type {
  ActualizarMantenimiento,
  Mantenimiento,
  NuevoMantenimiento,
} from "@dunamis/contracts";
import { api } from "./client.js";

export const mantenimientosApi = {
  listar: (idVehiculo?: number): Promise<Mantenimiento[]> => {
    const query = idVehiculo === undefined ? "" : `?id_vehiculo=${String(idVehiculo)}`;
    return api<Mantenimiento[]>(`/api/mantenimientos${query}`);
  },
  crear: (datos: NuevoMantenimiento): Promise<Mantenimiento> =>
    api<Mantenimiento>("/api/mantenimientos", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: ActualizarMantenimiento): Promise<Mantenimiento> =>
    api<Mantenimiento>(`/api/mantenimientos/${String(id)}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  eliminar: (id: number): Promise<undefined> =>
    api<undefined>(`/api/mantenimientos/${String(id)}`, { method: "DELETE" }),
};
