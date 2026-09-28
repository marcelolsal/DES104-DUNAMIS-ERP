// Test de la lógica pura de solapes. Sin BD ni env.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { seSolapan, solapesCon } from "./solape.ts";

const at = (hhmm) => new Date(`2026-01-01T${hhmm}:00Z`);

test("misma hora exacta → solapa", () => {
  assert.equal(seSolapan(at("10:00"), at("10:00"), 60), true);
});

test("dentro de la franja (10:00 vs 10:30, 60m) → solapa", () => {
  assert.equal(seSolapan(at("10:00"), at("10:30"), 60), true);
});

test("borde exacto (10:00 vs 11:00, 60m) → NO solapa (fin exclusivo)", () => {
  assert.equal(seSolapan(at("10:00"), at("11:00"), 60), false);
});

test("antes, dentro de la franja (10:00 vs 09:30) → solapa", () => {
  assert.equal(seSolapan(at("10:00"), at("09:30"), 60), true);
});

test("separadas → NO solapa", () => {
  assert.equal(seSolapan(at("10:00"), at("12:00"), 60), false);
});

test("duración configurable (45m): 10:00 vs 10:40 solapa, vs 10:45 no", () => {
  assert.equal(seSolapan(at("10:00"), at("10:40"), 45), true);
  assert.equal(seSolapan(at("10:00"), at("10:45"), 45), false);
});

test("solapesCon filtra solo las candidatas que chocan", () => {
  const candidatas = [
    { id_clase: 1, id_instructor: 7, id_vehiculo: 3, fecha_hora: at("10:30") }, // choca
    { id_clase: 2, id_instructor: 7, id_vehiculo: 3, fecha_hora: at("11:00") }, // borde, no
    { id_clase: 3, id_instructor: 7, id_vehiculo: 3, fecha_hora: at("08:00") }, // lejos, no
  ];
  const choques = solapesCon(at("10:00"), candidatas, 60);
  assert.deepEqual(
    choques.map((c) => c.id_clase),
    [1],
  );
});
