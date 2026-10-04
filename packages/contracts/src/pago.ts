import { z } from "zod";
import { fechaPayloadSchema } from "./fecha.js";

const NUMERIC_10_2_MAX = 99_999_999.99;

export const metodoPago = z.enum(["efectivo", "tarjeta", "transferencia"]);
export const estadoPago = z.enum(["pagado", "pendiente", "vencido"]);
export type EstadoPago = z.infer<typeof estadoPago>;

const pagoPayloadSchema = z.object({
  id_alumno: z.number().int().positive(),
  monto: z.number().positive().max(NUMERIC_10_2_MAX).multipleOf(0.01),
  fecha: fechaPayloadSchema,
  metodo: metodoPago,
  estado: estadoPago,
});

export const pagoSchema = pagoPayloadSchema.extend({
  id_pago: z.number().int().positive(),
  fecha: z.coerce.date(),
});
export type Pago = z.infer<typeof pagoSchema>;

// Fila del listado: el abono con el alumno y su curso (paquete) ya resueltos.
export const pagoListadoSchema = pagoSchema.extend({
  alumno: z.string().min(1),
  curso: z.string().min(1),
});
export type PagoListado = z.infer<typeof pagoListadoSchema>;

// Payloads de escritura: el id lo genera la base de datos. Registrar un abono
// es, por defecto, registrar dinero ya recibido.
export const nuevoPagoSchema = pagoPayloadSchema.extend({ estado: estadoPago.default("pagado") });
export type NuevoPago = z.infer<typeof nuevoPagoSchema>;

export const actualizarPagoSchema = nuevoPagoSchema;
export type ActualizarPago = z.infer<typeof actualizarPagoSchema>;

export const listarPagosQuerySchema = z.object({
  id_alumno: z.coerce.number().int().positive().optional(),
  estado: estadoPago.optional(),
});
export type ListarPagosQuery = z.infer<typeof listarPagosQuerySchema>;

export const idPagoParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Cuenta por cobrar de un alumno: precio de su paquete menos lo ya pagado.
export const saldoAlumnoSchema = z.object({
  id_alumno: z.number().int().positive(),
  alumno: z.string().min(1),
  curso: z.string().min(1),
  precio: z.number().nonnegative(),
  total_pagado: z.number().nonnegative(),
  saldo_pendiente: z.number().nonnegative(),
  estado: estadoPago,
});
export type SaldoAlumno = z.infer<typeof saldoAlumnoSchema>;
