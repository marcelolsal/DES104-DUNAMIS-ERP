import type {
  ActualizarPago,
  ListarPagosQuery,
  NuevoPago,
  PagoListado,
  SaldoAlumno,
} from "@dunamis/contracts";
import { pagosRepository, type Transaccion } from "./pagos.repository.js";
import { aCentavos, calcularSaldo, estadoEfectivo } from "./saldo.js";

const errorDeNegocio = (mensaje: string, statusCode: number) =>
  Object.assign(new Error(mensaje), { statusCode });

type Cuenta = Awaited<ReturnType<typeof pagosRepository.cuentas>>[number];

const conEstadoEfectivo = (pago: PagoListado, hoy: Date): PagoListado => ({
  ...pago,
  estado: estadoEfectivo(pago, hoy),
});

const aSaldo = (cuenta: Cuenta, abonos: PagoListado[], hoy: Date): SaldoAlumno => ({
  ...cuenta,
  ...calcularSaldo(cuenta.precio, abonos, hoy),
});

const obtenerPago = async (id: number) => {
  const pago = await pagosRepository.obtener(id);
  if (!pago) throw errorDeNegocio("Pago no encontrado", 404);
  return conEstadoEfectivo(pago, new Date());
};

// Un abono no puede superar lo que el alumno aún debe. Al editar, el propio
// abono no cuenta contra su saldo (`excluirId`), y solo se valida si la edición
// aumenta lo pagado del alumno: cambiar el método o bajar el monto de un alumno
// sobrepagado debe poder hacerse.
// ponytail: valida cada abono contra el saldo, no la suma de abonos aún sin
// cobrar; si se necesita un plan de cuotas cerrado, validar contra precio − todos.
const validarAbono = async (datos: NuevoPago, tx: Transaccion, excluirId?: number) => {
  const [cuenta] = await pagosRepository.cuentas(datos.id_alumno, tx);
  if (!cuenta) throw errorDeNegocio("Alumno no encontrado", 404);
  const todos = await pagosRepository.listar(datos.id_alumno, tx);
  // Lo que este abono ya aportaba al alumno destino (0 si era de otro alumno o no estaba pagado).
  const previo = todos.find((abono) => abono.id_pago === excluirId);
  const aportePrevio = previo?.estado === "pagado" ? aCentavos(previo.monto) : 0;
  const aumentaLoPagado = datos.estado === "pagado" && aCentavos(datos.monto) > aportePrevio;
  if (excluirId !== undefined && !aumentaLoPagado) return;
  const abonos = todos.filter((abono) => abono !== previo);
  const { saldo_pendiente } = calcularSaldo(cuenta.precio, abonos, new Date());
  if (aCentavos(datos.monto) > aCentavos(saldo_pendiente)) {
    throw errorDeNegocio(
      `El abono de ${datos.monto.toFixed(2)} excede el saldo pendiente del alumno (${saldo_pendiente.toFixed(2)})`,
      409,
    );
  }
};

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const pagosService = {
  listar: async ({ id_alumno, estado }: ListarPagosQuery) => {
    const hoy = new Date();
    const pagos = (await pagosRepository.listar(id_alumno)).map((pago) =>
      conEstadoEfectivo(pago, hoy),
    );
    return estado === undefined ? pagos : pagos.filter((pago) => pago.estado === estado);
  },

  obtener: obtenerPago,

  saldoDeAlumno: async (idAlumno: number) => {
    const [cuenta] = await pagosRepository.cuentas(idAlumno);
    if (!cuenta) throw errorDeNegocio("Alumno no encontrado", 404);
    return aSaldo(cuenta, await pagosRepository.listar(idAlumno), new Date());
  },

  // Cuentas por cobrar: alumnos que aún deben.
  // ponytail: agrupa todos los abonos en memoria; si el volumen crece, pasar a
  // un GROUP BY en SQL.
  cuentasPorCobrar: async () => {
    const [cuentas, pagos] = await Promise.all([
      pagosRepository.cuentas(),
      pagosRepository.listar(),
    ]);
    const hoy = new Date();
    return cuentas
      .map((cuenta) =>
        aSaldo(
          cuenta,
          pagos.filter((pago) => pago.id_alumno === cuenta.id_alumno),
          hoy,
        ),
      )
      .filter((saldo) => saldo.saldo_pendiente > 0);
  },

  crear: (datos: NuevoPago) =>
    pagosRepository.transaccion(async (tx) => {
      await validarAbono(datos, tx);
      return pagosRepository.crear(datos, tx);
    }),

  actualizar: async (id: number, datos: ActualizarPago) => {
    await obtenerPago(id);
    return pagosRepository.transaccion(async (tx) => {
      await validarAbono(datos, tx, id);
      const pago = await pagosRepository.actualizar(id, datos, tx);
      if (!pago) throw errorDeNegocio("Pago no encontrado", 404);
      return pago;
    });
  },

  eliminar: async (id: number) => {
    await obtenerPago(id);
    await pagosRepository.eliminar(id);
  },
};
