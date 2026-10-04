import type { FastifyInstance } from "fastify";
import {
  actualizarVehiculoSchema,
  nuevoVehiculoSchema,
  type ActualizarVehiculo,
} from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { vehiculosController } from "./vehiculos.controller.js";

// Endpoints del módulo. Se montan bajo /api/vehiculos (ver app.ts).
// La auth es global (registerAuth en app.ts); aquí no se repite.
export const vehiculosRoutes = (app: FastifyInstance) => {
  app.get("/", vehiculosController.listar);
  app.get("/:id", vehiculosController.obtener);
  app.post("/", { preHandler: validateBody(nuevoVehiculoSchema) }, vehiculosController.crear);
  app.put<{ Params: { id: string }; Body: ActualizarVehiculo }>(
    "/:id",
    { preHandler: validateBody(actualizarVehiculoSchema) },
    vehiculosController.actualizar,
  );
  app.delete("/:id", vehiculosController.eliminar);
};
