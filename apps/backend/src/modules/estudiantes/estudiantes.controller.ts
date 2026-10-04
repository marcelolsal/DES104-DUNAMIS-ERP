import type { FastifyRequest, FastifyReply } from "fastify";
import type { NuevoAlumno } from "@dunamis/contracts";
import { estudiantesService } from "./estudiantes.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const estudiantesController = {
  listar: async () => estudiantesService.listar(),
  listarConDetalle: async () => estudiantesService.listarConDetalle(),
  paquetes: async () => estudiantesService.paquetes(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    estudiantesService.obtener(Number(req.params.id)),

  inscribir: async (req: FastifyRequest<{ Body: NuevoAlumno }>, reply: FastifyReply) => {
    const alumno = await estudiantesService.inscribir(req.body);
    return reply.code(201).send(alumno);
  },

  actualizar: async (req: FastifyRequest<{ Params: { id: string }; Body: NuevoAlumno }>) =>
    estudiantesService.actualizar(Number(req.params.id), req.body),
};
