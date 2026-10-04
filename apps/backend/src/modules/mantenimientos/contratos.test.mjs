// Test de los contratos de escritura (límites de columnas y fecha). Sin BD ni env.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { nuevoMantenimientoSchema, nuevoPaqueteSchema, nuevoVehiculoSchema } from "@dunamis/contracts";

const mant = (fecha) => nuevoMantenimientoSchema.safeParse({ id_vehiculo: 1, fecha, descripcion: "x", costo: 10 }).success;

test("fecha válida YYYY-MM-DD → ok", () => assert.equal(mant("2024-02-29"), true));
test("día inexistente (30 de febrero, 29 en año no bisiesto) → rechaza", () => {
  assert.equal(mant("2026-02-30"), false);
  assert.equal(mant("2025-02-29"), false);
});
test("fecha con hora o zona → rechaza", () => assert.equal(mant("2026-10-01T00:00:00Z"), false));

test("límites de columnas → rechaza en vez de 500 en la BD", () => {
  assert.equal(nuevoPaqueteSchema.safeParse({ nombre: "a".repeat(121), total_horas: 1, precio: 1 }).success, false);
  assert.equal(nuevoPaqueteSchema.safeParse({ nombre: "a", total_horas: 2 ** 31, precio: 1 }).success, false);
  assert.equal(nuevoPaqueteSchema.safeParse({ nombre: "a", total_horas: 1, precio: 1e8 }).success, false);
  assert.equal(nuevoVehiculoSchema.safeParse({ placa: "a".repeat(21), modelo: "m", kilometraje: 1, estado: "activo" }).success, false);
});
test("estado de vehículo fuera del enum → rechaza", () => {
  assert.equal(nuevoVehiculoSchema.safeParse({ placa: "P1", modelo: "m", kilometraje: 1, estado: "en mantenimiento" }).success, false);
});
