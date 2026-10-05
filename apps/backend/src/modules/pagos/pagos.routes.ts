import type { FastifyInstance } from "fastify";
import { actualizarPagoSchema, nuevoPagoSchema, type ActualizarPago } from "@dunamis/contracts";
import { validateBody } from "../../shared/middleware/validation.js";
import { pagosController } from "./pagos.controller.js";

// Endpoints del módulo. Se montan bajo /api/pagos (ver app.ts).
// La auth es global (registerAuth en app.ts); aquí no se repite.
export const pagosRoutes = (app: FastifyInstance) => {
  app.get<{ Querystring: { id_alumno?: string; estado?: string } }>("/", pagosController.listar);
  app.get("/cuentas-por-cobrar", pagosController.cuentasPorCobrar);
  app.get("/saldo/:id", pagosController.saldoDeAlumno);
  app.get("/:id", pagosController.obtener);
  app.post("/", { preHandler: validateBody(nuevoPagoSchema) }, pagosController.crear);
  app.put<{ Params: { id: string }; Body: ActualizarPago }>(
    "/:id",
    { preHandler: validateBody(actualizarPagoSchema) },
    pagosController.actualizar,
  );
  app.delete("/:id", pagosController.eliminar);
};
