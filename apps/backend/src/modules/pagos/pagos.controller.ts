import type { FastifyReply, FastifyRequest } from "fastify";
import {
  idPagoParamsSchema,
  listarPagosQuerySchema,
  type ActualizarPago,
  type NuevoPago,
} from "@dunamis/contracts";
import { pagosService } from "./pagos.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const pagosController = {
  listar: async (req: FastifyRequest<{ Querystring: { id_alumno?: string; estado?: string } }>) =>
    pagosService.listar(listarPagosQuerySchema.parse(req.query)),

  cuentasPorCobrar: async () => pagosService.cuentasPorCobrar(),

  // Aquí `:id` es el id del alumno, no el del pago.
  saldoDeAlumno: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    pagosService.saldoDeAlumno(idPagoParamsSchema.parse(req.params).id),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    pagosService.obtener(idPagoParamsSchema.parse(req.params).id),

  crear: async (req: FastifyRequest<{ Body: NuevoPago }>, reply: FastifyReply) => {
    const pago = await pagosService.crear(req.body);
    return reply.code(201).send(pago);
  },

  actualizar: async (req: FastifyRequest<{ Params: { id: string }; Body: ActualizarPago }>) =>
    pagosService.actualizar(idPagoParamsSchema.parse(req.params).id, req.body),

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await pagosService.eliminar(idPagoParamsSchema.parse(req.params).id);
    return reply.code(204).send();
  },
};
