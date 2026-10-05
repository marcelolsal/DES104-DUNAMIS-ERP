import { desc, eq, getTableColumns } from "drizzle-orm";
import {
  pagoListadoSchema,
  pagoSchema,
  type ActualizarPago,
  type NuevoPago,
  type Pago,
  type PagoListado,
} from "@dunamis/contracts";
import { db } from "../../shared/db/client.js";
import { parseSalida } from "../../shared/db/salida.js";
import { alumno, pago, paquete } from "../../shared/db/schema.js";

export type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Ejecutor = typeof db | Transaccion;

// PostgreSQL numeric se representa como string en Drizzle. La API conserva el
// contrato compartido, que expone monto y precio como number y fecha como Date.
const aPago = (registro: typeof pago.$inferSelect): Pago =>
  parseSalida(pagoSchema, { ...registro, monto: Number(registro.monto) });

const aPagoListado = (
  registro: typeof pago.$inferSelect & { alumno: string; curso: string },
): PagoListado => parseSalida(pagoListadoSchema, { ...registro, monto: Number(registro.monto) });

const aValoresDePersistencia = (datos: NuevoPago) => ({ ...datos, monto: String(datos.monto) });

const seleccionarPagos = (ejecutor: Ejecutor) =>
  ejecutor
    .select({ ...getTableColumns(pago), alumno: alumno.nombre, curso: paquete.nombre })
    .from(pago)
    .innerJoin(alumno, eq(pago.id_alumno, alumno.id_alumno))
    .innerJoin(paquete, eq(alumno.id_paquete, paquete.id_paquete));

// Única capa que toca la BD (Drizzle). ADR-0004.
export const pagosRepository = {
  // Las escrituras validan contra el saldo: leer y escribir van en una transacción.
  transaccion: <T>(operacion: (tx: Transaccion) => Promise<T>) => db.transaction(operacion),

  listar: async (idAlumno?: number, ejecutor: Ejecutor = db) =>
    (
      await seleccionarPagos(ejecutor)
        .where(idAlumno === undefined ? undefined : eq(pago.id_alumno, idAlumno))
        .orderBy(desc(pago.fecha), desc(pago.id_pago))
    ).map(aPagoListado),

  obtener: (id: number, ejecutor: Ejecutor = db) =>
    seleccionarPagos(ejecutor)
      .where(eq(pago.id_pago, id))
      .then((resultados) => (resultados[0] ? aPagoListado(resultados[0]) : null)),

  // Alumnos con el precio de su paquete. Dentro de una transacción bloquea la
  // fila del alumno (FOR UPDATE) para que dos abonos simultáneos no superen el saldo.
  cuentas: async (idAlumno?: number, tx?: Transaccion) => {
    const consulta = (tx ?? db)
      .select({
        id_alumno: alumno.id_alumno,
        alumno: alumno.nombre,
        curso: paquete.nombre,
        precio: paquete.precio,
      })
      .from(alumno)
      .innerJoin(paquete, eq(alumno.id_paquete, paquete.id_paquete))
      .where(idAlumno === undefined ? undefined : eq(alumno.id_alumno, idAlumno))
      .orderBy(alumno.id_alumno);
    const cuentas = await (tx ? consulta.for("update", { of: alumno }) : consulta);
    return cuentas.map((cuenta) => ({ ...cuenta, precio: Number(cuenta.precio) }));
  },

  crear: (datos: NuevoPago, tx: Transaccion) =>
    tx
      .insert(pago)
      .values(aValoresDePersistencia(datos))
      .returning()
      .then((resultados) => {
        const creado = resultados[0];
        if (!creado) throw new Error("No se pudo crear el pago");
        return aPago(creado);
      }),

  actualizar: (id: number, datos: ActualizarPago, tx: Transaccion) =>
    tx
      .update(pago)
      .set(aValoresDePersistencia(datos))
      .where(eq(pago.id_pago, id))
      .returning()
      .then((resultados) => (resultados[0] ? aPago(resultados[0]) : null)),

  eliminar: (id: number) => db.delete(pago).where(eq(pago.id_pago, id)),
};
