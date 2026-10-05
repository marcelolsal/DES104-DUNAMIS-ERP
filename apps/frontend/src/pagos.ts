import type { NuevoPago, PagoListado } from "@dunamis/contracts";

// Lógica pura de la página de Pagos. Sin React ni red → testeable en aislamiento.

export interface FormPago {
  id_alumno: number;
  monto: string; // valor crudo del <input type="number">
  fecha: string; // YYYY-MM-DD
  metodo: NuevoPago["metodo"];
  estado: NuevoPago["estado"];
}

// Las fechas de pago son de calendario: el backend las devuelve como ISO a
// medianoche UTC. Se leen en UTC; en hora local (UTC-6) saldría el día anterior.
// El contrato tipa `fecha` como Date, pero por JSON llega como string.
export const fechaUTC = (fecha: Date | string): string =>
  new Date(fecha).toISOString().slice(0, 10);

export const fechaCorta = (fecha: Date | string): string =>
  fechaUTC(fecha).split("-").reverse().join("/");

// "Hoy" para el alta sí es el día local del usuario (no el de UTC).
export const hoyLocal = (ahora = new Date()): string =>
  [ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate()]
    .map((parte) => String(parte).padStart(2, "0"))
    .join("-");

const usd = new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" });
export const dinero = (monto: number): string => usd.format(monto);

export const formNuevo = (id_alumno = 0, ahora = new Date()): FormPago => ({
  id_alumno,
  monto: "",
  fecha: hoyLocal(ahora),
  metodo: "efectivo",
  estado: "pagado",
});

// "vencido" lo deriva el backend (pendiente con fecha pasada): al editar se
// precarga como pendiente para no fijarlo como estado guardado.
export const formDesdePago = (pago: PagoListado): FormPago => ({
  id_alumno: pago.id_alumno,
  monto: String(pago.monto),
  fecha: fechaUTC(pago.fecha),
  metodo: pago.metodo,
  estado: pago.estado === "vencido" ? "pendiente" : pago.estado,
});

export const armarPago = (form: FormPago): NuevoPago => ({ ...form, monto: Number(form.monto) });
