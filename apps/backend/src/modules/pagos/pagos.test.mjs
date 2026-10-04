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

const { pagosRepository } = await import("./pagos.repository.ts");
const { pagosRoutes } = await import("./pagos.routes.ts");
const { registerAuth } = await import("../../shared/middleware/auth.ts");
const { registerErrorHandler } = await import("../../shared/middleware/errors.ts");

const app = Fastify();
registerErrorHandler(app);
registerAuth(app);
app.register(pagosRoutes, { prefix: "/api/pagos" });

const token = await new SignJWT({ sub: "usuario" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuer("http://127.0.0.1:1/auth/v1")
  .setAudience("authenticated")
  .setExpirationTime("5m")
  .sign(new TextEncoder().encode("secreto-de-prueba"));

const pedir = (method, url, payload) =>
  app.inject({ method, url, payload, headers: { authorization: `Bearer ${token}` } });

const fila = (id_pago, monto, estado = "pagado", fecha = "2026-01-10") => ({
  id_pago,
  id_alumno: 1,
  monto,
  fecha: new Date(fecha),
  metodo: "efectivo",
  estado,
  alumno: "Ana",
  curso: "Estándar",
});
const abono = { id_alumno: 1, monto: 150, fecha: "2026-10-04", metodo: "efectivo" };

// Alumno 1: paquete de 450 con 300 pagados → debe 150. Alumno 2: al día.
let pagos;
beforeEach(() => {
  mock.restoreAll();
  pagos = [fila(1, 300), fila(2, 100, "pendiente", "2020-01-01")];
  const cuentas = [
    { id_alumno: 1, alumno: "Ana", curso: "Estándar", precio: 450 },
    { id_alumno: 2, alumno: "Luis", curso: "Estándar", precio: 0 },
  ];
  mock.method(pagosRepository, "transaccion", (operacion) => operacion("tx"));
  mock.method(pagosRepository, "cuentas", async (id) =>
    cuentas.filter((cuenta) => id === undefined || cuenta.id_alumno === id),
  );
  mock.method(pagosRepository, "listar", async (id) =>
    pagos.filter((pago) => id === undefined || pago.id_alumno === id),
  );
  mock.method(
    pagosRepository,
    "obtener",
    async (id) => pagos.find((p) => p.id_pago === id) ?? null,
  );
  mock.method(pagosRepository, "crear", async (datos) => ({ ...datos, id_pago: 99 }));
  mock.method(pagosRepository, "actualizar", async (id, datos) => ({ ...datos, id_pago: id }));
  mock.method(pagosRepository, "eliminar", async () => undefined);
});

test("sin token → 401", async () => {
  const res = await app.inject({ method: "GET", url: "/api/pagos" });
  assert.equal(res.statusCode, 401);
  assert.equal(pagosRepository.listar.mock.callCount(), 0);
});

test("POST abono dentro del saldo → 201, estado por defecto pagado", async () => {
  const res = await pedir("POST", "/api/pagos", abono);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.json(), { ...abono, estado: "pagado", id_pago: 99 });
});

test("POST abono que excede el saldo → 409 y no se guarda", async () => {
  const res = await pedir("POST", "/api/pagos", { ...abono, monto: 150.01 });
  assert.equal(res.statusCode, 409);
  assert.match(res.json().error, /excede el saldo pendiente del alumno \(150\.00\)/u);
  assert.equal(pagosRepository.crear.mock.callCount(), 0);
});

test("POST monto inválido (0, negativo, 3 decimales, string) → 400", async () => {
  for (const monto of [0, -5, 10.005, "10"]) {
    const res = await pedir("POST", "/api/pagos", { ...abono, monto });
    assert.equal(res.statusCode, 400, `monto ${monto}`);
  }
  assert.equal(pagosRepository.transaccion.mock.callCount(), 0);
});

test("POST fecha, método o estado inválidos → 400", async () => {
  for (const cambio of [{ fecha: "2026-02-30" }, { metodo: "cheque" }, { estado: "anulado" }]) {
    const res = await pedir("POST", "/api/pagos", { ...abono, ...cambio });
    assert.equal(res.statusCode, 400, JSON.stringify(cambio));
  }
});

test("POST alumno inexistente → 404", async () => {
  const res = await pedir("POST", "/api/pagos", { ...abono, id_alumno: 999 });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.json(), { error: "Alumno no encontrado" });
});

