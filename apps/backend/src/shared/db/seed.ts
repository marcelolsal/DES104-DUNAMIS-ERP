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

// Seed de desarrollo (#3). Idempotente: borra todo y reinserta un set conocido
// con datos repartidos en el tiempo (~6 meses) para que los reportes tengan
// de dónde comer. Correr con: pnpm db:seed
//
// ponytail: reset total en vez de upsert por fila — es un seed de dev, no prod.

const hoy = new Date();
const diaEnMs = 24 * 60 * 60 * 1000;
const haceDias = (n: number) => new Date(hoy.getTime() - n * diaEnMs);
const enDias = (n: number) => new Date(hoy.getTime() + n * diaEnMs);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

const nombres = [
  "Ana Beltrán", "Bruno Cáceres", "Carla Díaz", "Diego Escobar",
  "Elena Fuentes", "Fabio Guzmán", "Gabriela Henríquez", "Hugo Iraheta",
  "Irene Juárez", "Kevin Lara", "Lucía Mejía", "Mario Núñez",
];

const metodos = ["efectivo", "tarjeta", "transferencia"] as const;

async function main() {
  console.log("🌱 Reseteando tablas…");
  // Orden hijos → padres (respetando FKs)
  await db.delete(clase);
  await db.delete(mantenimiento);
  await db.delete(pago);
  await db.delete(alumno);
  await db.delete(paquete);
  await db.delete(instructor);
  await db.delete(vehiculo);

  console.log("🌱 Insertando catálogos…");
  const paquetes = await db
    .insert(paquete)
    .values([
      { nombre: "Básico", total_horas: 15, precio: "250.00" },
      { nombre: "Estándar", total_horas: 25, precio: "400.00" },
      { nombre: "Intensivo", total_horas: 40, precio: "600.00" },
    ])
    .returning();

  const instructores = await db
    .insert(instructor)
    .values([
      { nombre: "Carlos Reyes", especialidad: "Ciudad", telefono: "7000-0001" },
      { nombre: "María López", especialidad: "Autopista", telefono: "7000-0002" },
      { nombre: "José Martínez", especialidad: "Nocturno", telefono: "7000-0003" },
    ])
    .returning();

  const vehiculos = await db
    .insert(vehiculo)
    .values([
      { placa: "P123-456", modelo: "Toyota Yaris 2020", kilometraje: 45000, estado: "activo" },
      { placa: "P234-567", modelo: "Nissan March 2019", kilometraje: 62000, estado: "activo" },
      { placa: "P345-678", modelo: "Kia Rio 2021", kilometraje: 30000, estado: "en mantenimiento" },
    ])
    .returning();

  console.log("🌱 Insertando alumnos (inscripciones repartidas en ~6 meses)…");
  const alumnos = await db
    .insert(alumno)
    .values(
      nombres.map((nombre, i) => ({
        nombre,
        dui: `0${(1000000 + i * 137).toString().slice(0, 7)}-${i % 10}`,
        correo: `${nombre.toLowerCase().replace(/[^a-z]/g, ".")}@correo.com`,
        telefono: `7${(100 + i).toString()}-${(2000 + i * 3).toString()}`,
        contacto_emergencia: `7999-${(1000 + i).toString()}`,
        // inscripción escalonada: del más antiguo (~170 días) al más reciente
        fecha_inscripcion: ymd(haceDias(170 - i * 14)),
        id_paquete: paquetes[i % paquetes.length]!.id_paquete,
      })),
    )
    .returning();

  console.log("🌱 Insertando clases (pasadas impartidas + futuras programadas)…");
  const clasesValues = [];
  for (let i = 0; i < alumnos.length; i++) {
    const a = alumnos[i]!;
    // 2 clases pasadas (impartidas) + 1 futura (programada) por alumno
    const offsets = [-(40 + i * 3), -(12 + i), 3 + (i % 20)];
    for (let j = 0; j < offsets.length; j++) {
      const d = offsets[j]! < 0 ? haceDias(-offsets[j]!) : enDias(offsets[j]!);
      d.setHours(8 + ((i + j) % 9), 0, 0, 0);
      clasesValues.push({
        id_alumno: a.id_alumno,
        id_instructor: instructores[(i + j) % instructores.length]!.id_instructor,
        id_vehiculo: vehiculos[(i + j) % vehiculos.length]!.id_vehiculo,
        fecha_hora: d,
        estado: offsets[j]! < 0 ? "impartida" : "programada",
      });
    }
  }
  await db.insert(clase).values(clasesValues);

  console.log("🌱 Insertando pagos (abonos en distintos meses, estados variados)…");
  const pagosValues = [];
  for (let i = 0; i < alumnos.length; i++) {
    const a = alumnos[i]!;
    const precio = Number(paquetes[i % paquetes.length]!.precio);
    // Abono inicial (pagado) al inscribirse
    pagosValues.push({
      id_alumno: a.id_alumno,
      monto: (precio / 2).toFixed(2),
      fecha: ymd(haceDias(168 - i * 14)),
      metodo: metodos[i % metodos.length]!,
      estado: "pagado",
    });
    // Segundo abono: alterna pagado / pendiente / vencido según el alumno
    const estado2 = i % 3 === 0 ? "pagado" : i % 3 === 1 ? "pendiente" : "vencido";
    pagosValues.push({
      id_alumno: a.id_alumno,
      monto: (precio / 4).toFixed(2),
      // los vencidos con fecha ya pasada; los pendientes próximos a vencer
      fecha: estado2 === "vencido" ? ymd(haceDias(20 + i)) : ymd(haceDias(i * 5)),
      metodo: metodos[(i + 1) % metodos.length]!,
      estado: estado2,
    });
  }
  await db.insert(pago).values(pagosValues);

  console.log("🌱 Insertando mantenimientos (historial en el tiempo)…");
  await db.insert(mantenimiento).values([
    { id_vehiculo: vehiculos[0]!.id_vehiculo, fecha: ymd(haceDias(150)), descripcion: "Cambio de aceite y filtros", costo: "45.00" },
    { id_vehiculo: vehiculos[0]!.id_vehiculo, fecha: ymd(haceDias(60)), descripcion: "Rotación de llantas", costo: "20.00" },
    { id_vehiculo: vehiculos[1]!.id_vehiculo, fecha: ymd(haceDias(120)), descripcion: "Frenos delanteros", costo: "80.00" },
    { id_vehiculo: vehiculos[1]!.id_vehiculo, fecha: ymd(haceDias(30)), descripcion: "Cambio de batería", costo: "65.00" },
    { id_vehiculo: vehiculos[2]!.id_vehiculo, fecha: ymd(haceDias(10)), descripcion: "Revisión de embrague", costo: "120.00" },
  ]);

  const cuenta = {
    paquetes: paquetes.length,
    instructores: instructores.length,
    vehiculos: vehiculos.length,
    alumnos: alumnos.length,
    clases: clasesValues.length,
    pagos: pagosValues.length,
  };
  console.log("✅ Seed completo:", cuenta);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed falló:", err);
    process.exit(1);
  });
