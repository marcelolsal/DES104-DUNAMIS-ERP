import { sql, type SQL } from "drizzle-orm";
import { reporteFinancieroSchema, type ReporteFinanciero } from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { pago } from "../../shared/db/schema.js";

export interface FiltroReporteFinanciero {
  desde?: string | undefined;
  hasta?: string | undefined;
  hoy: string;
  corteVencidos: string;
}

// Suma en PostgreSQL (numeric, exacto); sin filas devuelve 0 en vez de NULL.
const sumar = (condicion: SQL) =>
  sql<string>`coalesce(sum(${pago.monto}) filter (where ${condicion}), 0)`;

// Única capa que toca la BD (Drizzle). ADR-0004. Solo lectura.
export const reportesRepository = {
  financiero: async ({
    desde,
    hasta,
    hoy,
    corteVencidos,
  }: FiltroReporteFinanciero): Promise<ReporteFinanciero> => {
    // Rango inclusivo en ambos extremos; sin rango entra todo el historial.
    const enRango =
      desde === undefined || hasta === undefined
        ? sql`true`
        : sql`${pago.fecha} between ${desde} and ${hasta}`;
    const [totales] = await db
      .select({
        total_recaudado: sumar(sql`${enRango} and ${pago.estado} = 'pagado'`),
        pendiente_de_cobro: sumar(
          sql`${enRango} and ${pago.estado} = 'pendiente' and ${pago.fecha} >= ${corteVencidos}`,
        ),
        cobros_vencidos: sumar(
          sql`${enRango} and (${pago.estado} = 'vencido' or (${pago.estado} = 'pendiente' and ${pago.fecha} < ${corteVencidos}))`,
        ),
        ingreso_del_dia: sumar(sql`${pago.estado} = 'pagado' and ${pago.fecha} = ${hoy}`),
      })
      .from(pago);
    // numeric llega como string ("1234.50"); el contrato expone number con 2 decimales.
    return reporteFinancieroSchema.parse({
      desde: desde ?? null,
      hasta: hasta ?? null,
      hoy,
      total_recaudado: Number(totales?.total_recaudado),
      pendiente_de_cobro: Number(totales?.pendiente_de_cobro),
      cobros_vencidos: Number(totales?.cobros_vencidos),
      ingreso_del_dia: Number(totales?.ingreso_del_dia),
    });
  },
};
