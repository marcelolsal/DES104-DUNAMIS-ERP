// Entradas inválidas en clases y estudiantes → 400, nunca 500 (#68).
// Rutas reales con el repositorio simulado. Sin BD: el env es de mentira.
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

const { clasesRepository } = await import("./clases/clases.repository.ts");
const { clasesRoutes } = await import("./clases/clases.routes.ts");
const { estudiantesRepository } = await import("./estudiantes/estudiantes.repository.ts");
const { estudiantesRoutes } = await import("./estudiantes/estudiantes.routes.ts");
const { registerAuth } = await import("../shared/middleware/auth.ts");
const { registerErrorHandler } = await import("../shared/middleware/errors.ts");

const app = Fastify();
registerErrorHandler(app);
registerAuth(app);
app.register(clasesRoutes, { prefix: "/api/clases" });
app.register(estudiantesRoutes, { prefix: "/api/estudiantes" });

const token = await new SignJWT({ sub: "usuario" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuer("http://127.0.0.1:1/auth/v1")
  .setAudience("authenticated")
  .setExpirationTime("5m")
  .sign(new TextEncoder().encode("secreto-de-prueba"));

const pedir = (method, url, payload) =>
  app.inject({ method, url, payload, headers: { authorization: `Bearer ${token}` } });

const alumno = {
  nombre: "Ana",
  dui: "0",
  correo: "ana@test.sv",
  telefono: "0",
  contacto_emergencia: "x",
  fecha_inscripcion: "2026-10-04",
  id_paquete: 999,
};
const clase = {
  id_alumno: 1,
  id_instructor: 1,
  id_vehiculo: 1,
  fecha_hora: "2026-10-05T15:00:00Z",
};
const violacionFk = () => Promise.reject(Object.assign(new Error("fk"), { code: "23503" }));

beforeEach(() => {
  mock.restoreAll();
  // Si una validación falla, nunca debe llegar a la BD.
  for (const repo of [clasesRepository, estudiantesRepository])
    for (const [nombre, fn] of Object.entries(repo))
      if (typeof fn === "function") mock.method(repo, nombre, () => assert.fail(`tocó ${nombre}`));
});

test("ids no numéricos, no positivos o fuera de int4 → 400 sin tocar la BD", async () => {
  for (const id of ["abc", "1.5", "0", "-3", "2147483648", "1e3", "0x10"]) {
    for (const [method, base, payload] of [
      ["GET", "/api/clases"],
      ["PUT", "/api/clases", clase],
      ["DELETE", "/api/clases"],
      ["GET", "/api/estudiantes"],
      ["PUT", "/api/estudiantes", alumno],
    ]) {
      const res = await pedir(method, `${base}/${id}`, payload);
      assert.equal(res.statusCode, 400, `${method} ${base}/${id}`);
    }
  }
});

test("ids de cuerpo fuera de int4 o fecha no YYYY-MM-DD → 400", async () => {
  const claseGrande = { ...clase, id_vehiculo: 2 ** 31 };
  assert.equal((await pedir("POST", "/api/clases", claseGrande)).statusCode, 400);
  for (const cuerpo of [
    { ...alumno, id_paquete: 2 ** 31 },
    { ...alumno, fecha_inscripcion: "2026-10-05T01:30:00.000Z" },
  ])
    assert.equal((await pedir("POST", "/api/estudiantes", cuerpo)).statusCode, 400);
});

test("paquete inexistente al crear o editar un estudiante → 400 con mensaje claro", async () => {
  mock.method(estudiantesRepository, "crear", violacionFk);
  mock.method(estudiantesRepository, "actualizar", violacionFk);
  for (const [method, url] of [
    ["POST", "/api/estudiantes"],
    ["PUT", "/api/estudiantes/1"],
  ]) {
    const res = await pedir(method, url, alumno);
    assert.equal(res.statusCode, 400, `${method} ${url}`);
    assert.deepEqual(res.json(), { error: "El paquete 999 no existe" });
  }
});

test("la fecha de inscripción llega a la BD tal cual (sin pasar por UTC)", async () => {
  const crear = mock.method(estudiantesRepository, "crear", async (datos) => ({
    id_alumno: 1,
    ...datos,
  }));
  assert.equal((await pedir("POST", "/api/estudiantes", alumno)).statusCode, 201);
  assert.equal(crear.mock.calls[0].arguments[0].fecha_inscripcion, "2026-10-04");
});

test("clase con instructor inexistente → 400", async () => {
  mock.method(clasesRepository, "existeAlumno", async () => true);
  mock.method(clasesRepository, "existeInstructor", async () => false);
  mock.method(clasesRepository, "existeVehiculo", async () => true);
  const res = await pedir("POST", "/api/clases", clase);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json(), { error: "El instructor 1 no existe" });
});
