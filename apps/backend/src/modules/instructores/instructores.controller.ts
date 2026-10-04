import type { FastifyRequest, FastifyReply } from "fastify";
import {
  idInstructorParamsSchema,
  type NuevoInstructor,
  type ActualizarInstructor,
} from "@dunamis/contracts";
import { instructoresService } from "./instructores.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const instructoresController = {
  listar: async () => instructoresService.listar(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    instructoresService.obtener(idInstructorParamsSchema.parse(req.params).id),

  crear: async (req: FastifyRequest<{ Body: NuevoInstructor }>, reply: FastifyReply) => {
    const instructor = await instructoresService.crear(req.body);
    return reply.code(201).send(instructor);
  },

  actualizar: async (req: FastifyRequest<{ Params: { id: string }; Body: ActualizarInstructor }>) =>
    instructoresService.actualizar(idInstructorParamsSchema.parse(req.params).id, req.body),

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await instructoresService.eliminar(idInstructorParamsSchema.parse(req.params).id);
    return reply.code(204).send();
  },

  obtenerMetricas: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    instructoresService.obtenerMetricas(idInstructorParamsSchema.parse(req.params).id),
};