test("PUT: el propio abono no cuenta contra su saldo", async () => {
  // Abono 1 (300 pagados) sube a 450: cabe porque sin él el saldo es 450.
  const ok = await pedir("PUT", "/api/pagos/1", { ...abono, monto: 450 });
  assert.equal(ok.statusCode, 200);
  const excede = await pedir("PUT", "/api/pagos/1", { ...abono, monto: 450.01 });
  assert.equal(excede.statusCode, 409);
});

test("pago inexistente → 404; id no numérico → 400", async () => {
  assert.equal((await pedir("GET", "/api/pagos/999")).statusCode, 404);
  assert.equal((await pedir("PUT", "/api/pagos/999", abono)).statusCode, 404);
  assert.equal((await pedir("DELETE", "/api/pagos/999")).statusCode, 404);
  assert.equal((await pedir("GET", "/api/pagos/abc")).statusCode, 400);
  assert.equal((await pedir("DELETE", "/api/pagos/0")).statusCode, 400);
});

test("ids fuera de int4 → 400, no 500", async () => {
  const grande = 99999999999;
  assert.equal((await pedir("GET", `/api/pagos/${grande}`)).statusCode, 400);
  assert.equal((await pedir("PUT", `/api/pagos/${grande}`, abono)).statusCode, 400);
  assert.equal((await pedir("DELETE", `/api/pagos/${grande}`)).statusCode, 400);
  assert.equal((await pedir("GET", `/api/pagos/saldo/${grande}`)).statusCode, 400);
  assert.equal((await pedir("GET", `/api/pagos?id_alumno=${grande}`)).statusCode, 400);
  const post = await pedir("POST", "/api/pagos", { ...abono, id_alumno: grande });
  assert.equal(post.statusCode, 400);
  assert.equal(pagosRepository.transaccion.mock.callCount(), 0);
});

test("DELETE existente → 204", async () => {
  assert.equal((await pedir("DELETE", "/api/pagos/1")).statusCode, 204);
  assert.deepEqual(pagosRepository.eliminar.mock.calls[0].arguments, [1]);
});

test("GET listado: pendiente con fecha pasada sale vencido y se filtra por estado", async () => {
  const todos = (await pedir("GET", "/api/pagos")).json();
  assert.deepEqual(
    todos.map((pago) => pago.estado),
    ["pagado", "vencido"],
  );
  const vencidos = (await pedir("GET", "/api/pagos?estado=vencido")).json();
  assert.deepEqual(
    vencidos.map((pago) => pago.id_pago),
    [2],
  );
  assert.equal((await pedir("GET", "/api/pagos?estado=pendiente")).json().length, 0);
  assert.equal((await pedir("GET", "/api/pagos?estado=otro")).statusCode, 400);
  assert.equal((await pedir("GET", "/api/pagos?id_alumno=x")).statusCode, 400);
});

test("GET saldo de un alumno; alumno inexistente → 404", async () => {
  const res = await pedir("GET", "/api/pagos/saldo/1");
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), {
    id_alumno: 1,
    alumno: "Ana",
    curso: "Estándar",
    precio: 450,
    total_pagado: 300,
    saldo_pendiente: 150,
    estado: "vencido",
  });
  assert.equal((await pedir("GET", "/api/pagos/saldo/999")).statusCode, 404);
});

test("GET cuentas por cobrar: solo alumnos con saldo", async () => {
  const cuentas = (await pedir("GET", "/api/pagos/cuentas-por-cobrar")).json();
  assert.deepEqual(
    cuentas.map((cuenta) => [cuenta.id_alumno, cuenta.saldo_pendiente]),
    [[1, 150]],
  );
});
