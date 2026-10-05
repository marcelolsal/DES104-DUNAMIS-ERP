// Correr: pnpm --filter @dunamis/frontend test
import { test } from "node:test";
import assert from "node:assert/strict";
import { etiquetadorAlumnos } from "./alumnos.ts";

test("etiquetadorAlumnos: agrega el id solo a los homónimos", () => {
  const alumnos = [
    { id: 1, nombre: "Ana López" },
    { id: 2, nombre: "ana lópez " },
    { id: 3, nombre: "Luis Pérez" },
  ];
  const etiqueta = etiquetadorAlumnos(alumnos);
  assert.deepEqual(alumnos.map(etiqueta), ["Ana López — #1", "ana lópez  — #2", "Luis Pérez"]);
});
