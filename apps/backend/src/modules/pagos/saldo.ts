import type { EstadoPago } from "@dunamis/contracts";

// Lógica pura de saldos (cuentas por cobrar). Sin BD ni env → testeable en aislamiento.
// El dinero se suma en centavos enteros: nunca se acumulan floats.

export interface Abono {
  monto: number;
  fecha: Date;
  estado: EstadoPago;
}

export const aCentavos = (monto: number): number => Math.round(monto * 100);

// Las fechas de abono son de calendario (medianoche UTC → YYYY-MM-DD); "hoy" es
// el día calendario en El Salvador, no en UTC (que va 6 h adelante).
const diaEnElSalvador = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" });

// Un abono pendiente cuya fecha ya pasó está vencido, aunque nadie lo haya
// marcado: el estado guardado solo distingue cobrado de por cobrar.
export const estadoEfectivo = (abono: Pick<Abono, "fecha" | "estado">, hoy: Date): EstadoPago =>
  abono.estado === "pendiente" &&
  abono.fecha.toISOString().slice(0, 10) < diaEnElSalvador.format(hoy)
    ? "vencido"
    : abono.estado;

// Saldo pendiente = precio del paquete − abonos pagados (nunca negativo: un
// sobrepago se ve en total_pagado > precio). La cuenta está "vencida" si debe
// y tiene al menos un abono vencido.
export const calcularSaldo = (
  precio: number,
  abonos: Abono[],
  hoy: Date,
): { total_pagado: number; saldo_pendiente: number; estado: EstadoPago } => {
  const pagado = abonos
    .filter((abono) => abono.estado === "pagado")
    .reduce((total, abono) => total + aCentavos(abono.monto), 0);
  const saldo = Math.max(aCentavos(precio) - pagado, 0);
  const hayVencidos = abonos.some((abono) => estadoEfectivo(abono, hoy) === "vencido");
  return {
    total_pagado: pagado / 100,
    saldo_pendiente: saldo / 100,
    estado: saldo === 0 ? "pagado" : hayVencidos ? "vencido" : "pendiente",
  };
};
