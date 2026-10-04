import type { ReporteFinanciero, ReporteFinancieroQuery } from "@dunamis/contracts";
import { reportesRepository } from "./reportes.repository.js";
import { corteDeVencidos, hoyEnElSalvador } from "./fechas.js";

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const reportesService = {
  financiero: ({ desde, hasta }: ReporteFinancieroQuery): Promise<ReporteFinanciero> => {
    const ahora = new Date();
    return reportesRepository.financiero({
      desde,
      hasta,
      hoy: hoyEnElSalvador(ahora),
      corteVencidos: corteDeVencidos(ahora),
    });
  },
};
