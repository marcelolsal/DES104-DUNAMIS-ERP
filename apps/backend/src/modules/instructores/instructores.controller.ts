import type { FastifyRequest, FastifyReply } from "fastify";
import type { NuevoInstructor, ActualizarInstructor } from "@dunamis/contracts";
import { instructoresService } from "./instructores.service.js";

export const instructoresController = {
  listar: async () => instructoresService.listar(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    instructoresService.obtener(Number(req.params.id)),

  crear: async (req: FastifyRequest<{ Body: NuevoInstructor }>, reply: FastifyReply) => {
    const instructor = await instructoresService.crear(req.body);
    return reply.code(201).send(instructor);
  },

  actualizar: async (req: FastifyRequest) => {
    const { id } = req.params as { id: string };
    const body = req.body as ActualizarInstructor;
    return instructoresService.actualizar(Number(id), body);
  },

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await instructoresService.eliminar(Number(req.params.id));
    return reply.code(204).send();
  },

  obtenerMetricas: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    instructoresService.obtenerMetricas(Number(req.params.id)),
};