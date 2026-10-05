// Test de la lógica pura de Pagos. Sin BD ni red.
// Correr: pnpm --filter @dunamis/frontend test
process.env.TZ = "America/El_Salvador"; // antes de crear cualquier Date

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  armarPago,
  dinero,
  fechaCorta,
  fechaUTC,
  formDesdePago,
  formNuevo,
  hoyLocal,
} from "./pagos.ts";

const pago = {
  id_pago: 7,
  id_alumno: 3,
  monto: 150.5,
  fecha: "2026-07-12T00:00:00.000Z",
  metodo: "tarjeta",
  estado: "pagado",
  alumno: "Ana García",
  curso: "Estándar",
};

test("fecha: medianoche UTC se muestra como su día de calendario, no el anterior", () => {
  // En UTC-6 esa fecha es el 11 a las 18:00 en hora local.
  assert.equal(new Date(pago.fecha).getDate(), 11);
  assert.equal(fechaUTC(pago.fecha), "2026-07-12");
  assert.equal(fechaUTC(new Date(pago.fecha)), "2026-07-12");
  assert.equal(fechaCorta(pago.fecha), "12/07/2026");
});

test("hoyLocal: usa el día local aunque en UTC ya sea mañana", () => {
  // 20:00 en El Salvador = 02:00 UTC del día siguiente.
  assert.equal(hoyLocal(new Date("2026-07-13T02:00:00.000Z")), "2026-07-12");
  assert.equal(formNuevo(4, new Date("2026-07-13T02:00:00.000Z")).fecha, "2026-07-12");
});

test("formDesdePago + armarPago: ida y vuelta conserva fecha y monto numérico", () => {
  const form = formDesdePago(pago);
  assert.deepEqual(form, {
    id_alumno: 3,
    monto: "150.5",
    fecha: "2026-07-12",
    metodo: "tarjeta",
    estado: "pagado",
  });
  assert.deepEqual(armarPago({ ...form, monto: "99.99" }), {
    id_alumno: 3,
    monto: 99.99,
    fecha: "2026-07-12",
    metodo: "tarjeta",
    estado: "pagado",
  });
});

test("formDesdePago: un pago vencido se edita como pendiente", () => {
  assert.equal(formDesdePago({ ...pago, estado: "vencido" }).estado, "pendiente");
});

test("dinero: USD con dos decimales", () => {
  assert.match(dinero(1234.5), /1,234\.50/u);
  assert.match(dinero(1234.5), /\$/u);
});
