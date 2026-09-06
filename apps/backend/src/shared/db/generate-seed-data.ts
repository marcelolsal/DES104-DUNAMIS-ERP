import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Generador de fixtures de desarrollo → escribe seed-data/*.jsonl (una fila por
// línea). Determinista (RNG con semilla), así regenerar da el mismo dataset.
// Para agrandar el volumen, subí las constantes N_* y volvé a correr:
//   pnpm --filter @dunamis/backend db:seed:gen
//
// El seed (seed.ts) lee estos JSONL en streaming + por lotes, para que crezcan
// sin cargar todo en memoria.

const N_PAQUETES = 6;
const N_INSTRUCTORES = 10;
const N_VEHICULOS = 14;
const N_ALUMNOS = 200;

const OUT = join(dirname(fileURLToPath(import.meta.url)), "seed-data");
mkdirSync(OUT, { recursive: true });

// --- RNG determinista (LCG) ---
let s = 987654321;
const rnd = () => {
  s = (s * 1103515245 + 12345) & 0x7fffffff;
  return s / 0x7fffffff;
};
const randInt = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)]!;
const money = (n: number) => n.toFixed(2);

const hoy = new Date();
const diaMs = 86_400_000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const desplazar = (dias: number) => new Date(hoy.getTime() + dias * diaMs);

const writeJsonl = (name: string, rows: unknown[]) => {
  writeFileSync(join(OUT, name), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  console.log(`  ${name}: ${rows.length} filas`);
};

// --- Catálogos ---
const nombresPaquete = ["Básico", "Estándar", "Intensivo", "Premium", "Express", "Fin de semana"];
const paquetes = Array.from({ length: N_PAQUETES }, (_, i) => ({
  id_paquete: i + 1,
  nombre: nombresPaquete[i] ?? `Paquete ${i + 1}`,
  total_horas: pick([10, 15, 20, 25, 30, 40]),
  precio: money(pick([200, 250, 300, 400, 500, 600])),
}));

const especialidades = ["Ciudad", "Autopista", "Nocturno", "Automático", "Mecánico"];
const nombresPila = ["Carlos", "María", "José", "Ana", "Luis", "Sofía", "Pedro", "Lucía", "Diego", "Elena", "Mario", "Karla", "Hugo", "Irene", "Bruno", "Gabriela"];
const apellidos = ["Reyes", "López", "Martínez", "Díaz", "Escobar", "Fuentes", "Henríquez", "Juárez", "Lara", "Mejía", "Núñez", "Portillo", "Guzmán", "Cáceres", "Beltrán", "Iraheta"];
const nombreCompleto = (i: number) => `${nombresPila[i % nombresPila.length]} ${apellidos[(i * 7) % apellidos.length]}`;

const instructores = Array.from({ length: N_INSTRUCTORES }, (_, i) => ({
  id_instructor: i + 1,
  nombre: nombreCompleto(i + 3),
  especialidad: pick(especialidades),
  telefono: `7${String(200 + i).padStart(3, "0")}-${String(1000 + i * 7)}`,
}));

const modelos = ["Toyota Yaris", "Nissan March", "Kia Rio", "Hyundai Accent", "Suzuki Swift", "Chevrolet Spark", "Mazda 2"];
const vehiculos = Array.from({ length: N_VEHICULOS }, (_, i) => ({
  id_vehiculo: i + 1,
  placa: `P${String(100 + i)}-${String(400 + i * 3)}`,
  modelo: `${pick(modelos)} ${randInt(2016, 2023)}`,
  kilometraje: randInt(15_000, 90_000),
  estado: rnd() < 0.15 ? "en mantenimiento" : "activo",
}));

// --- Alumnos: inscripciones repartidas en ~14 meses ---
const alumnos = Array.from({ length: N_ALUMNOS }, (_, i) => {
  const nombre = nombreCompleto(i);
  const diasAtras = randInt(5, 430);
  return {
    id_alumno: i + 1,
    nombre,
    dui: `0${String(randInt(1_000_000, 9_999_999))}-${randInt(0, 9)}`,
    correo: `${nombre.toLowerCase().replace(/[^a-z]/g, ".")}${i}@correo.com`,
    telefono: `7${String(randInt(100, 899))}-${String(randInt(1000, 9999))}`,
    contacto_emergencia: `7999-${String(1000 + i)}`,
    fecha_inscripcion: ymd(desplazar(-diasAtras)),
    id_paquete: pick(paquetes).id_paquete,
    _diasAtras: diasAtras, // auxiliar, no se persiste
  };
});

// --- Clases: varias por alumno, pasadas (impartida/cancelada) y futuras (programada) ---
const estadoClasePasada = () => (rnd() < 0.12 ? "cancelada" : "impartida");
const clases: Record<string, unknown>[] = [];
let claseId = 1;
for (const a of alumnos) {
  const cantidad = randInt(2, 12);
  for (let k = 0; k < cantidad; k++) {
    // dentro de la ventana desde su inscripción hasta ~30 días en el futuro
    const offset = randInt(-a._diasAtras + 1, 30);
    const d = desplazar(offset);
    d.setHours(randInt(7, 18), pick([0, 30]), 0, 0);
    clases.push({
      id_clase: claseId++,
      id_alumno: a.id_alumno,
      id_instructor: pick(instructores).id_instructor,
      id_vehiculo: pick(vehiculos).id_vehiculo,
      fecha_hora: d.toISOString(),
      estado: offset < 0 ? estadoClasePasada() : "programada",
    });
  }
}

// --- Pagos: abonos en distintos meses, estados variados ---
const metodos = ["efectivo", "tarjeta", "transferencia"];
const pagos: Record<string, unknown>[] = [];
let pagoId = 1;
for (const a of alumnos) {
  const precio = Number(paquetes[a.id_paquete - 1]!.precio);
  const nAbonos = randInt(1, 4);
  for (let k = 0; k < nAbonos; k++) {
    const fraccion = k === 0 ? 0.5 : 0.25;
    // estado: primer abono casi siempre pagado; resto mezcla
    let estado: string;
    if (k === 0) estado = "pagado";
    else estado = pick(["pagado", "pagado", "pendiente", "vencido"]);
    const diasAtras =
      estado === "vencido" ? randInt(1, 45) : randInt(0, a._diasAtras);
    pagos.push({
      id_pago: pagoId++,
      id_alumno: a.id_alumno,
      monto: money(precio * fraccion),
      fecha: ymd(desplazar(-diasAtras)),
      metodo: pick(metodos),
      estado,
    });
  }
}

// --- Mantenimientos: historial por vehículo ---
const trabajos = ["Cambio de aceite y filtros", "Rotación de llantas", "Frenos delanteros", "Cambio de batería", "Revisión de embrague", "Alineación y balanceo", "Cambio de bujías"];
const mantenimientos: Record<string, unknown>[] = [];
let mantId = 1;
for (const v of vehiculos) {
  const n = randInt(1, 5);
  for (let k = 0; k < n; k++) {
    mantenimientos.push({
      id_mantenimiento: mantId++,
      id_vehiculo: v.id_vehiculo,
      fecha: ymd(desplazar(-randInt(5, 400))),
      descripcion: pick(trabajos),
      costo: money(randInt(15, 200)),
    });
  }
}

// Quitar el campo auxiliar antes de persistir alumnos
const alumnosOut = alumnos.map(({ _diasAtras, ...a }) => a);

console.log("🧬 Generando fixtures JSONL…");
writeJsonl("paquete.jsonl", paquetes);
writeJsonl("instructor.jsonl", instructores);
writeJsonl("vehiculo.jsonl", vehiculos);
writeJsonl("alumno.jsonl", alumnosOut);
writeJsonl("clase.jsonl", clases);
writeJsonl("pago.jsonl", pagos);
writeJsonl("mantenimiento.jsonl", mantenimientos);
console.log("✅ Fixtures generados en seed-data/");
