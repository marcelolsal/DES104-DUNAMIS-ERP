// Test HTTP del módulo (rutas → controller → service reales) con el repositorio
// simulado. Sin BD: el env es de mentira y nunca se abre una conexión.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { SignJWT } from "jose";
import { instructorSchema } from "@dunamis/contracts";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
  SUPABASE_URL: "http://127.0.0.1:1",
  SUPABASE_SERVICE_ROLE_KEY: "test",
  SUPABASE_JWT_SECRET: "secreto-de-prueba",
});

const { instructoresRepository } = await import("./instructores.repository.ts");
const { instructoresRoutes } = await import("./instructores.routes.ts");
const { registerAuth } = await import("../../shared/middleware/auth.ts");
const { registerErrorHandler } = await import("../../shared/middleware/errors.ts");

const app = Fastify();
registerErrorHandler(app);
registerAuth(app);
app.register(instructoresRoutes, { prefix: "/api/instructores" });

const token = await new SignJWT({ sub: "usuario" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuer("http://127.0.0.1:1/auth/v1")
  .setAudience("authenticated")
  .setExpirationTime("5m")
  .sign(new TextEncoder().encode("secreto-de-prueba"));

const pedir = (method, url, payload) =>
  app.inject({ method, url, payload, headers: { authorization: `Bearer ${token}` } });

const datos = { nombre: "Ana", especialidad: "Manual", telefono: "7000-0000" };

// Como el repo real: la fila de Drizzle trae la fecha como "YYYY-MM-DD" (o null)
// y se pasa por el contrato.
const fila = (id_instructor, valores) =>
  instructorSchema.parse({ fecha_ingreso: null, ...valores, id_instructor });

beforeEach(() => {
  mock.restoreAll();
  mock.method(instructoresRepository, "crear", async (valores) => fila(9, valores));
  mock.method(instructoresRepository, "actualizar", async (id, valores) => fila(id, valores));
});

test("POST sin fecha de ingreso → 201 con fecha_ingreso null", async () => {
  const res = await pedir("POST", "/api/instructores", datos);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.json(), { ...datos, id_instructor: 9, fecha_ingreso: null });
  assert.equal(instructoresRepository.crear.mock.calls[0].arguments[0].fecha_ingreso, undefined);
});

test("POST con fecha de ingreso → se guarda YYYY-MM-DD y sale a medianoche UTC", async () => {
  const res = await pedir("POST", "/api/instructores", { ...datos, fecha_ingreso: "2014-03-01" });
  assert.equal(res.statusCode, 201);
  assert.equal(res.json().fecha_ingreso, "2014-03-01T00:00:00.000Z");
  assert.equal(instructoresRepository.crear.mock.calls[0].arguments[0].fecha_ingreso, "2014-03-01");
});

test("PUT con fecha_ingreso null la borra", async () => {
  const res = await pedir("PUT", "/api/instructores/3", { ...datos, fecha_ingreso: null });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().fecha_ingreso, null);
  assert.equal(instructoresRepository.actualizar.mock.calls[0].arguments[1].fecha_ingreso, null);
});

test("fecha de ingreso inválida o futura → 400 y no se guarda", async () => {
  const manana = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  for (const fecha_ingreso of ["2014-02-30", "01/03/2014", "", 2014, manana]) {
    const res = await pedir("POST", "/api/instructores", { ...datos, fecha_ingreso });
    assert.equal(res.statusCode, 400, JSON.stringify(fecha_ingreso));
    assert.ok(res.json().detalles.fieldErrors.fecha_ingreso, JSON.stringify(fecha_ingreso));
  }
  const put = await pedir("PUT", "/api/instructores/3", { ...datos, fecha_ingreso: "2014-13-01" });
  assert.equal(put.statusCode, 400);
  assert.equal(instructoresRepository.crear.mock.callCount(), 0);
  assert.equal(instructoresRepository.actualizar.mock.callCount(), 0);
});

test("fila de la BD fuera de contrato → 500 sin filtrar detalles; id inválido → 400", async () => {
  const { parseSalida } = await import("../../shared/db/salida.ts");
  mock.method(instructoresRepository, "obtener", async () =>
    parseSalida(instructorSchema, { ...datos, id_instructor: 1, nombre: null }),
  );
  const res = await pedir("GET", "/api/instructores/1");
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.json(), { error: "Error interno" });
  assert.equal((await pedir("GET", "/api/instructores/abc")).statusCode, 400);
});
