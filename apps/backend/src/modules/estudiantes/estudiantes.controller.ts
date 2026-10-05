import type { FastifyRequest, FastifyReply } from "fastify";
import { idAlumnoParamsSchema, type NuevoAlumno } from "@dunamis/contracts";
import { estudiantesService } from "./estudiantes.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const estudiantesController = {
  listar: async () => estudiantesService.listar(),
  listarConDetalle: async () => estudiantesService.listarConDetalle(),
  paquetes: async () => estudiantesService.paquetes(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    estudiantesService.obtener(idAlumnoParamsSchema.parse(req.params).id),

  inscribir: async (req: FastifyRequest<{ Body: NuevoAlumno }>, reply: FastifyReply) => {
    const alumno = await estudiantesService.inscribir(req.body);
    return reply.code(201).send(alumno);
  },

  actualizar: async (req: FastifyRequest<{ Params: { id: string }; Body: NuevoAlumno }>) =>
    estudiantesService.actualizar(idAlumnoParamsSchema.parse(req.params).id, req.body),

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const id = Number(req.params.id);
    // Solo dígitos y dentro del integer de Postgres; si no, la consulta revienta con 500.
    if (!/^\d+$/.test(req.params.id) || id < 1 || id > 2147483647)
      return reply.code(400).send({ error: "Id inválido" });
    await estudiantesService.eliminar(id);
    return reply.code(204).send();
  },
};
