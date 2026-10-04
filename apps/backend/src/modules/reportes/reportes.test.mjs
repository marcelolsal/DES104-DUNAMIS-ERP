// Test HTTP del módulo (rutas → controller → service reales) con el repositorio
// simulado. Sin BD: el env es de mentira y nunca se abre una conexión.
// Correr: pnpm --filter @dunamis/backend test  (usa node --import tsx --test)
import { test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { SignJWT } from "jose";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
  SUPABASE_URL: "http://127.0.0.1:1",
  SUPABASE_SERVICE_ROLE_KEY: "test",
  SUPABASE_JWT_SECRET: "secreto-de-prueba",
});

const { reportesRepository } = await import("./reportes.repository.ts");
const { reportesRoutes } = await import("./reportes.routes.ts");
const { registerAuth } = await import("../../shared/middleware/auth.ts");
const { registerErrorHandler } = await import("../../shared/middleware/errors.ts");

const app = Fastify();
registerErrorHandler(app);
registerAuth(app);
app.register(reportesRoutes, { prefix: "/api/reportes" });

const token = await new SignJWT({ sub: "usuario" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuer("http://127.0.0.1:1/auth/v1")
  .setAudience("authenticated")
  .setExpirationTime("5m")
  .sign(new TextEncoder().encode("secreto-de-prueba"));

const pedir = (url) =>
  app.inject({ method: "GET", url, headers: { authorization: `Bearer ${token}` } });

const reporte = {
  desde: null,
  hasta: null,
  total_recaudado: 2396,
  pendiente_de_cobro: 199,
  cobros_vencidos: 699.5,
  hoy: "2026-10-04",
  ingreso_del_dia: 0,
};

beforeEach(() => {
  mock.restoreAll();
  mock.method(reportesRepository, "financiero", async () => reporte);
});

const filtro = () => reportesRepository.financiero.mock.calls.at(-1).arguments[0];

test("sin token → 401 y no consulta", async () => {
  const res = await app.inject({ method: "GET", url: "/api/reportes/financiero" });
  assert.equal(res.statusCode, 401);
  assert.equal(reportesRepository.financiero.mock.callCount(), 0);
});

test("sin rango → 200 con todo el historial", async () => {
  const res = await pedir("/api/reportes/financiero");
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), reporte);
  assert.equal(filtro().desde, undefined);
  assert.equal(filtro().hasta, undefined);
  assert.match(filtro().hoy, /^\d{4}-\d{2}-\d{2}$/u);
  assert.match(filtro().corteVencidos, /^\d{4}-\d{2}-\d{2}$/u);
});

test("con rango → el filtro llega al repositorio; un solo día y 366 días son válidos", async () => {
  const res = await pedir("/api/reportes/financiero?desde=2026-01-01&hasta=2026-01-31");
  assert.equal(res.statusCode, 200);
  assert.equal(filtro().desde, "2026-01-01");
  assert.equal(filtro().hasta, "2026-01-31");
  for (const rango of ["desde=2026-05-05&hasta=2026-05-05", "desde=2024-01-01&hasta=2024-12-31"]) {
    assert.equal((await pedir(`/api/reportes/financiero?${rango}`)).statusCode, 200, rango);
  }
});

test("rango inválido → 400 y no consulta", async () => {
  for (const rango of [
    "desde=2026-02-01&hasta=2026-01-31", // invertido
    "desde=2026-01-01", // falta hasta
    "hasta=2026-01-31", // falta desde
    "desde=2026-02-30&hasta=2026-03-01", // fecha inexistente
    "desde=01/01/2026&hasta=2026-01-31", // formato
    "desde=2026-01-01T00:00:00Z&hasta=2026-01-31",
    "desde=&hasta=",
    "desde=2025-01-01&hasta=2026-01-02", // 367 días
    "desde=2026-01-01&desde=2026-01-02&hasta=2026-01-31", // repetido
  ]) {
    const res = await pedir(`/api/reportes/financiero?${rango}`);
    assert.equal(res.statusCode, 400, rango);
    assert.equal(res.json().error, "Datos inválidos");
  }
  assert.equal(reportesRepository.financiero.mock.callCount(), 0);
});
