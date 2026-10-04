// Test de integración del SQL real del reporte. Opt-in: solo corre con
// TEST_DATABASE_URL apuntando a un Postgres LOCAL desechable con las migraciones
// aplicadas; sin ella se omite. Inserta su propio fixture en 2001 y lo borra al final.
// Correr: TEST_DATABASE_URL=postgresql://...@127.0.0.1:5432/db pnpm --filter @dunamis/backend test
import { test, after } from "node:test";
import assert from "node:assert/strict";

const url = process.env.TEST_DATABASE_URL;
const local = url !== undefined && /@(127\.0\.0\.1|localhost):/u.test(url);

if (!local) {
  test("SQL del reporte financiero (requiere TEST_DATABASE_URL local)", { skip: true });
} else {
  Object.assign(process.env, {
    DATABASE_URL: url,
    SUPABASE_URL: "http://127.0.0.1:1",
    SUPABASE_SERVICE_ROLE_KEY: "test",
    SUPABASE_JWT_SECRET: "test",
  });
  const { eq, inArray } = await import("drizzle-orm");
  const { db } = await import("../../shared/db/client.ts");
  const { alumno, pago, paquete } = await import("../../shared/db/schema.ts");
  const { reportesRepository } = await import("./reportes.repository.ts");

  const reporte = (filtro = {}) => reportesRepository.financiero({ hoy: "2001-06-15", ...filtro });

  const saldoAntes = (await reporte()).saldo_por_cobrar;

  const [{ id_paquete }] = await db
    .insert(paquete)
    .values({ nombre: "test-reportes", total_horas: 1, precio: "100.00" })
    .returning();
  const alumnoBase = { dui: "0", correo: "t@t.t", telefono: "0", contacto_emergencia: "x" };
  const alumnos = await db
    .insert(alumno)
    .values([
      { ...alumnoBase, nombre: "a", fecha_inscripcion: "2001-01-01", id_paquete },
      { ...alumnoBase, nombre: "b", fecha_inscripcion: "2001-01-01", id_paquete },
    ])
    .returning();
  const [a, b] = alumnos.map((fila) => fila.id_alumno);
  await db.insert(pago).values(
    [
      [a, "0.10", "2001-06-01", "pagado"], // límite inferior del rango
      [a, "0.20", "2001-06-15", "pagado"], // hoy y límite superior
      [a, "120.00", "2001-05-31", "pagado"], // fuera del rango; sobrepago (saldo 0, no −20)
      [b, "33.33", "2001-06-14", "pendiente"], // fecha pasada → vencido
      [b, "10.01", "2001-06-15", "pendiente"], // hoy → aún pendiente
      [b, "7.07", "2001-06-20", "vencido"], // marcado vencido
    ].map(([id_alumno, monto, fecha, estado]) => ({
      id_alumno,
      monto,
      fecha,
      estado,
      metodo: "efectivo",
    })),
  );

  after(async () => {
    await db.delete(pago).where(inArray(pago.id_alumno, [a, b]));
    await db.delete(alumno).where(inArray(alumno.id_alumno, [a, b]));
    await db.delete(paquete).where(eq(paquete.id_paquete, id_paquete));
    await db.$client.end();
  });

  test("SQL: sumas por estado efectivo, rango inclusivo y centavos exactos", async () => {
    assert.deepEqual(await reporte({ desde: "2001-06-01", hasta: "2001-06-30" }), {
      desde: "2001-06-01",
      hasta: "2001-06-30",
      hoy: "2001-06-15",
      total_recaudado: 0.3,
      pendiente_de_cobro: 10.01,
      cobros_vencidos: 40.4,
      ingreso_del_dia: 0.2,
      // a debe 0 (pagó 120.30 de 100); b debe 100: solo cuentan los abonos pagados.
      saldo_por_cobrar: Math.round((saldoAntes + 100) * 100) / 100,
    });
  });

  test("SQL: ingreso del día y saldo no dependen del rango", async () => {
    const vacio = await reporte({ desde: "2001-07-01", hasta: "2001-07-01" });
    assert.equal(vacio.total_recaudado, 0);
    assert.equal(vacio.pendiente_de_cobro, 0);
    assert.equal(vacio.cobros_vencidos, 0);
    assert.equal(vacio.ingreso_del_dia, 0.2);
    assert.equal(vacio.saldo_por_cobrar, Math.round((saldoAntes + 100) * 100) / 100);
  });
}
