import type { FastifyRequest, FastifyReply } from "fastify";
import type { NuevoClase } from "@dunamis/contracts";
import { clasesService } from "./clases.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const clasesController = {
  listar: async () => clasesService.listar(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    clasesService.obtener(Number(req.params.id)),

  crear: async (req: FastifyRequest<{ Body: NuevoClase }>, reply: FastifyReply) => {
    const clase = await clasesService.crear(req.body);
    return reply.code(201).send(clase);
  },

  actualizar: async (req: FastifyRequest<{ Params: { id: string }; Body: NuevoClase }>) =>
    clasesService.actualizar(Number(req.params.id), req.body),

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await clasesService.eliminar(Number(req.params.id));
    return reply.code(204).send();
  },
};
