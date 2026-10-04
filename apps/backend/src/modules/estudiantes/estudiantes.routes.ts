import type { FastifyInstance } from "fastify";
import { nuevoAlumnoSchema, type NuevoAlumno } from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { estudiantesController } from "./estudiantes.controller.js";

// Endpoints del módulo. Se montan bajo /api/estudiantes (ver app.ts).
// La auth es global (registerAuth en app.ts); aquí no se repite.
export const estudiantesRoutes = async (app: FastifyInstance) => {
  app.get("/", estudiantesController.listarConDetalle);
  app.get("/paquetes", estudiantesController.paquetes);
  app.get("/:id", estudiantesController.obtener);
  app.post("/", { preHandler: validateBody(nuevoAlumnoSchema) }, estudiantesController.inscribir);
  app.put<{ Params: { id: string }; Body: NuevoAlumno }>(
    "/:id",
    { preHandler: validateBody(nuevoAlumnoSchema) },
    estudiantesController.actualizar,
  );
  app.delete<{ Params: { id: string } }>("/:id", estudiantesController.eliminar);
};
