// "Hoy" del reporte = el mismo de pagos (pagos/saldo.ts). Sin BD ni env.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { reporteFinancieroQuerySchema } from "@dunamis/contracts";
import { hoyEnElSalvador } from "../pagos/saldo.ts";

test("hoyEnElSalvador: el día cambia a las 06:00 UTC (medianoche UTC-6)", () => {
  assert.equal(hoyEnElSalvador(new Date("2026-10-04T05:59:59Z")), "2026-10-03");
  assert.equal(hoyEnElSalvador(new Date("2026-10-04T06:00:00Z")), "2026-10-04");
  assert.equal(hoyEnElSalvador(new Date("2026-10-05T03:00:00Z")), "2026-10-04"); // 21:00 del 4: un pendiente del 4 aún no vence
});

test("hoyEnElSalvador: cruza mes y año", () => {
  assert.equal(hoyEnElSalvador(new Date("2027-01-01T02:00:00Z")), "2026-12-31");
  assert.equal(hoyEnElSalvador(new Date("2028-03-01T05:00:00Z")), "2028-02-29");
});

test("fechas del filtro: años 0001–0099 válidos; día inexistente inválido", () => {
  const valida = (fecha) =>
    reporteFinancieroQuerySchema.safeParse({ desde: fecha, hasta: fecha }).success;
  assert.equal(valida("0001-01-01"), true);
  assert.equal(valida("0099-12-31"), true);
  assert.equal(valida("0004-02-29"), true); // bisiesto
  assert.equal(valida("2026-02-30"), false);
  assert.equal(valida("0001-02-29"), false);
  assert.equal(valida("0000-01-01"), false);
});
