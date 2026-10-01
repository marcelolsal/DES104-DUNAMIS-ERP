import type { FastifyReply, FastifyRequest } from "fastify";
import {
  idPaqueteParamsSchema,
  type ActualizarPaquete,
  type NuevoPaquete,
} from "@dunamis/contracts";
import { paquetesService } from "./paquetes.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const paquetesController = {
  listar: async () => paquetesService.listar(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    paquetesService.obtener(idPaqueteParamsSchema.parse(req.params).id),

  crear: async (req: FastifyRequest<{ Body: NuevoPaquete }>, reply: FastifyReply) => {
    const paquete = await paquetesService.crear(req.body);
    return reply.code(201).send(paquete);
  },

  actualizar: async (
    req: FastifyRequest<{ Params: { id: string }; Body: ActualizarPaquete }>,
  ) => paquetesService.actualizar(idPaqueteParamsSchema.parse(req.params).id, req.body),

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await paquetesService.eliminar(idPaqueteParamsSchema.parse(req.params).id);
    return reply.code(204).send();
  },
};
