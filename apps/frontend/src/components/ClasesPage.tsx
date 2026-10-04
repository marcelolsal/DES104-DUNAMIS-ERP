import { useEffect, useMemo, useState } from "react";
import type { SyntheticEvent } from "react";
import type { NuevoClase } from "@dunamis/contracts";
import { addDays, enSemana, horasDeGrilla, mondayOf, siguienteFranja } from "../agenda.js";
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
  const [form, setForm] = useState<NuevoClase>({
    id_alumno: 0,
    id_instructor: 0,
    id_vehiculo: 0,
    fecha_hora: new Date(),
    estado: "programada",
  });

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

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setModalOpen(false);
      setError(undefined);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen]);

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

  const closeModal = () => {
    setModalOpen(false);
    setError(undefined);
  };

  // Sin fecha (botón "Programar clase") propone la siguiente franja futura;
  // desde una celda de la grilla respeta la franja elegida.
  const openCreate = (date = siguienteFranja(new Date())) => {
    setForm({
      id_alumno: options.alumnos[0]?.id ?? 0,
      id_instructor: options.instructores[0]?.id ?? 0,
      id_vehiculo: options.vehiculos.find((vehicle) => isVehicleAvailable(vehicle.estado))?.id ?? 0,
      fecha_hora: date,
      estado: "programada",
    });
    setError(undefined);
    setSuccess(undefined);
    setModalOpen(true);
  };

  const createClass = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      await clasesApi.crear(form);
      setModalOpen(false);
      setSuccess("Clase programada correctamente.");
      // Muestra la semana de la clase creada. Es un Date nuevo, así que el
      // efecto de la agenda recarga aunque sea la misma semana.
      setWeekStart(mondayOf(form.fecha_hora));
    } catch (cause) {
      setError(mensajeDeError(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="schedule-page">
      <div className="schedule-heading">
        <div>
          <p className="schedule-eyebrow">GESTIÓN ACADÉMICA</p>
          <h1>PROGRAMACIÓN DE CLASES</h1>
          <p className="schedule-subtitle">
            Agenda semanal · Asigna alumno, instructor y vehículo.
          </p>
        </div>
        <button
          className="schedule-primary"
          onClick={() => {
            openCreate();
          }}
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
                        aria-label={`${item.alumno_nombre}, ${item.instructor_nombre}, ${item.vehiculo_placa}`}
                        className={`schedule-class ${item.estado}`}
                        key={item.id_clase}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
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
        <div className="schedule-modal-backdrop">
          <section
            aria-labelledby="schedule-modal-title"
            aria-modal="true"
            className="schedule-modal"
            role="dialog"
          >
            <button
              aria-label="Cerrar"
              className="schedule-modal-close"
              onClick={closeModal}
              type="button"
            >
              ×
            </button>
            <p className="schedule-eyebrow">NUEVA ASIGNACIÓN</p>
            <h2 id="schedule-modal-title">PROGRAMAR CLASE</h2>
            {error && <ApiMessage error={error} />}
            <form
              onSubmit={(event) => {
                void createClass(event);
              }}
            >
              <label>
                ESTUDIANTE
                <select
                  autoFocus
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
                      {item.nombre}
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
                      disabled={!isVehicleAvailable(item.estado)}
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
                  CANCELAR
                </button>
                <button className="schedule-primary" disabled={saving} type="submit">
                  {saving ? "GUARDANDO..." : "GUARDAR CLASE"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};
