import type { ActualizarMantenimiento, NuevoMantenimiento } from "@dunamis/contracts";
import { mantenimientosRepository } from "./mantenimientos.repository.js";

const errorDeNegocio = (mensaje: string, statusCode: number) =>
  Object.assign(new Error(mensaje), { statusCode });

const obtenerMantenimiento = async (id: number) => {
  const mantenimiento = await mantenimientosRepository.obtener(id);
  if (!mantenimiento) throw errorDeNegocio("Mantenimiento no encontrado", 404);
  return mantenimiento;
};

const verificarVehiculo = async (idVehiculo: number) => {
  if (!(await mantenimientosRepository.existeVehiculo(idVehiculo))) {
    throw errorDeNegocio("Vehículo no encontrado", 404);
  }
};

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const mantenimientosService = {
  listar: () => mantenimientosRepository.listar(),

  listarPorVehiculo: (idVehiculo: number) => mantenimientosRepository.listarPorVehiculo(idVehiculo),

  obtener: obtenerMantenimiento,

  crear: async (datos: NuevoMantenimiento) => {
    await verificarVehiculo(datos.id_vehiculo);
    return mantenimientosRepository.crear(datos);
  },

  actualizar: async (id: number, datos: ActualizarMantenimiento) => {
    await obtenerMantenimiento(id);
    await verificarVehiculo(datos.id_vehiculo);
    const mantenimiento = await mantenimientosRepository.actualizar(id, datos);
    if (!mantenimiento) throw errorDeNegocio("Mantenimiento no encontrado", 404);
    return mantenimiento;
  },

  eliminar: async (id: number) => {
    await obtenerMantenimiento(id);
    await mantenimientosRepository.eliminar(id);
  },
};
