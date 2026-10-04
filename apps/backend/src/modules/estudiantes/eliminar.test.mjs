// Test del borrado de estudiantes (204 / 400 / 404 / 409) con el repositorio simulado. Sin BD.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Entorno ficticio: config.ts valida el env al importar; el cliente no conecta si no se consulta.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  SUPABASE_URL: "http://localhost",
  SUPABASE_SERVICE_ROLE_KEY: "test",
  SUPABASE_JWT_SECRET: "test",
});

const { estudiantesRepository } = await import("./estudiantes.repository.ts");
const { estudiantesController } = await import("./estudiantes.controller.ts");

const simular = ({ existe = true, dependencias = false, eliminar = async () => {} } = {}) => {
  mock.restoreAll();
  mock.method(estudiantesRepository, "obtener", async () => (existe ? { id_alumno: 1 } : null));
  mock.method(estudiantesRepository, "tieneDependencias", async () => dependencias);
  return mock.method(estudiantesRepository, "eliminar", eliminar);
};

const borrar = async (id) => {
  const res = { status: 200, body: undefined };
  const reply = {
    code: (status) => ((res.status = status), reply),
    send: (body) => ((res.body = body), reply),
  };
  await estudiantesController.eliminar({ params: { id } }, reply);
  return res;
};

const rechazaCon = (statusCode) => (error) => error.statusCode === statusCode;

test("alumno sin dependencias → 204 sin body", async () => {
  const eliminar = simular();
  assert.deepEqual(await borrar("1"), { status: 204, body: undefined });
  assert.deepEqual(eliminar.mock.calls[0].arguments, [1]);
});

test("alumno inexistente → 404 y no borra", async () => {
  const eliminar = simular({ existe: false });
  await assert.rejects(borrar("99"), rechazaCon(404));
  assert.equal(eliminar.mock.callCount(), 0);
});

test("alumno con clases o pagos → 409 y no borra", async () => {
  const eliminar = simular({ dependencias: true });
  await assert.rejects(borrar("1"), rechazaCon(409));
  assert.equal(eliminar.mock.callCount(), 0);
});

test("violación de FK al borrar (23503) → 409; otros errores se propagan", async () => {
  simular({
    eliminar: async () => Promise.reject(Object.assign(new Error("fk"), { code: "23503" })),
  });
  await assert.rejects(borrar("1"), rechazaCon(409));
  simular({ eliminar: async () => Promise.reject(new Error("boom")) });
  await assert.rejects(borrar("1"), (error) => error.message === "boom" && !error.statusCode);
});

test("id no numérico o no positivo → 400 sin tocar el repositorio", async () => {
  const eliminar = simular();
  const invalidos = ["abc", "1.5", "0", "-3", "99999999999", "2147483648", "1e3", "0x10", " 1"];
  for (const id of invalidos) assert.equal((await borrar(id)).status, 400, id);
  assert.equal(estudiantesRepository.obtener.mock.callCount(), 0);
  assert.equal(eliminar.mock.callCount(), 0);
});
