import type { FastifyInstance } from "fastify";
import { actualizarPaqueteSchema, nuevoPaqueteSchema, type ActualizarPaquete } from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { paquetesController } from "./paquetes.controller.js";

// Endpoints del módulo. Se montan bajo /api/paquetes (ver app.ts).
// La auth es global (registerAuth en app.ts); aquí no se repite.
export const paquetesRoutes = (app: FastifyInstance) => {
  app.get("/", paquetesController.listar);
  app.get("/:id", paquetesController.obtener);
  app.post("/", { preHandler: validateBody(nuevoPaqueteSchema) }, paquetesController.crear);
  app.put<{ Params: { id: string }; Body: ActualizarPaquete }>(
    "/:id",
    { preHandler: validateBody(actualizarPaqueteSchema) },
    paquetesController.actualizar,
  );
  app.delete("/:id", paquetesController.eliminar);
};
