import type { NuevoClase } from "@dunamis/contracts";
import { config } from "../../shared/config.js";
import { clasesRepository, type Transaccion } from "./clases.repository.js";
import { rangoAgenda } from "./rango-agenda.js";
import { solapesCon } from "./solape.js";

const err = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

// Verifica que las 3 FKs existan antes de tocar la BD (evita un 500 por FK).
const validarReferencias = async (datos: NuevoClase) => {
  const [a, i, v] = await Promise.all([
    clasesRepository.existeAlumno(datos.id_alumno),
    clasesRepository.existeInstructor(datos.id_instructor),
    clasesRepository.existeVehiculo(datos.id_vehiculo),
  ]);
  if (!a) throw err(400, `El alumno ${datos.id_alumno} no existe`);
  if (!i) throw err(400, `El instructor ${datos.id_instructor} no existe`);
  if (!v) throw err(400, `El vehículo ${datos.id_vehiculo} no existe`);
};

// Rechaza si el instructor o el vehículo ya están ocupados en la franja.
// Una clase cancelada no ocupa franja, así que no se valida. Corre dentro de la
// transacción que escribe, tras bloquear la agenda del instructor y del vehículo:
// dos requests simultáneos no pueden validar ambos antes de que el otro escriba.
const validarSolape = async (datos: NuevoClase, tx: Transaccion, excluirId?: number) => {
  if (datos.estado === "cancelada") return;
  await clasesRepository.bloquearAgenda(tx, datos.id_instructor, datos.id_vehiculo);
  const candidatas = await clasesRepository.posiblesConflictos(
    { id_instructor: datos.id_instructor, id_vehiculo: datos.id_vehiculo, excluirId },
    tx,
  );
  const choques = solapesCon(datos.fecha_hora, candidatas, config.CLASE_DURACION_MIN);
  if (choques.length === 0) return;
  const instructorOcupado = choques.some((c) => c.id_instructor === datos.id_instructor);
  const vehiculoOcupado = choques.some((c) => c.id_vehiculo === datos.id_vehiculo);
  const quien = [instructorOcupado && "el instructor", vehiculoOcupado && "el vehículo"]
    .filter(Boolean)
    .join(" y ");
  throw err(409, `Solape: ${quien} ya tiene una clase en esa franja`);
};

// Reglas de negocio. No conoce req/res ni la BD directamente.
export const clasesService = {
  listar: () => clasesRepository.listar(),

  listarAgenda: (desdeIso: string, hastaIso: string) => {
    const rango = rangoAgenda(desdeIso, hastaIso);
    if (!rango) throw err(400, "Rango de fechas inválido");
    return clasesRepository.listarAgenda(rango.desde, rango.hasta);
  },

  // Incluye la duración configurada para que la UI no la duplique como constante.
  listarOpciones: async () => ({
    ...(await clasesRepository.listarOpciones()),
    duracion_min: config.CLASE_DURACION_MIN,
  }),

  obtener: async (id: number) => {
    const clase = await clasesRepository.obtener(id);
    if (!clase) throw err(404, "Clase no encontrada");
    return clase;
  },

  crear: async (datos: NuevoClase) => {
    await validarReferencias(datos);
    return clasesRepository.transaccion(async (tx) => {
      await validarSolape(datos, tx);
      return clasesRepository.crear(datos, tx);
    });
  },

  actualizar: async (id: number, datos: NuevoClase) => {
    await clasesService.obtener(id); // 404 si no existe
    await validarReferencias(datos);
    return clasesRepository.transaccion(async (tx) => {
      await validarSolape(datos, tx, id);
      return clasesRepository.actualizar(id, datos, tx);
    });
  },

  eliminar: async (id: number) => {
    await clasesService.obtener(id); // 404 si no existe
    await clasesRepository.eliminar(id);
  },
};
