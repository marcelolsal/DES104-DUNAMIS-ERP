// Test de la lógica pura de métricas de instructor. Sin BD ni env.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularMetricas } from "./metricas.ts";

const clase = (id_alumno, estado) => ({ id_alumno, estado });

test("2 impartidas + 1 programada + 1 cancelada → horas de 2 clases", () => {
  const clases = [
    clase(1, "impartida"),
    clase(1, "impartida"),
    clase(2, "programada"),
    clase(3, "cancelada"),
  ];
  assert.deepEqual(calcularMetricas(clases, 60), { horas_impartidas: 2, estudiantes_asignados: 2 });
});

test("las horas usan la duración configurada (45 min → 1.5 h por 2 clases)", () => {
  const clases = [clase(1, "impartida"), clase(2, "impartida")];
  assert.equal(calcularMetricas(clases, 45).horas_impartidas, 1.5);
});

test("un alumno solo con clases canceladas no cuenta como asignado", () => {
  const clases = [clase(1, "cancelada"), clase(1, "cancelada"), clase(2, "programada")];
  assert.deepEqual(calcularMetricas(clases, 60), { horas_impartidas: 0, estudiantes_asignados: 1 });
});

test("alumno repetido cuenta una sola vez", () => {
  const clases = [clase(7, "impartida"), clase(7, "programada"), clase(7, "impartida")];
  assert.equal(calcularMetricas(clases, 60).estudiantes_asignados, 1);
});

test("sin clases → ceros", () => {
  assert.deepEqual(calcularMetricas([], 60), { horas_impartidas: 0, estudiantes_asignados: 0 });
});
