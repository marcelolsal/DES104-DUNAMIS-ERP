import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "./client.js";
import {
  paquete,
  alumno,
  instructor,
  vehiculo,
  clase,
  mantenimiento,
  pago,
} from "./schema.js";

// Seed de desarrollo (#3). Lee los fixtures seed-data/*.jsonl en streaming y los
// inserta por lotes, así el dataset puede crecer sin cargarse entero en memoria.
//
// Dos modos:
//   pnpm db:seed            → RELLENA: inserta solo las filas de los fixtures que
//                             faltan (por id), sin tocar lo que ya existe.
//   pnpm db:seed -- --reset → HARD RESET: borra todo y reinserta desde cero.
//
// Para regenerar/agrandar los fixtures: pnpm db:seed:gen (ver generate-seed-data.ts)

const DATA = join(dirname(fileURLToPath(import.meta.url)), "seed-data");
const LOTE = 1000;
const HARD_RESET = process.argv.includes("--reset");

// Lee un JSONL línea por línea (streaming).
async function* leerJsonl(archivo: string): AsyncGenerator<Record<string, unknown>> {
  const rl = createInterface({
    input: createReadStream(join(DATA, archivo)),
    crlfDelay: Infinity,
  });
  for await (const linea of rl) {
    const t = linea.trim();
    if (t) yield JSON.parse(t) as Record<string, unknown>;
  }
}

// Inserta un JSONL en su tabla, en lotes.
async function cargar(
  tabla: PgTable,
  archivo: string,
  transform?: (row: Record<string, unknown>) => Record<string, unknown>,
): Promise<number> {
  let lote: Record<string, unknown>[] = [];
  let total = 0;
  const flush = async () => {
    if (lote.length === 0) return;
    // En modo relleno, saltar filas cuyo id ya exista (no pisa lo existente).
    if (HARD_RESET) await db.insert(tabla).values(lote);
    else await db.insert(tabla).values(lote).onConflictDoNothing();
    total += lote.length;
    lote = [];
  };
  for await (const row of leerJsonl(archivo)) {
    lote.push(transform ? transform(row) : row);
    if (lote.length >= LOTE) await flush();
  }
  await flush();
  return total;
}

// Reinicia la secuencia serial de una tabla al MAX(id) tras insertar ids explícitos.
const resetSeq = (t: string, c: string) =>
  db.execute(
    sql.raw(
      `SELECT setval(pg_get_serial_sequence('${t}','${c}'), (SELECT COALESCE(MAX(${c}),1) FROM ${t}), true)`,
    ),
  );

async function main() {
  if (HARD_RESET) {
    console.log("🌱 HARD RESET: borrando tablas…");
    await db.delete(clase);
    await db.delete(mantenimiento);
    await db.delete(pago);
    await db.delete(alumno);
    await db.delete(paquete);
    await db.delete(instructor);
    await db.delete(vehiculo);
  } else {
    console.log("🌱 RELLENO: insertando solo filas faltantes (no pisa lo existente)…");
  }

  console.log("🌱 Cargando fixtures JSONL…");
  const conteo = {
    paquetes: await cargar(paquete, "paquete.jsonl"),
    instructores: await cargar(instructor, "instructor.jsonl"),
    vehiculos: await cargar(vehiculo, "vehiculo.jsonl"),
    alumnos: await cargar(alumno, "alumno.jsonl"),
    clases: await cargar(clase, "clase.jsonl", (r) => ({
      ...r,
      fecha_hora: new Date(r.fecha_hora as string),
    })),
    pagos: await cargar(pago, "pago.jsonl"),
    mantenimientos: await cargar(mantenimiento, "mantenimiento.jsonl"),
  };

  console.log("🌱 Reiniciando secuencias…");
  await resetSeq("paquete", "id_paquete");
  await resetSeq("instructor", "id_instructor");
  await resetSeq("vehiculo", "id_vehiculo");
  await resetSeq("alumno", "id_alumno");
  await resetSeq("clase", "id_clase");
  await resetSeq("pago", "id_pago");
  await resetSeq("mantenimiento", "id_mantenimiento");

  console.log(`✅ Seed completo (${HARD_RESET ? "hard reset" : "relleno"}):`, conteo);
  if (!HARD_RESET) console.log("   (conteo = filas de los fixtures procesadas; las ya existentes se saltaron)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed falló:", err);
    process.exit(1);
  });
