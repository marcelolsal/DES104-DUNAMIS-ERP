// Test de la lógica pura de la agenda contra el seed real. Sin BD ni red.
// Correr: pnpm --filter @dunamis/frontend test
process.env.TZ = "America/El_Salvador"; // antes de crear cualquier Date

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addDays,
  enSemana,
  horasDeGrilla,
  mondayOf,
  siguienteFranja,
  transiciones,
} from "./agenda.ts";

const seed = new URL("../../backend/src/shared/db/seed-data/clase.jsonl", import.meta.url);
const fechas = readFileSync(seed, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((linea) => new Date(JSON.parse(linea).fecha_hora));

const diaKey = (fecha) => `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;

test("seed: el 100% de las clases de cada semana cae en una celda de la grilla", () => {
  const semanas = new Set(fechas.map((fecha) => mondayOf(fecha).getTime()));
  let dibujadas = 0;
  for (const inicio of semanas) {
    const weekStart = new Date(inicio);
    const deLaSemana = fechas.filter((fecha) => enSemana(fecha, weekStart));
    const horas = horasDeGrilla(deLaSemana);
    const dias = Array.from({ length: 7 }, (_, index) => diaKey(addDays(weekStart, index)));
    // Misma condición con la que ClasesPage ubica cada clase en su celda.
    const enCelda = deLaSemana.filter(
      (fecha) => dias.includes(diaKey(fecha)) && horas.includes(fecha.getHours()),
    );
    assert.equal(enCelda.length, deLaSemana.length, `semana ${weekStart.toISOString()}`);
    dibujadas += enCelda.length;
  }
  assert.equal(dibujadas, fechas.length);
  // El seed tiene clases a las 07:xx: con la grilla 08–18 quedaban fuera.
  assert.ok(fechas.some((fecha) => fecha.getHours() === 7));
});

test("horasDeGrilla: base 07–18, se amplía a clases fuera de rango", () => {
  assert.deepEqual(horasDeGrilla([]), [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  const horas = horasDeGrilla([new Date(2026, 0, 5, 5, 30), new Date(2026, 0, 5, 22, 0)]);
  assert.equal(horas[0], 5);
  assert.equal(horas.at(-1), 22);
});

test("enSemana: excluye el margen previo al lunes y el lunes siguiente", () => {
  const lunes = new Date(2026, 0, 5);
  assert.equal(enSemana(new Date(2026, 0, 4, 23, 30), lunes), false);
  assert.equal(enSemana(lunes, lunes), true);
  assert.equal(enSemana(new Date(2026, 0, 11, 23, 59), lunes), true);
  assert.equal(enSemana(new Date(2026, 0, 12), lunes), false);
});

test("siguienteFranja: siempre futura y dentro de 07–18", () => {
  const casos = [
    [new Date(2026, 0, 5, 10, 20), new Date(2026, 0, 5, 11, 0)],
    [new Date(2026, 0, 5, 10, 0), new Date(2026, 0, 5, 11, 0)],
    [new Date(2026, 0, 5, 3, 10), new Date(2026, 0, 5, 7, 0)],
    [new Date(2026, 0, 5, 17, 59), new Date(2026, 0, 5, 18, 0)],
    [new Date(2026, 0, 5, 18, 0), new Date(2026, 0, 6, 7, 0)],
    [new Date(2026, 0, 31, 23, 30), new Date(2026, 1, 1, 7, 0)],
  ];
  for (const [ahora, esperada] of casos) {
    assert.deepEqual(siguienteFranja(ahora), esperada);
    assert.ok(siguienteFranja(ahora) > ahora);
  }
});

test("transiciones: impartir solo si ya empezó; impartida/cancelada vuelven a programada", () => {
  const ahora = new Date(2026, 0, 5, 10, 0);
  const antes = new Date(2026, 0, 5, 9, 0);
  const despues = new Date(2026, 0, 5, 11, 0);
  assert.deepEqual(transiciones("programada", antes, ahora), ["impartida", "cancelada"]);
  assert.deepEqual(transiciones("programada", ahora, ahora), ["impartida", "cancelada"]);
  assert.deepEqual(transiciones("programada", despues, ahora), ["cancelada"]);
  assert.deepEqual(transiciones("impartida", antes, ahora), ["programada"]);
  assert.deepEqual(transiciones("cancelada", despues, ahora), ["programada"]);
});
