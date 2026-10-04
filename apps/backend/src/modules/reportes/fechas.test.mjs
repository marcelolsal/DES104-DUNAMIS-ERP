// Test de la lógica pura de fechas del reporte. Sin BD ni env.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { corteDeVencidos, hoyEnElSalvador } from "./fechas.ts";
import { estadoEfectivo } from "../pagos/saldo.ts";

test("hoyEnElSalvador: el día cambia a las 06:00 UTC (medianoche UTC-6)", () => {
  assert.equal(hoyEnElSalvador(new Date("2026-10-04T05:59:59Z")), "2026-10-03");
  assert.equal(hoyEnElSalvador(new Date("2026-10-04T06:00:00Z")), "2026-10-04");
  assert.equal(hoyEnElSalvador(new Date("2026-10-05T03:00:00Z")), "2026-10-04");
});

test("hoyEnElSalvador: cruza mes y año", () => {
  assert.equal(hoyEnElSalvador(new Date("2027-01-01T02:00:00Z")), "2026-12-31");
  assert.equal(hoyEnElSalvador(new Date("2028-03-01T05:00:00Z")), "2028-02-29");
});

test("corteDeVencidos coincide con estadoEfectivo del módulo de pagos", () => {
  for (const ahora of [new Date("2026-10-04T15:00:00Z"), new Date("2026-10-05T03:00:00Z")]) {
    const corte = corteDeVencidos(ahora);
    for (const fecha of ["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"]) {
      const vencido = estadoEfectivo({ estado: "pendiente", fecha: new Date(fecha) }, ahora);
      assert.equal(fecha < corte, vencido === "vencido", `${fecha} a las ${ahora.toISOString()}`);
    }
  }
});
