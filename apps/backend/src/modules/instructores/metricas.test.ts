import { test } from "node:test";
import assert from "node:assert/strict";

type ClaseConAlumno = {
  id_clase: number;
  id_alumno: number;
};

function calcularMetricasInstructor(clases: ClaseConAlumno[]) {
  const totalClases = clases.length;
  const estudiantesUnicos = new Set(clases.map((c: ClaseConAlumno) => c.id_alumno)).size;

  return {
    horas_impartidas: totalClases,
    estudiantes_asignados: estudiantesUnicos,
  };
}

test("calcula correctamente las horas impartidas y estudiantes unicos", () => {
  const clasesFicticias: ClaseConAlumno[] = [
    { id_clase: 1, id_alumno: 101 },
    { id_clase: 2, id_alumno: 102 },
    { id_clase: 3, id_alumno: 101 },
  ];

  const resultado = calcularMetricasInstructor(clasesFicticias);

  assert.equal(resultado.horas_impartidas, 3);
  assert.equal(resultado.estudiantes_asignados, 2);
});

test("retorna ceros si el instructor no tiene clases asignadas", () => {
  const resultado = calcularMetricasInstructor([]);

  assert.equal(resultado.horas_impartidas, 0);
  assert.equal(resultado.estudiantes_asignados, 0);
});