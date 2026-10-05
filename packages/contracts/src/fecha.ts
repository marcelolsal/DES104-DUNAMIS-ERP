import { z } from "zod";

// Fecha de calendario en payloads de escritura (columnas `date` de la BD).
export const fechaPayloadSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "La fecha debe tener formato YYYY-MM-DD")
  .refine((fecha) => {
    const anio = Number(fecha.slice(0, 4));
    const mes = Number(fecha.slice(5, 7));
    const dia = Number(fecha.slice(8, 10));
    const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia));
    return (
      anio >= 1 &&
      fechaUtc.getUTCFullYear() === anio &&
      fechaUtc.getUTCMonth() === mes - 1 &&
      fechaUtc.getUTCDate() === dia
    );
  }, "La fecha no es válida");
