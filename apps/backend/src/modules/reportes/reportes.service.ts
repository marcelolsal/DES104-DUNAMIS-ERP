import type { ReporteFinanciero, ReporteFinancieroQuery } from "@dunamis/contracts";
import { reportesRepository } from "./reportes.repository.js";
import { hoyEnElSalvador } from "../pagos/saldo.js";

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const reportesService = {
  financiero: ({ desde, hasta }: ReporteFinancieroQuery): Promise<ReporteFinanciero> =>
    reportesRepository.financiero({ desde, hasta, hoy: hoyEnElSalvador(new Date()) }),
};
