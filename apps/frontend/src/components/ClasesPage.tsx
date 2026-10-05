import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import type { Clase, ClaseAgenda, NuevoClase } from "@dunamis/contracts";
import {
  addDays,
  enSemana,
  horasDeGrilla,
  mondayOf,
  siguienteFranja,
  transiciones,
} from "../agenda.js";
import { etiquetadorAlumnos } from "../alumnos.js";
import { clasesApi } from "../api/clases.js";
import type { OpcionesClase } from "../api/clases.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";
import "../schedule.css";

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) =>
  `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const localDateTime = (date: Date) =>
  `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
const slotDateTime = (day: Date, hour: number) => {
  const slot = new Date(day);
  slot.setHours(hour, 0, 0, 0);
  return slot;
};

const dayMonth = new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("es-SV", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const weekday = new Intl.DateTimeFormat("es-SV", { weekday: "short" });
const hourMinute = new Intl.DateTimeFormat("es-SV", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// Solo los vehículos activos se pueden asignar (ni en mantenimiento ni de baja).
const isVehicleAvailable = (state: string) => state === "activo";
const vehicleNote = (state: string) => {
  if (isVehicleAvailable(state)) return "";
  return state === "baja" ? " (Baja)" : " (Mantenimiento)";
};

const formDe = (clase: ClaseAgenda): NuevoClase => ({
  id_alumno: clase.id_alumno,
  id_instructor: clase.id_instructor,
  id_vehiculo: clase.id_vehiculo,
  fecha_hora: clase.fecha_hora,
  estado: clase.estado,
});

const ACCION: Record<Clase["estado"], { texto: string; exito: string }> = {
  impartida: { texto: "MARCAR IMPARTIDA", exito: "Clase marcada como impartida." },
  cancelada: { texto: "CANCELAR CLASE", exito: "Clase cancelada." },
  programada: { texto: "VOLVER A PROGRAMADA", exito: "La clase volvió a programada." },
};

const cuando = (clase: ClaseAgenda) =>
  `${clase.alumno_nombre} del ${dayMonth.format(clase.fecha_hora)} a las ${hourMinute.format(clase.fecha_hora)}`;

export const ClasesPage = () => {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof clasesApi.agenda>>>([]);
  const [options, setOptions] = useState<OpcionesClase>({
    alumnos: [],
    instructores: [],
    vehiculos: [],
    duracion_min: 60, // hasta que responda /opciones
  });
  const [filterInstructor, setFilterInstructor] = useState("todos");
  const [filterVehicle, setFilterVehicle] = useState("todos");
  const [filterState, setFilterState] = useState("todas");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string>();
  const [error, setError] = useState<string>();
  const [modalError, setModalError] = useState<string>();
  const [original, setOriginal] = useState<ClaseAgenda>(); // presente al editar
  const [form, setForm] = useState<NuevoClase>({
    id_alumno: 0,
    id_instructor: 0,
    id_vehiculo: 0,
    fecha_hora: new Date(),
    estado: "programada",
  });
  const dialogo = useRef<HTMLDialogElement>(null);
  const botonNuevo = useRef<HTMLButtonElement>(null);
  // `saving` llega tarde a un segundo click del mismo tick; el ref no.
  const enviando = useRef(false);
  // <dialog> nativo (como en Pagos): foco atrapado, Escape y foco de vuelta al
  // cerrar. Ref estable para no reabrirlo en cada render.
  const montarDialogo = useCallback((elemento: HTMLDialogElement | null) => {
    dialogo.current = elemento;
    if (!elemento || elemento.open) return;
    elemento.showModal();
    elemento.querySelector("select")?.focus();
  }, []);

  // Las opciones no dependen de la semana: se piden una sola vez.
  useEffect(() => {
    let cancelled = false;
    clasesApi
      .opciones()
      .then((available) => {
        if (!cancelled) setOptions(available);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(mensajeDeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Agenda de la semana. `cancelled` descarta respuestas de una semana que ya
  // no es la mostrada (cambios rápidos de semana llegan desordenados).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    clasesApi
      .agenda(weekStart, addDays(weekStart, 7))
      .then((agenda) => {
        if (cancelled) return;
        setClasses(agenda);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(mensajeDeError(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  // Solo las clases de la semana mostrada: fuera queda la que el backend trae
  // por el margen previo al lunes y, mientras carga, las de la semana anterior.
  const weekClasses = classes
    .map((item) => ({ ...item, fecha_hora: new Date(item.fecha_hora) }))
    .filter((item) => enSemana(item.fecha_hora, weekStart));
  const hours = horasDeGrilla(weekClasses.map((item) => item.fecha_hora));
  // Lo que se pinta y lo que se cuenta salen de esta misma lista.
  const visibleClasses = weekClasses.filter((item) => {
    const instructorMatches =
      filterInstructor === "todos" || String(item.id_instructor) === filterInstructor;
    const vehicleMatches = filterVehicle === "todos" || String(item.id_vehiculo) === filterVehicle;
    const stateMatches = filterState === "todas" || item.estado === filterState;
    const query =
      `${item.alumno_nombre} ${item.instructor_nombre} ${item.vehiculo_modelo} ${item.vehiculo_placa}`.toLowerCase();
    return (
      instructorMatches && vehicleMatches && stateMatches && query.includes(search.toLowerCase())
    );
  });

  const dateRange = `${dayMonth.format(weekStart)} — ${dayMonthYear.format(addDays(weekStart, 6))}`;
  const etiquetaAlumno = etiquetadorAlumnos(options.alumnos);

  // Cerrar siempre por close(): dispara onClose (desmonta) y restaura el foco.
  const closeModal = () => {
    dialogo.current?.close();
  };

  // Sin fecha (botón "Programar clase") propone la siguiente franja futura;
  // desde una celda de la grilla respeta la franja elegida.
  const openCreate = (date = siguienteFranja(new Date())) => {
    setOriginal(undefined);
    setForm({
      id_alumno: options.alumnos[0]?.id ?? 0,
      id_instructor: options.instructores[0]?.id ?? 0,
      id_vehiculo: options.vehiculos.find((vehicle) => isVehicleAvailable(vehicle.estado))?.id ?? 0,
      fecha_hora: date,
      estado: "programada",
    });
    setModalError(undefined);
    setSuccess(undefined);
    setModalOpen(true);
  };

  const openEdit = (clase: ClaseAgenda) => {
    setOriginal(clase);
    setForm(formDe(clase));
    setModalError(undefined);
    setSuccess(undefined);
    setModalOpen(true);
  };

  // Guardar, cambiar estado o eliminar: un envío a la vez; el error queda en el modal.
  const ejecutar = async (accion: () => Promise<unknown>, exito: string, semana: Date) => {
    if (enviando.current) return;
    enviando.current = true;
    setSaving(true);
    setModalError(undefined);
    try {
      await accion();
      closeModal();
      setSuccess(exito);
      // Muestra la semana de la clase. Es un Date nuevo, así que el efecto de
      // la agenda recarga aunque sea la misma semana.
      setWeekStart(mondayOf(semana));
    } catch (cause) {
      // Un doble Escape cierra el <dialog> aunque onCancel lo impida: el error va a la página.
      if (dialogo.current?.open) setModalError(mensajeDeError(cause));
      else setError(mensajeDeError(cause));
      // Otra sesión ya la borró: recargar quita el bloque fantasma.
      if (cause instanceof Error && cause.message.startsWith("API 404")) {
        setWeekStart((actual) => new Date(actual));
      }
    } finally {
      enviando.current = false;
      setSaving(false);
    }
  };

  const guardar = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ejecutar(
      () => (original ? clasesApi.actualizar(original.id_clase, form) : clasesApi.crear(form)),
      original ? "Clase actualizada." : "Clase programada correctamente.",
      form.fecha_hora,
    );
  };

  // Cambia solo el estado de lo guardado (no aplica ediciones sin guardar del formulario).
  const cambiarEstado = (clase: ClaseAgenda, estado: Clase["estado"]) => {
    if (enviando.current) return;
    if (estado === "cancelada" && !window.confirm(`¿Cancelar la clase de ${cuando(clase)}?`))
      return;
    const datos = { ...formDe(clase), estado };
    void ejecutar(
      () => clasesApi.actualizar(clase.id_clase, datos),
      ACCION[estado].exito,
      weekStart,
    );
  };

  const eliminar = (clase: ClaseAgenda) => {
    if (enviando.current) return;
    const pregunta = `¿Eliminar definitivamente la clase de ${cuando(clase)}? Para conservarla en el historial, mejor cancélala.`;
    if (!window.confirm(pregunta)) return;
    void ejecutar(() => clasesApi.eliminar(clase.id_clase), "Clase eliminada.", weekStart).finally(
      () => {
        // El bloque desaparece: el foco va a un lugar estable.
        if (!dialogo.current) botonNuevo.current?.focus();
      },
    );
  };

  return (
    <section className="schedule-page">
      <div className="schedule-heading">
        <div>
          <p className="schedule-eyebrow">GESTIÓN ACADÉMICA</p>
          <h1>PROGRAMACIÓN DE CLASES</h1>
          <p className="schedule-subtitle">
            Agenda semanal · Asigna alumno, instructor y vehículo. Toca una clase para editarla.
          </p>
        </div>
        <button
          className="schedule-primary"
          onClick={() => {
            openCreate();
          }}
          ref={botonNuevo}
          type="button"
        >
          + PROGRAMAR CLASE
        </button>
      </div>

      <div className="schedule-toolbar">
        <label>
          INSTRUCTOR
          <select
            onChange={(event) => {
              setFilterInstructor(event.target.value);
            }}
            value={filterInstructor}
          >
            <option value="todos">Todos</option>
            {options.instructores.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          VEHÍCULO
          <select
            onChange={(event) => {
              setFilterVehicle(event.target.value);
            }}
            value={filterVehicle}
          >
            <option value="todos">Todos</option>
            {options.vehiculos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.placa} · {item.modelo}
              </option>
            ))}
          </select>
        </label>
        <label>
          ESTADO
          <select
            onChange={(event) => {
              setFilterState(event.target.value);
            }}
            value={filterState}
          >
            <option value="todas">Todas</option>
            <option value="programada">Programada</option>
            <option value="impartida">Impartida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </label>
        <label className="schedule-search">
          BUSCAR
          <input
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Alumno, instructor o vehículo..."
            value={search}
          />
        </label>
      </div>

      <div className="schedule-controls">
        <div>
          <h2>AGENDA SEMANAL</h2>
          <button
            onClick={() => {
              setWeekStart(mondayOf(new Date()));
            }}
            type="button"
          >
            HOY
          </button>
          <button
            aria-label="Semana anterior"
            onClick={() => {
              setWeekStart((current) => addDays(current, -7));
            }}
            type="button"
          >
            ‹
          </button>
          <button
            aria-label="Semana siguiente"
            onClick={() => {
              setWeekStart((current) => addDays(current, 7));
            }}
            type="button"
          >
            ›
          </button>
          <strong>{dateRange}</strong>
        </div>
        <p>{loading ? "Cargando agenda..." : `${String(visibleClasses.length)} clases`}</p>
      </div>

      {(error ?? success) && !modalOpen && <ApiMessage error={error} success={success} />}

      <div className="schedule-calendar-wrap">
        <div className="schedule-calendar">
          <div className="schedule-corner">
            <span>HORA</span>
          </div>
          {days.map((day) => (
            <div
              className={`schedule-day-head ${dateKey(day) === dateKey(new Date()) ? "today" : ""}`}
              key={dateKey(day)}
            >
              <span>{weekday.format(day).replace(".", "").toUpperCase()}</span>
              <strong>{dayMonth.format(day).toUpperCase()}</strong>
            </div>
          ))}
          {hours.map((hour) => (
            <div className="schedule-grid-row" key={hour}>
              <div className="schedule-time">{pad(hour)}:00</div>
              {days.map((day) => (
                <div
                  className="schedule-slot"
                  key={dateKey(day)}
                  onClick={() => {
                    openCreate(slotDateTime(day, hour));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openCreate(slotDateTime(day, hour));
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {visibleClasses
                    .filter(
                      (item) =>
                        dateKey(item.fecha_hora) === dateKey(day) &&
                        item.fecha_hora.getHours() === hour,
                    )
                    .map((item) => (
                      <article
                        aria-label={`${item.alumno_nombre}, ${item.instructor_nombre}, ${item.vehiculo_placa}, ${item.estado}`}
                        className={`schedule-class ${item.estado}`}
                        key={item.id_clase}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(item);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          event.stopPropagation();
                          openEdit(item);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <strong>
                          {hourMinute.format(item.fecha_hora)} —{" "}
                          {hourMinute.format(
                            new Date(item.fecha_hora.getTime() + options.duracion_min * 60_000),
                          )}
                        </strong>
                        <span>{item.alumno_nombre}</span>
                        <small>
                          {item.instructor_nombre} · {item.vehiculo_placa}
                        </small>
                      </article>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {!loading && visibleClasses.length === 0 && (
        <p className="schedule-empty">
          No hay clases para este rango y filtros. Selecciona una franja del calendario o usa
          “Programar clase”.
        </p>
      )}
      <div className="schedule-legend">
        <span>
          <i className="programada" />
          PROGRAMADA
        </span>
        <span>
          <i className="impartida" />
          IMPARTIDA
        </span>
        <span>
          <i className="cancelada" />
          CANCELADA
        </span>
        <p>
          Duración: {options.duracion_min} min · Los solapes de instructor o vehículo se validan al
          guardar.
        </p>
      </div>

      {modalOpen && (
        <dialog
          aria-labelledby="schedule-modal-title"
          aria-modal="true"
          className="schedule-modal"
          onCancel={(event) => {
            if (enviando.current) event.preventDefault();
          }}
          onClose={() => {
            setModalOpen(false);
          }}
          ref={montarDialogo}
        >
          <button
            aria-label="Cerrar"
            className="schedule-modal-close"
            onClick={closeModal}
            type="button"
          >
            ×
          </button>
          <p className="schedule-eyebrow">
            {original ? `CLASE ${original.estado.toUpperCase()}` : "NUEVA ASIGNACIÓN"}
          </p>
          <h2 id="schedule-modal-title">{original ? "EDITAR CLASE" : "PROGRAMAR CLASE"}</h2>
          <ApiMessage error={modalError} />
          {original && (
            <div className="schedule-modal-estado">
              {transiciones(original.estado, original.fecha_hora, new Date()).map((estado) => (
                <button
                  className="schedule-secondary"
                  key={estado}
                  onClick={() => {
                    cambiarEstado(original, estado);
                  }}
                  type="button"
                >
                  {ACCION[estado].texto}
                </button>
              ))}
              <button
                className="schedule-secondary danger"
                onClick={() => {
                  eliminar(original);
                }}
                type="button"
              >
                ELIMINAR
              </button>
              {original.estado === "programada" && original.fecha_hora > new Date() && (
                <p>Se podrá marcar como impartida cuando llegue su hora.</p>
              )}
            </div>
          )}
          <form onSubmit={guardar}>
            <label>
              ESTUDIANTE
              <select
                required
                onChange={(event) => {
                  setForm({ ...form, id_alumno: Number(event.target.value) });
                }}
                value={form.id_alumno || ""}
              >
                <option disabled value="">
                  Selecciona un estudiante
                </option>
                {options.alumnos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {etiquetaAlumno(item)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              INSTRUCTOR
              <select
                required
                onChange={(event) => {
                  setForm({ ...form, id_instructor: Number(event.target.value) });
                }}
                value={form.id_instructor || ""}
              >
                <option disabled value="">
                  Selecciona un instructor
                </option>
                {options.instructores.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre} · {item.especialidad}
                  </option>
                ))}
              </select>
            </label>
            <label>
              VEHÍCULO
              <select
                required
                onChange={(event) => {
                  setForm({ ...form, id_vehiculo: Number(event.target.value) });
                }}
                value={form.id_vehiculo || ""}
              >
                <option disabled value="">
                  Selecciona un vehículo
                </option>
                {options.vehiculos.map((item) => (
                  <option
                    // Al editar se conserva el vehículo ya asignado aunque ya no esté activo.
                    disabled={!isVehicleAvailable(item.estado) && item.id !== original?.id_vehiculo}
                    key={item.id}
                    value={item.id}
                  >
                    {item.placa} · {item.modelo}
                    {vehicleNote(item.estado)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              FECHA Y HORA
              <input
                required
                onChange={(event) => {
                  setForm({ ...form, fecha_hora: new Date(event.target.value) });
                }}
                type="datetime-local"
                value={localDateTime(form.fecha_hora)}
              />
            </label>
            <div className="schedule-modal-actions">
              <button className="schedule-secondary" onClick={closeModal} type="button">
                {original ? "CERRAR" : "CANCELAR"}
              </button>
              {/* aria-disabled, no disabled: un botón deshabilitado pierde el foco y
                  close() ya no lo devuelve. El doble envío lo frena `enviando`. */}
              <button aria-disabled={saving} className="schedule-primary" type="submit">
                {saving ? "GUARDANDO..." : "GUARDAR CLASE"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
};
