import type { FastifyInstance } from "fastify";
import { reportesController } from "./reportes.controller.js";

// Endpoints del módulo. Se montan bajo /api/reportes (ver app.ts).
// La auth es global (registerAuth en app.ts); aquí no se repite.
export const reportesRoutes = (app: FastifyInstance): void => {
  app.get<{ Querystring: { desde?: string; hasta?: string } }>(
    "/financiero",
    reportesController.financiero,
  );
};
