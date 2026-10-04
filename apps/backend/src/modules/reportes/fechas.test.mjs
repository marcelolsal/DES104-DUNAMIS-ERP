// "Hoy" del reporte = el mismo de pagos (pagos/saldo.ts). Sin BD ni env.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
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
