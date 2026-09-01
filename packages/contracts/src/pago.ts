import { z } from "zod";

export const metodoPago = z.enum(["efectivo", "tarjeta", "transferencia"]);
export const estadoPago = z.enum(["pagado", "pendiente", "vencido"]);

export const pagoSchema = z.object({
  id_pago: z.number().int().positive(),
  id_alumno: z.number().int().positive(),
  monto: z.number().positive(),
  fecha: z.coerce.date(),
  metodo: metodoPago,
  estado: estadoPago,
});
export type Pago = z.infer<typeof pagoSchema>;
