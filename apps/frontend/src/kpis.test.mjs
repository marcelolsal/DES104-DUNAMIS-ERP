// Test de la lógica pura del panel de KPIs. Sin BD ni red.
// Correr: pnpm --filter @dunamis/frontend test
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatoDinero, formatoFecha, rangoDelMes, validarRango } from "./kpis.ts";

test("rangoDelMes: usa el día de El Salvador (UTC-6), no el del navegador ni UTC", () => {
  // 1 de noviembre 03:00 UTC = 31 de octubre 21:00 en El Salvador.
  assert.deepEqual(rangoDelMes(new Date("2026-11-01T03:00:00Z")), {
    desde: "2026-10-01",
    hasta: "2026-10-31",
  });
  assert.deepEqual(rangoDelMes(new Date("2026-11-01T06:00:00Z")), {
    desde: "2026-11-01",
    hasta: "2026-11-30",
  });
});

test("rangoDelMes: febrero bisiesto y cambio de año", () => {
  assert.deepEqual(rangoDelMes(new Date("2028-02-10T12:00:00Z")), {
    desde: "2028-02-01",
    hasta: "2028-02-29",
  });
  assert.deepEqual(rangoDelMes(new Date("2027-01-01T05:00:00Z")).hasta, "2026-12-31");
});

test("validarRango: acepta un día y 366 días; rechaza vacío, invertido y más de 366", () => {
  assert.equal(validarRango({ desde: "2026-10-04", hasta: "2026-10-04" }), null);
  assert.equal(validarRango({ desde: "2028-01-01", hasta: "2028-12-31" }), null); // 366
  assert.match(validarRango({ desde: "", hasta: "2026-10-04" }), /Selecciona/u);
  assert.match(validarRango({ desde: "2026-02-31", hasta: "2026-03-05" }), /Selecciona/u);
  assert.match(validarRango({ desde: "2026-01-01", hasta: "2026-13-01" }), /Selecciona/u);
  assert.match(validarRango({ desde: "0000-01-01", hasta: "0000-01-31" }), /Selecciona/u);
  assert.match(validarRango({ desde: "2026-10-05", hasta: "2026-10-04" }), /posterior/u);
  assert.match(validarRango({ desde: "2026-01-01", hasta: "2027-01-02" }), /366/u);
});

test("formatos: dinero en USD es-SV y fecha sin corrimiento de zona", () => {
  assert.equal(
    formatoDinero(2396.5),
    new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(2396.5),
  );
  assert.match(formatoDinero(0), /0[.,]00/u);
  assert.equal(formatoFecha("2026-10-01"), "01/10/2026");
});
