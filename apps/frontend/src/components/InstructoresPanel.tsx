import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import type { Instructor, NuevoInstructor } from "@dunamis/contracts";
import { instructoresApi, type MetricasInstructor } from "../api/instructores.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";
import "./instructores.css";

const formularioVacio: NuevoInstructor = { nombre: "", especialidad: "", telefono: "" };
const formatoHoras = new Intl.NumberFormat("es-SV", { maximumFractionDigits: 1 });
// Al menos un carácter que no sea espacio: el backend recorta y rechaza vacíos.
const NO_VACIO = ".*\\S.*";

// Métricas por instructor: sin entrada = cargando, null = la petición falló.
type MetricasPorId = Record<number, MetricasInstructor | null>;

export const InstructoresPanel = (): ReactNode => {
  const [instructores, setInstructores] = useState<Instructor[] | null>(null);
  const [metricas, setMetricas] = useState<MetricasPorId>({});
  const [version, setVersion] = useState(0);
  const [errorCarga, setErrorCarga] = useState<string>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  // undefined = modal cerrado, null = alta, Instructor = edición.
  const [edicion, setEdicion] = useState<Instructor | null>();
  const [formulario, setFormulario] = useState<NuevoInstructor>(formularioVacio);
  const [errorModal, setErrorModal] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cancelacion = new AbortController();
    const obsoleta = () => cancelacion.signal.aborted;
    void (async () => {
      try {
        const lista = await instructoresApi.listar();
        if (obsoleta()) return;
        setInstructores(lista);
        setErrorCarga(undefined);
        const resultados = await Promise.allSettled(
          lista.map((instructor) => instructoresApi.metricas(instructor.id_instructor)),
        );
        if (obsoleta()) return;
        setMetricas(
          Object.fromEntries(
            lista.map((instructor, i) => {
              const resultado = resultados[i];
              return [
                instructor.id_instructor,
                resultado?.status === "fulfilled" ? resultado.value : null,
              ];
            }),
          ),
        );
      } catch (errorDesconocido) {
        if (!obsoleta()) setErrorCarga(mensajeDeError(errorDesconocido));
      }
    })();
    return () => {
      cancelacion.abort();
    };
  }, [version]);

  const modalAbierto = edicion !== undefined;
  useEffect(() => {
    if (!modalAbierto) return;
    const alPulsar = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEdicion(undefined);
    };
    window.addEventListener("keydown", alPulsar);
    return () => {
      window.removeEventListener("keydown", alPulsar);
    };
  }, [modalAbierto]);

  const recargar = () => {
    setVersion((actual) => actual + 1);
  };

  const abrirModal = (instructor: Instructor | null) => {
    setEdicion(instructor);
    setFormulario(
      instructor
        ? {
            nombre: instructor.nombre,
            especialidad: instructor.especialidad,
            telefono: instructor.telefono,
          }
        : formularioVacio,
    );
    setErrorModal(undefined);
    setError(undefined);
    setSuccess(undefined);
  };

  const guardar = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setGuardando(true);
    setErrorModal(undefined);
    const datos: NuevoInstructor = {
      nombre: formulario.nombre.trim(),
      especialidad: formulario.especialidad.trim(),
      telefono: formulario.telefono.trim(),
    };
    try {
      if (edicion) await instructoresApi.actualizar(edicion.id_instructor, datos);
      else await instructoresApi.crear(datos);
      setSuccess(
        edicion ? "Instructor actualizado correctamente." : "Instructor creado correctamente.",
      );
      setEdicion(undefined);
      recargar();
    } catch (errorDesconocido) {
      setErrorModal(mensajeDeError(errorDesconocido));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (instructor: Instructor) => {
    if (!window.confirm(`¿Eliminar al instructor “${instructor.nombre}”?`)) return;
    setError(undefined);
    setSuccess(undefined);
    try {
      await instructoresApi.eliminar(instructor.id_instructor);
      setSuccess("Instructor eliminado correctamente.");
      recargar();
    } catch (errorDesconocido) {
      setError(mensajeDeError(errorDesconocido));
    }
  };

  const campo = (nombre: keyof NuevoInstructor, etiqueta: string, maximo: number) => (
    <label>
      {etiqueta}
      <input
        required
        autoFocus={nombre === "nombre"}
        maxLength={maximo}
        pattern={NO_VACIO}
        title="No puede estar vacío"
        type={nombre === "telefono" ? "tel" : "text"}
        value={formulario[nombre]}
        onChange={(event) => {
          setFormulario({ ...formulario, [nombre]: event.target.value });
        }}
      />
    </label>
  );

  return (
    <section className="students-content">
      <div className="students-heading">
        <div>
          <p className="section-kicker">GESTIÓN</p>
          <h1>INSTRUCTORES</h1>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            abrirModal(null);
          }}
        >
          + NUEVO INSTRUCTOR
        </button>
      </div>
      <ApiMessage error={error} success={success} />
      {errorCarga && (
        <div className="inst-estado" role="alert">
          <p>No se pudieron cargar los instructores: {errorCarga}</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setErrorCarga(undefined);
              recargar();
            }}
          >
            Reintentar
          </button>
        </div>
      )}
      {!errorCarga && instructores === null && (
        <p className="inst-estado" role="status">
          Cargando instructores...
        </p>
      )}
      {!errorCarga && instructores?.length === 0 && (
        <p className="inst-estado">No hay instructores registrados.</p>
      )}
      {!!instructores?.length && (
        <ul className="inst-grid">
          {instructores.map((instructor) => {
            const dato = metricas[instructor.id_instructor];
            const valor = (leer: (m: MetricasInstructor) => string) =>
              dato === undefined ? "…" : dato === null ? "—" : leer(dato);
            return (
              <li className="inst-card" key={instructor.id_instructor}>
                <h2>{instructor.nombre}</h2>
                <p className="inst-especialidad">{instructor.especialidad}</p>
                <p className="inst-contacto">
                  <span aria-hidden="true">☎</span>{" "}
                  <a href={`tel:${instructor.telefono}`}>{instructor.telefono}</a>
                </p>
                <dl className="inst-metricas">
                  <div>
                    <dd>{valor((m) => String(m.estudiantes_asignados))}</dd>
                    <dt>Estudiantes</dt>
                  </div>
                  <div>
                    <dd>{valor((m) => `${formatoHoras.format(m.horas_impartidas)}h`)}</dd>
                    <dt>Horas impartidas</dt>
                  </div>
                </dl>
                {dato === null && <p className="inst-aviso">No se pudieron cargar las métricas.</p>}
                <div className="inst-acciones">
                  <button
                    type="button"
                    aria-label={`Editar a ${instructor.nombre}`}
                    onClick={() => {
                      abrirModal(instructor);
                    }}
                  >
                    EDITAR
                  </button>
                  <button
                    className="inst-eliminar"
                    type="button"
                    aria-label={`Eliminar a ${instructor.nombre}`}
                    onClick={() => {
                      void eliminar(instructor);
                    }}
                  >
                    ELIMINAR
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {modalAbierto && (
        <div className="modal-backdrop">
          <section
            aria-labelledby="inst-modal-titulo"
            aria-modal="true"
            className="student-modal"
            role="dialog"
          >
            <button
              aria-label="Cerrar"
              className="modal-close"
              type="button"
              onClick={() => {
                setEdicion(undefined);
              }}
            >
              ×
            </button>
            <p className="section-kicker">GESTIÓN</p>
            <h2 id="inst-modal-titulo">{edicion ? "EDITAR INSTRUCTOR" : "NUEVO INSTRUCTOR"}</h2>
            <form
              onSubmit={(event) => {
                void guardar(event);
              }}
            >
              {campo("nombre", "Nombre", 160)}
              {campo("especialidad", "Especialidad", 120)}
              {campo("telefono", "Teléfono", 30)}
              <ApiMessage error={errorModal} />
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setEdicion(undefined);
                  }}
                >
                  CANCELAR
                </button>
                <button className="primary-button" disabled={guardando} type="submit">
                  {guardando ? "GUARDANDO..." : "GUARDAR"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};
