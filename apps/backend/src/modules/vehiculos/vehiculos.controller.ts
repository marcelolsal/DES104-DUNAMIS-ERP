import type { FastifyReply, FastifyRequest } from "fastify";
import type { ActualizarVehiculo, NuevoVehiculo } from "@dunamis/contracts";
import { vehiculosService } from "./vehiculos.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const vehiculosController = {
  listar: async () => vehiculosService.listar(),

  obtener: async (req: FastifyRequest<{ Params: { id: string } }>) =>
    vehiculosService.obtener(Number(req.params.id)),

  crear: async (req: FastifyRequest<{ Body: NuevoVehiculo }>, reply: FastifyReply) => {
    const vehiculo = await vehiculosService.crear(req.body);
    return reply.code(201).send(vehiculo);
  },

  actualizar: async (
    req: FastifyRequest<{ Params: { id: string }; Body: ActualizarVehiculo }>,
  ) => vehiculosService.actualizar(Number(req.params.id), req.body),

  eliminar: async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await vehiculosService.eliminar(Number(req.params.id));
    return reply.code(204).send();
  },
};
