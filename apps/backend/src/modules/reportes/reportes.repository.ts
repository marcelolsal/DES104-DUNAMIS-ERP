import { eq, sql, type SQL } from "drizzle-orm";
import { reporteFinancieroSchema, type ReporteFinanciero } from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { alumno, pago, paquete } from "../../shared/db/schema.js";

export interface FiltroReporteFinanciero {
  desde?: string | undefined;
  hasta?: string | undefined;
  // Fecha de El Salvador: día del ingreso y corte de vencidos.
  hoy: string;
}

// Suma en PostgreSQL (numeric, exacto) redondeada a centavos; sin filas da 0, no NULL.
const sumar = (condicion: SQL) =>
  sql<string>`round(coalesce(sum(${pago.monto}) filter (where ${condicion}), 0), 2)`;

// numeric llega como string ("1234.50"); el contrato expone number.
const aNumero = (valor: string | undefined): number => Number(valor ?? 0);

// Pagado por alumno, para el saldo = precio del paquete − abonos pagados.
const pagadoPorAlumno = db
  .select({
    id_alumno: pago.id_alumno,
    pagado: sql<string>`sum(${pago.monto})`.as("pagado"),
  })
  .from(pago)
  .where(eq(pago.estado, "pagado"))
  .groupBy(pago.id_alumno)
  .as("pagado_por_alumno");

// Única capa que toca la BD (Drizzle). ADR-0004. Solo lectura.
export const reportesRepository = {
  financiero: async ({
    desde,
    hasta,
    hoy,
  }: FiltroReporteFinanciero): Promise<ReporteFinanciero> => {
    // Rango inclusivo en ambos extremos; sin rango entra todo el historial.
    const enRango =
      desde === undefined || hasta === undefined
        ? sql`true`
        : sql`${pago.fecha} between ${desde} and ${hasta}`;

    const [[totales], [cuentas]] = await Promise.all([
      db
        .select({
          total_recaudado: sumar(sql`${enRango} and ${pago.estado} = 'pagado'`),
          pendiente_de_cobro: sumar(
            sql`${enRango} and ${pago.estado} = 'pendiente' and ${pago.fecha} >= ${hoy}`,
          ),
          cobros_vencidos: sumar(
            sql`${enRango} and (${pago.estado} = 'vencido' or (${pago.estado} = 'pendiente' and ${pago.fecha} < ${hoy}))`,
          ),
          ingreso_del_dia: sumar(sql`${pago.estado} = 'pagado' and ${pago.fecha} = ${hoy}`),
        })
        .from(pago),
      db
        .select({
          saldo_por_cobrar: sql<string>`round(coalesce(sum(greatest(${paquete.precio} - coalesce(${pagadoPorAlumno.pagado}, 0), 0)), 0), 2)`,
        })
        .from(alumno)
        .innerJoin(paquete, eq(alumno.id_paquete, paquete.id_paquete))
        .leftJoin(pagadoPorAlumno, eq(pagadoPorAlumno.id_alumno, alumno.id_alumno)),
    ]);

    return reporteFinancieroSchema.parse({
      desde: desde ?? null,
      hasta: hasta ?? null,
      hoy,
      total_recaudado: aNumero(totales?.total_recaudado),
      pendiente_de_cobro: aNumero(totales?.pendiente_de_cobro),
      cobros_vencidos: aNumero(totales?.cobros_vencidos),
      ingreso_del_dia: aNumero(totales?.ingreso_del_dia),
      saldo_por_cobrar: aNumero(cuentas?.saldo_por_cobrar),
    });
  },
};
