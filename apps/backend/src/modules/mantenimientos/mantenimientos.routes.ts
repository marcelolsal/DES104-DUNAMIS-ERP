import type { FastifyInstance } from "fastify";
import {
  actualizarMantenimientoSchema,
  nuevoMantenimientoSchema,
  type ActualizarMantenimiento,
} from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { mantenimientosController } from "./mantenimientos.controller.js";

// Endpoints del módulo. Se montan bajo /api/mantenimientos (ver app.ts).
// La auth es global (registerAuth en app.ts); aquí no se repite.
export const mantenimientosRoutes = (app: FastifyInstance) => {
  app.get<{ Querystring: { id_vehiculo?: string } }>("/", mantenimientosController.listar);
  app.get("/:id", mantenimientosController.obtener);
  app.post("/", { preHandler: validateBody(nuevoMantenimientoSchema) }, mantenimientosController.crear);
  app.put<{ Params: { id: string }; Body: ActualizarMantenimiento }>(
    "/:id",
    { preHandler: validateBody(actualizarMantenimientoSchema) },
    mantenimientosController.actualizar,
  );
  app.delete("/:id", mantenimientosController.eliminar);
};
