import type { FastifyRequest } from "fastify";
import { reporteFinancieroQuerySchema, type ReporteFinanciero } from "@dunamis/contracts";
import { reportesService } from "./reportes.service.js";

// Traduce HTTP ↔ negocio. No toca la BD.
export const reportesController = {
  financiero: async (
    req: FastifyRequest<{ Querystring: { desde?: string; hasta?: string } }>,
  ): Promise<ReporteFinanciero> =>
    reportesService.financiero(reporteFinancieroQuerySchema.parse(req.query)),
};
