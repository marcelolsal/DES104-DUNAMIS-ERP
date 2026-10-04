import type { FastifyInstance } from "fastify";
import {
  nuevoInstructorSchema,
  actualizarInstructorSchema,
  type ActualizarInstructor,
} from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { instructoresController } from "./instructores.controller.js";

// Endpoints del módulo. Se montan bajo /api/instructores (ver app.ts).
// La auth es global (registerAuth en app.ts); aquí no se repite.
export const instructoresRoutes = (app: FastifyInstance) => {
  app.get("/", instructoresController.listar);
  app.get("/:id", instructoresController.obtener);
  app.get("/:id/metricas", instructoresController.obtenerMetricas);
  app.post("/", { preHandler: validateBody(nuevoInstructorSchema) }, instructoresController.crear);
  app.put<{ Params: { id: string }; Body: ActualizarInstructor }>(
    "/:id",
    { preHandler: validateBody(actualizarInstructorSchema) },
    instructoresController.actualizar,
  );
  app.delete("/:id", instructoresController.eliminar);
};
