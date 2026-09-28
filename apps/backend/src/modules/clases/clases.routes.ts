import type { FastifyInstance } from "fastify";
import { nuevoClaseSchema, type NuevoClase } from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { clasesController } from "./clases.controller.js";

// Endpoints del módulo. Se montan bajo /api/clases (ver app.ts).
// La auth es global (registerAuth en app.ts); aquí no se repite.
export const clasesRoutes = async (app: FastifyInstance) => {
  app.get("/", clasesController.listar);
  app.get("/:id", clasesController.obtener);
  app.post("/", { preHandler: validateBody(nuevoClaseSchema) }, clasesController.crear);
  app.put<{ Params: { id: string }; Body: NuevoClase }>(
    "/:id",
    { preHandler: validateBody(nuevoClaseSchema) },
    clasesController.actualizar,
  );
  app.delete("/:id", clasesController.eliminar);
};
