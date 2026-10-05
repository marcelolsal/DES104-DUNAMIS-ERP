// Lógica pura de la agenda semanal (sin React ni red) → testeable en aislamiento.
// Todo en hora local del navegador, igual que la grilla que se pinta.
import type { Clase } from "@dunamis/contracts";

// Filas que la grilla muestra siempre; se amplían si hay clases fuera de ellas.
export const HORA_BASE_INICIO = 7;
export const HORA_BASE_FIN = 18; // última fila (18:00–18:59)

export const addDays = (date: Date, amount: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

export const mondayOf = (date: Date): Date => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

// La semana es [lunes 00:00, lunes siguiente 00:00). El backend también devuelve
// la clase que empieza hasta una duración antes del lunes; esa no pertenece aquí.
export const enSemana = (fecha: Date, weekStart: Date): boolean =>
  fecha >= weekStart && fecha < addDays(weekStart, 7);

// Horas (filas) de la grilla: el rango base ampliado al mínimo/máximo de las
// clases dadas, para que ninguna quede sin dibujar.
export const horasDeGrilla = (fechas: Date[]): number[] => {
  const horas = fechas.map((fecha) => fecha.getHours());
  const inicio = Math.min(HORA_BASE_INICIO, ...horas);
  const fin = Math.max(HORA_BASE_FIN, ...horas);
  return Array.from({ length: fin - inicio + 1 }, (_, index) => inicio + index);
};

// Siguiente hora en punto estrictamente futura dentro del rango base; si hoy
// ya no queda ninguna, la primera de mañana.
export const siguienteFranja = (ahora: Date): Date => {
  const franja = new Date(ahora);
  franja.setHours(franja.getHours() + 1, 0, 0, 0);
  if (franja.getDate() !== ahora.getDate() || franja.getHours() > HORA_BASE_FIN) {
    franja.setTime(addDays(ahora, 1).getTime());
    franja.setHours(HORA_BASE_INICIO, 0, 0, 0);
  } else if (franja.getHours() < HORA_BASE_INICIO) {
    franja.setHours(HORA_BASE_INICIO, 0, 0, 0);
  }
  return franja;
};

type EstadoClase = Clase["estado"];

// Cambios de estado que ofrece la UI. Solo se imparte una clase que ya empezó;
// una impartida o cancelada solo vuelve a programada (para corregir un error).
export const transiciones = (estado: EstadoClase, inicio: Date, ahora: Date): EstadoClase[] => {
  if (estado !== "programada") return ["programada"];
  return inicio <= ahora ? ["impartida", "cancelada"] : ["cancelada"];
};
