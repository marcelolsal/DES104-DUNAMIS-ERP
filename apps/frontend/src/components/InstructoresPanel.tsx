import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Instructor } from "@dunamis/contracts";
import { instructoresApi, type MetricasInstructor } from "../api/instructores.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";
import { InstructorModal } from "./InstructorModal.js";
import "./instructores.css";

const formatoHoras = new Intl.NumberFormat("es-SV", { maximumFractionDigits: 1 });

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
  const [origenModal, setOrigenModal] = useState<HTMLElement | null>(null);
  const [eliminando, setEliminando] = useState<number>();
  const botonNuevo = useRef<HTMLButtonElement>(null);

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

  const recargar = () => {
    setMetricas({});
    setVersion((actual) => actual + 1);
  };

  const abrirModal = (instructor: Instructor | null, origen: HTMLElement) => {
    setEdicion(instructor);
    setOrigenModal(origen);
    setError(undefined);
    setSuccess(undefined);
  };
  const cerrarModal = useCallback(() => {
    setEdicion(undefined);
  }, []);

  const eliminar = async (instructor: Instructor) => {
    if (!window.confirm(`¿Eliminar al instructor “${instructor.nombre}”?`)) return;
    setError(undefined);
    setSuccess(undefined);
    setEliminando(instructor.id_instructor);
    try {
      await instructoresApi.eliminar(instructor.id_instructor);
      setSuccess("Instructor eliminado correctamente.");
      recargar();
    } catch (errorDesconocido) {
      setError(mensajeDeError(errorDesconocido));
      // Ya lo borró otra sesión: recargar quita la tarjeta fantasma.
      if (errorDesconocido instanceof Error && errorDesconocido.message.startsWith("API 404")) {
        recargar();
      }
    } finally {
      setEliminando(undefined);
      // La tarjeta puede desaparecer: el foco va a un lugar estable.
      botonNuevo.current?.focus();
    }
  };

  return (
    <section className="students-content">
      <div className="students-heading">
        <div>
          <p className="section-kicker">GESTIÓN</p>
          <h1>INSTRUCTORES</h1>
        </div>
        <button
          className="primary-button"
          ref={botonNuevo}
          type="button"
          onClick={(event) => {
            abrirModal(null, event.currentTarget);
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
      {!errorCarga && !!instructores?.length && (
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
                {instructor.fecha_ingreso && (
                  <p className="inst-contacto inst-antiguedad">
                    Desde {new Date(instructor.fecha_ingreso).getUTCFullYear()}
                  </p>
                )}
                <dl className="inst-metricas">
                  <div>
                    <dt>Estudiantes</dt>
                    <dd>{valor((m) => String(m.estudiantes_asignados))}</dd>
                  </div>
                  <div>
                    <dt>Horas impartidas</dt>
                    <dd>{valor((m) => `${formatoHoras.format(m.horas_impartidas)}h`)}</dd>
                  </div>
                </dl>
                {dato === null && <p className="inst-aviso">No se pudieron cargar las métricas.</p>}
                <div className="inst-acciones">
                  <button
                    type="button"
                    aria-label={`Editar a ${instructor.nombre}`}
                    onClick={(event) => {
                      abrirModal(instructor, event.currentTarget);
                    }}
                  >
                    EDITAR
                  </button>
                  <button
                    className="inst-eliminar"
                    disabled={eliminando === instructor.id_instructor}
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
      {edicion !== undefined && (
        <InstructorModal
          instructor={edicion}
          origen={origenModal}
          onClose={cerrarModal}
          onSaved={(mensaje) => {
            setSuccess(mensaje);
            setEdicion(undefined);
            recargar();
          }}
        />
      )}
    </section>
  );
};
