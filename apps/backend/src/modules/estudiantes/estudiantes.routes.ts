import type { FastifyInstance } from "fastify";
import { nuevoAlumnoSchema, actualizarAlumnoSchema } from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { estudiantesController } from "./estudiantes.controller.js";

export const estudiantesRoutes = async (app: FastifyInstance) => {
  app.get("/", estudiantesController.listar);
  app.get("/:id", estudiantesController.obtener);
  app.post("/", { preHandler: validateBody(nuevoAlumnoSchema) }, estudiantesController.inscribir);
  app.put("/:id", { preHandler: validateBody(actualizarAlumnoSchema) }, estudiantesController.actualizar);
  app.delete("/:id", estudiantesController.eliminar);
};