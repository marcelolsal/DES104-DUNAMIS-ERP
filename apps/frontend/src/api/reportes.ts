import type { ReporteFinanciero } from "@dunamis/contracts";
import type { Rango } from "../kpis.js";
import { api } from "./client.js";

export const reportesApi = {
  financiero: ({ desde, hasta }: Rango): Promise<ReporteFinanciero> =>
    api<ReporteFinanciero>(
      `/api/reportes/financiero?${new URLSearchParams({ desde, hasta }).toString()}`,
    ),
};
