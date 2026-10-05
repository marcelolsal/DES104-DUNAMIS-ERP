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
const tx = { transaccion: true };
let pagos;
beforeEach(() => {
  mock.restoreAll();
  pagos = [fila(1, 300), fila(2, 100, "pendiente", "2020-01-01")];
  const cuentas = [
    { id_alumno: 1, alumno: "Ana", curso: "Estándar", precio: 450 },
    { id_alumno: 2, alumno: "Luis", curso: "Estándar", precio: 0 },
  ];
  mock.method(pagosRepository, "transaccion", (operacion) => operacion(tx));
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
  // Como el repo real: guardan la fila y devuelven el Pago (fecha Date, sin alumno/curso).
  const guardar = (id_pago, datos) => {
    const guardado = { ...datos, id_pago, fecha: new Date(datos.fecha) };
    pagos = [
      ...pagos.filter((p) => p.id_pago !== id_pago),
      { ...guardado, alumno: "Ana", curso: "Estándar" },
    ];
    return guardado;
  };
  mock.method(pagosRepository, "crear", async (datos) => guardar(99, datos));
  mock.method(pagosRepository, "actualizar", async (id, datos) =>
    pagos.some((p) => p.id_pago === id) ? guardar(id, datos) : null,
  );
  mock.method(pagosRepository, "eliminar", async () => undefined);
});

test("sin token → 401", async () => {
  const res = await app.inject({ method: "GET", url: "/api/pagos" });
  assert.equal(res.statusCode, 401);
  assert.equal(pagosRepository.listar.mock.callCount(), 0);
});

test("POST abono dentro del saldo → 201, estado por defecto pagado, misma forma que GET", async () => {
  const res = await pedir("POST", "/api/pagos", abono);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.json(), {
    ...abono,
    fecha: "2026-10-04T00:00:00.000Z",
    estado: "pagado",
    id_pago: 99,
    alumno: "Ana",
    curso: "Estándar",
  });
  assert.deepEqual(res.json(), (await pedir("GET", "/api/pagos/99")).json());
});

test("POST/PUT validan, bloquean y releen dentro de la transacción", async () => {
  await pedir("POST", "/api/pagos", abono);
  await pedir("PUT", "/api/pagos/1", abono);
  for (const metodo of ["cuentas", "listar", "obtener"]) {
    const enTx = pagosRepository[metodo].mock.calls.filter((c) => c.arguments[1] === tx);
    assert.equal(enTx.length, 2, metodo);
  }
  assert.equal(pagosRepository.crear.mock.calls[0].arguments[1], tx);
  assert.equal(pagosRepository.actualizar.mock.calls[0].arguments[2], tx);
});

test("cuentas con tx usa FOR UPDATE sobre el alumno", async () => {
  mock.restoreAll();
  const llamadas = [];
  // Query builder falso: encadena cualquier método y al await devuelve [].
  const txFalso = new Proxy(
    {},
    {
      get: (_, metodo) =>
        metodo === "then"
          ? (ok) => ok([])
          : (...args) => {
              llamadas.push([metodo, args[0]]);
              return txFalso;
            },
    },
  );
  await pagosRepository.cuentas(1, txFalso);
  assert.deepEqual(llamadas.at(-1), ["for", "update"]);
});

test("PUT responde el estado efectivo con alumno y curso, como GET", async () => {
  const res = await pedir("PUT", "/api/pagos/1", {
    ...abono,
    estado: "pendiente",
    fecha: "2020-01-01",
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().estado, "vencido");
  assert.equal(res.json().fecha, "2020-01-01T00:00:00.000Z");
  assert.deepEqual(res.json(), (await pedir("GET", "/api/pagos/1")).json());
});

test("estado vencido en escritura → 400 (lo deriva el backend)", async () => {
  const vencido = { ...abono, fecha: "2030-01-01", estado: "vencido" };
  assert.equal((await pedir("POST", "/api/pagos", vencido)).statusCode, 400);
  assert.equal((await pedir("PUT", "/api/pagos/1", vencido)).statusCode, 400);
  assert.equal(pagosRepository.transaccion.mock.callCount(), 0);
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

test("PUT en alumno sobrepagado: editar sin aumentar lo pagado → 200; aumentar sobre el saldo → 409", async () => {
  pagos.push(fila(3, 200)); // 300 + 200 = 500 pagados sobre un precio de 450
  const metodo = await pedir("PUT", "/api/pagos/3", { ...abono, monto: 200, metodo: "tarjeta" });
  assert.equal(metodo.statusCode, 200);
  const baja = await pedir("PUT", "/api/pagos/3", { ...abono, monto: 100 });
  assert.equal(baja.statusCode, 200);
  // Sin el abono 3 el saldo es 450 − 300 = 150.
  const sube = await pedir("PUT", "/api/pagos/3", { ...abono, monto: 200.01 });
  assert.equal(sube.statusCode, 409);
  // Pasarlo a otro alumno suma a ese alumno (Luis, al día) → se valida.
  const otro = await pedir("PUT", "/api/pagos/3", { ...abono, id_alumno: 2, monto: 200 });
  assert.equal(otro.statusCode, 409);
  assert.equal(pagosRepository.actualizar.mock.callCount(), 2);
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

test("ids no decimales (0x10, 1e3) → 400", async () => {
  for (const id of ["0x10", "1e3", "+5", " 7"]) {
    const ruta = encodeURIComponent(id);
    assert.equal((await pedir("GET", `/api/pagos/${ruta}`)).statusCode, 400, id);
    assert.equal((await pedir("PUT", `/api/pagos/${ruta}`, abono)).statusCode, 400, id);
    assert.equal((await pedir("DELETE", `/api/pagos/${ruta}`)).statusCode, 400, id);
    assert.equal((await pedir("GET", `/api/pagos/saldo/${ruta}`)).statusCode, 400, id);
    assert.equal((await pedir("GET", `/api/pagos?id_alumno=${ruta}`)).statusCode, 400, id);
  }
  assert.equal(pagosRepository.obtener.mock.callCount(), 0);
  assert.equal(pagosRepository.listar.mock.callCount(), 0);
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
