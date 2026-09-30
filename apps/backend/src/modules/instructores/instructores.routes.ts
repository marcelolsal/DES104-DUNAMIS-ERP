import type { FastifyInstance } from "fastify";
import { nuevoInstructorSchema, actualizarInstructorSchema } from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { instructoresController } from "./instructores.controller.js";

export const instructoresRoutes = async (app: FastifyInstance) => {
  app.get("/", instructoresController.listar);
  app.get("/:id", instructoresController.obtener);
  app.get("/:id/metricas", instructoresController.obtenerMetricas);
  app.post("/", { preHandler: validateBody(nuevoInstructorSchema) }, instructoresController.crear);
  app.put("/:id", { preHandler: validateBody(actualizarInstructorSchema) }, instructoresController.actualizar);
  app.delete("/:id", instructoresController.eliminar);
};