// Test de la validación pura del rango de la agenda. Sin BD ni env.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { rangoAgenda } from "./rango-agenda.ts";

test("rango válido → devuelve las fechas parseadas", () => {
  const rango = rangoAgenda("2026-01-05T06:00:00.000Z", "2026-01-12T06:00:00.000Z");
  assert.deepEqual(rango, {
    desde: new Date("2026-01-05T06:00:00.000Z"),
    hasta: new Date("2026-01-12T06:00:00.000Z"),
  });
});

test("fechas no parseables o ausentes → inválido", () => {
  assert.equal(rangoAgenda("no-es-fecha", "2026-01-12T06:00:00.000Z"), null);
  assert.equal(rangoAgenda("2026-01-05T06:00:00.000Z", ""), null);
  assert.equal(rangoAgenda(undefined, undefined), null);
});

test("fin <= inicio → inválido", () => {
  assert.equal(rangoAgenda("2026-01-12T06:00:00.000Z", "2026-01-05T06:00:00.000Z"), null);
  assert.equal(rangoAgenda("2026-01-05T06:00:00.000Z", "2026-01-05T06:00:00.000Z"), null);
});

test("rango demasiado largo → inválido (62 días exactos sí vale)", () => {
  assert.notEqual(rangoAgenda("2026-01-01T00:00:00.000Z", "2026-03-04T00:00:00.000Z"), null);
  assert.equal(rangoAgenda("2026-01-01T00:00:00.000Z", "2026-03-04T00:00:00.001Z"), null);
});
