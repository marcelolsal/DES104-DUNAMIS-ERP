// Concurrencia real de solapes (#68). Opt-in: solo corre con TEST_DATABASE_URL
// apuntando a un Postgres LOCAL desechable con las migraciones aplicadas; sin ella
// se omite. Inserta su propio fixture (año 2001) y lo borra al final.
// Correr: TEST_DATABASE_URL=postgresql://...@127.0.0.1:5432/db pnpm --filter @dunamis/backend test
import { test, after } from "node:test";
import assert from "node:assert/strict";

const url = process.env.TEST_DATABASE_URL;
const local = url !== undefined && /@(127\.0\.0\.1|localhost):/u.test(url);

if (!local) {
  test("solapes concurrentes de clases (requiere TEST_DATABASE_URL local)", { skip: true });
} else {
  Object.assign(process.env, {
    DATABASE_URL: url,
    SUPABASE_URL: "http://127.0.0.1:1",
    SUPABASE_SERVICE_ROLE_KEY: "test",
    SUPABASE_JWT_SECRET: "test",
  });
  const { eq, inArray } = await import("drizzle-orm");
  const { db } = await import("../../shared/db/client.ts");
  const { alumno, clase, instructor, paquete, vehiculo } =
    await import("../../shared/db/schema.ts");
  const { clasesService } = await import("./clases.service.ts");

  const [{ id_paquete }] = await db
    .insert(paquete)
    .values({ nombre: "test-clases", total_horas: 1, precio: "1.00" })
    .returning();
  const [{ id_alumno }] = await db
    .insert(alumno)
    .values({
      nombre: "test-clases",
      dui: "0",
      correo: "t@t.t",
      telefono: "0",
      contacto_emergencia: "x",
      fecha_inscripcion: "2001-01-01",
      id_paquete,
    })
    .returning();
  const [i1, i2] = (
    await db
      .insert(instructor)
      .values([1, 2].map(() => ({ nombre: "test-clases", especialidad: "x", telefono: "0" })))
      .returning()
  ).map((fila) => fila.id_instructor);
  const [v1, v2] = (
    await db
      .insert(vehiculo)
      .values(
        [1, 2].map((n) => ({
          placa: `TEST-${String(process.pid)}-${String(n)}`,
          modelo: "x",
          kilometraje: 0,
          estado: "disponible",
        })),
      )
      .returning()
  ).map((fila) => fila.id_vehiculo);

  after(async () => {
    await db.delete(clase).where(eq(clase.id_alumno, id_alumno));
    await db.delete(instructor).where(inArray(instructor.id_instructor, [i1, i2]));
    await db.delete(vehiculo).where(inArray(vehiculo.id_vehiculo, [v1, v2]));
    await db.delete(alumno).where(eq(alumno.id_alumno, id_alumno));
    await db.delete(paquete).where(eq(paquete.id_paquete, id_paquete));
    await db.$client.end();
  });

  // Crea ambas a la vez; devuelve 201 o el statusCode del error de cada una.
  const enParalelo = async (...clases) =>
    (
      await Promise.allSettled(
        clases.map((datos) => clasesService.crear({ id_alumno, estado: "programada", ...datos })),
      )
    ).map((r) => (r.status === "fulfilled" ? 201 : (r.reason.statusCode ?? r.reason)));

  const DIA = 24 * 3_600_000;
  for (const [caso, inicio, otra] of [
    ["mismo instructor", "2001-06-01T15:00:00Z", { id_vehiculo: v2 }],
    ["mismo vehículo", "2001-07-01T15:00:00Z", { id_instructor: i2 }],
  ]) {
    test(`dos clases solapadas simultáneas (${caso}) → exactamente un 409`, async () => {
      // Varias rondas: sin el bloqueo, alguna deja pasar ambas.
      for (let ronda = 0; ronda < 10; ronda++) {
        const fecha = new Date(Date.parse(inicio) + ronda * DIA);
        const a = { id_instructor: i1, id_vehiculo: v1, fecha_hora: fecha };
        const b = { ...a, ...otra, fecha_hora: new Date(fecha.getTime() + 30 * 60_000) };
        const codigos = await enParalelo(a, b);
        assert.deepEqual(
          codigos.sort((x, y) => x - y),
          [201, 409],
          `ronda ${String(ronda)}`,
        );
      }
    });
  }
}
