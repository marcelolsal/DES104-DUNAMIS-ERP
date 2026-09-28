import type { FastifyReply, FastifyRequest } from "fastify";
import {
  listarMantenimientosQuerySchema,
  type ActualizarMantenimiento,
  type NuevoMantenimiento,
} from "@dunamis/contracts";
import { mantenimientosService } from "./mantenimientos.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const mantenimientosController = {
  listar: async (req: FastifyRequest<{ Querystring: { id_vehiculo?: string } }>) => {
    const { id_vehiculo } = listarMantenimientosQuerySchema.parse(req.query);
    return id_vehiculo === undefined
      ? mantenimientosService.listar()
      : mantenimientosService.listarPorVehiculo(id_vehiculo);
  },

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    mantenimientosService.obtener(Number(req.params.id)),

  crear: async (req: FastifyRequest<{ Body: NuevoMantenimiento }>, reply: FastifyReply) => {
    const mantenimiento = await mantenimientosService.crear(req.body);
    return reply.code(201).send(mantenimiento);
  },

  actualizar: async (
    req: FastifyRequest<{ Params: { id: string }; Body: ActualizarMantenimiento }>,
  ) => mantenimientosService.actualizar(Number(req.params.id), req.body),

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await mantenimientosService.eliminar(Number(req.params.id));
    return reply.code(204).send();
  },
};
