// Test de la lógica pura de saldos. Sin BD ni env.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { aCentavos, calcularSaldo, estadoEfectivo } from "./saldo.ts";

const hoy = new Date("2026-10-04T15:00:00Z");
const abono = (monto, estado = "pagado", fecha = "2026-09-01") => ({
  monto,
  estado,
  fecha: new Date(fecha),
});

test("sin abonos → debe el precio completo, cuenta pendiente", () => {
  assert.deepEqual(calcularSaldo(450, [], hoy), {
    total_pagado: 0,
    saldo_pendiente: 450,
    estado: "pendiente",
  });
});

test("solo los abonos pagados reducen el saldo", () => {
  const saldo = calcularSaldo(450, [abono(300), abono(100, "pendiente", "2026-12-01")], hoy);
  assert.deepEqual(saldo, { total_pagado: 300, saldo_pendiente: 150, estado: "pendiente" });
});

test("suma en centavos: 0.10 + 0.20 es 0.30, no 0.30000000000000004", () => {
  const saldo = calcularSaldo(0.3, [abono(0.1), abono(0.2)], hoy);
  assert.deepEqual(saldo, { total_pagado: 0.3, saldo_pendiente: 0, estado: "pagado" });
  assert.equal(calcularSaldo(100, [abono(33.33), abono(33.33)], hoy).saldo_pendiente, 33.34);
  assert.equal(aCentavos(1.15), 115);
});

test("precio cubierto → saldo 0 y cuenta pagada, aunque queden abonos vencidos", () => {
  const saldo = calcularSaldo(450, [abono(450), abono(50, "vencido")], hoy);
  assert.deepEqual(saldo, { total_pagado: 450, saldo_pendiente: 0, estado: "pagado" });
});

test("sobrepago → el saldo no baja de 0 y total_pagado lo refleja", () => {
  const saldo = calcularSaldo(450, [abono(300), abono(225)], hoy);
  assert.deepEqual(saldo, { total_pagado: 525, saldo_pendiente: 0, estado: "pagado" });
});

test("debe y tiene un abono vencido → cuenta vencida", () => {
  assert.equal(calcularSaldo(450, [abono(100), abono(100, "vencido")], hoy).estado, "vencido");
  // pendiente con fecha pasada cuenta como vencido
  assert.equal(calcularSaldo(450, [abono(100, "pendiente", "2026-10-03")], hoy).estado, "vencido");
});

test("estadoEfectivo: pendiente vence al día siguiente de su fecha, no el mismo día", () => {
  assert.equal(estadoEfectivo(abono(1, "pendiente", "2026-10-03"), hoy), "vencido");
  assert.equal(estadoEfectivo(abono(1, "pendiente", "2026-10-04"), hoy), "pendiente");
  assert.equal(estadoEfectivo(abono(1, "pendiente", "2026-10-05"), hoy), "pendiente");
  assert.equal(estadoEfectivo(abono(1, "pagado", "2020-01-01"), hoy), "pagado");
  assert.equal(estadoEfectivo(abono(1, "vencido", "2030-01-01"), hoy), "vencido");
});

test("estadoEfectivo: 'hoy' es el día en El Salvador (UTC−6), no en UTC", () => {
  const pendienteHoy = abono(1, "pendiente", "2026-10-04");
  // 20:00 del 4 en El Salvador = 02:00 del 5 en UTC → aún es el día del abono.
  assert.equal(estadoEfectivo(pendienteHoy, new Date("2026-10-05T02:00:00Z")), "pendiente");
  // 20:00 del 5 en El Salvador → ya pasó su fecha.
  assert.equal(estadoEfectivo(pendienteHoy, new Date("2026-10-06T02:00:00Z")), "vencido");
});
