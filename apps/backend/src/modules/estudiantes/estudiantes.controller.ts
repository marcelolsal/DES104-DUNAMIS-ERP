// apps/backend/src/modules/estudiantes/estudiantes.controller.ts

import type { FastifyRequest, FastifyReply } from "fastify";
import type { NuevoAlumno, ActualizarAlumno } from "@dunamis/contracts";
import { estudiantesService } from "./estudiantes.service.js";

export const estudiantesController = {
  listar: async () => estudiantesService.listar(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    estudiantesService.obtener(Number(req.params.id)),

  inscribir: async (req: FastifyRequest<{ Body: NuevoAlumno }>, reply: FastifyReply) => {
    const alumno = await estudiantesService.inscribir(req.body);
    return reply.code(201).send(alumno);
  },

  actualizar: async (req: FastifyRequest) => {
    const { id } = req.params as { id: string };
    const body = req.body as ActualizarAlumno;
    return estudiantesService.actualizar(Number(id), body);
  },

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await estudiantesService.eliminar(Number(req.params.id));
    return reply.code(204).send();
  },
};