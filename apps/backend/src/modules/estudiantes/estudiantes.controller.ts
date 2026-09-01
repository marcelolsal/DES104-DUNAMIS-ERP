import type { FastifyRequest, FastifyReply } from "fastify";
import type { NuevoAlumno } from "@dunamis/contracts";
import { estudiantesService } from "./estudiantes.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const estudiantesController = {
  listar: async () => estudiantesService.listar(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    estudiantesService.obtener(Number(req.params.id)),

  inscribir: async (req: FastifyRequest<{ Body: NuevoAlumno }>, reply: FastifyReply) => {
    const alumno = await estudiantesService.inscribir(req.body);
    return reply.code(201).send(alumno);
  },
};
