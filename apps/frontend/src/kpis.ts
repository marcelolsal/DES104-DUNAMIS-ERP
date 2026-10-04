// Lógica pura del panel de KPIs (sin React ni red) → testeable en aislamiento.
// Las fechas son de calendario (YYYY-MM-DD) y "hoy" es el día en El Salvador,
// la misma regla que usa el backend para el reporte.

export interface Rango {
  desde: string;
  hasta: string;
}

// Mismo tope que reporteFinancieroQuerySchema (ambos extremos cuentan).
const MAX_DIAS_RANGO = 366;
const FECHA = /^\d{4}-\d{2}-\d{2}$/u;
// Formato y día real (Date.parse normaliza 2026-02-31 a 03-03; el contrato lo rechaza).
const esFecha = (fecha: string): boolean => {
  const ms = Date.parse(fecha);
  return FECHA.test(fecha) && !Number.isNaN(ms) && new Date(ms).toISOString().startsWith(fecha);
};

const diaEnElSalvador = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" });

export const hoyEnElSalvador = (ahora: Date): string => diaEnElSalvador.format(ahora);

// Mes en curso en El Salvador: del día 1 al último día del mes.
export const rangoDelMes = (ahora: Date): Rango => {
  const hoy = hoyEnElSalvador(ahora);
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return { desde: `${hoy.slice(0, 7)}-01`, hasta: `${hoy.slice(0, 7)}-${String(ultimoDia)}` };
};

// Devuelve el mensaje a mostrar, o null si el rango se puede pedir al backend.
export const validarRango = ({ desde, hasta }: Rango): string | null => {
  if (!esFecha(desde) || !esFecha(hasta)) return "Selecciona la fecha inicial y la final.";
  if (desde > hasta) return "La fecha inicial no puede ser posterior a la final.";
  const dias = (Date.parse(hasta) - Date.parse(desde)) / 86_400_000 + 1;
  if (dias > MAX_DIAS_RANGO) return `El rango no puede superar ${String(MAX_DIAS_RANGO)} días.`;
  return null;
};

const moneda = new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" });
export const formatoDinero = (monto: number): string => moneda.format(monto);

// YYYY-MM-DD → DD/MM/YYYY sin pasar por Date (evita corrimientos de zona horaria).
export const formatoFecha = (fecha: string): string => fecha.split("-").reverse().join("/");
