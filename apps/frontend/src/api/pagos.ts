import type { EstadoPago, NuevoPago, Pago, PagoListado, SaldoAlumno } from "@dunamis/contracts";
import { api } from "./client.js";

export const pagosApi = {
  listar: (filtros: { id_alumno?: number; estado?: EstadoPago } = {}) => {
    const params = new URLSearchParams();
    if (filtros.id_alumno) params.set("id_alumno", String(filtros.id_alumno));
    if (filtros.estado) params.set("estado", filtros.estado);
    const query = params.toString();
    return api<PagoListado[]>(`/api/pagos${query ? `?${query}` : ""}`);
  },
  saldo: (idAlumno: number) => api<SaldoAlumno>(`/api/pagos/saldo/${String(idAlumno)}`),
  cuentasPorCobrar: () => api<SaldoAlumno[]>("/api/pagos/cuentas-por-cobrar"),
  crear: (datos: NuevoPago) =>
    api<Pago>("/api/pagos", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id: number, datos: NuevoPago) =>
    api<Pago>(`/api/pagos/${String(id)}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id: number) => api<undefined>(`/api/pagos/${String(id)}`, { method: "DELETE" }),
};
