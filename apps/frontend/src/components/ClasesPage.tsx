import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { ClaseAgenda, NuevoClase } from "@dunamis/contracts";
import { clasesApi } from "../api/clases.js";
import type { OpcionesClase } from "../api/clases.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";
import "../schedule.css";

const CLASS_MINUTES = 60;
const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 19;
const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const mondayOf = (date: Date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysFromMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysFromMonday);
  return monday;
};

const slotDateTime = (day: Date, hour: number) => {
  const slot = new Date(day);
  slot.setHours(hour, 0, 0, 0);
  return slot;
};

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const localDateTime = (date: Date) => `${dateKey(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
const isVehicleInMaintenance = (state: string) => state.toLowerCase() === "en_mantenimiento";
export const ClasesPage = () => {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [classes, setClasses] = useState<ClaseAgenda[]>([]);
  const [options, setOptions] = useState<OpcionesClase>({ alumnos: [], instructores: [], vehiculos: [] });
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

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [agenda, available] = await Promise.all([clasesApi.agenda(weekStart, weekEnd), clasesApi.opciones()]);
      setClasses(agenda);
      setOptions(available);
      setError(undefined);
    } catch (cause) {
      setError(mensajeDeError(cause));
    } finally {
      setLoading(false);
    }
  }, [weekEnd, weekStart]);

  useEffect(() => { void load(); }, [load]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const visibleClasses = classes.filter((item) => {
    const instructorMatches = filterInstructor === "todos" || String(item.id_instructor) === filterInstructor;
    const vehicleMatches = filterVehicle === "todos" || String(item.id_vehiculo) === filterVehicle;
    const stateMatches = filterState === "todas" || item.estado === filterState;
    const query = `${item.alumno_nombre} ${item.instructor_nombre} ${item.vehiculo_modelo} ${item.vehiculo_placa}`.toLowerCase();
    return instructorMatches && vehicleMatches && stateMatches && query.includes(search.toLowerCase());
  });

  const dateRange = `${new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short" }).format(weekStart)} — ${new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(weekEnd.getTime() - 1))}`;

  function openCreate(date = new Date()) {
    const initial = new Date(date);
    const nextHour = Math.ceil(initial.getMinutes() / 60) * 60;
    initial.setHours(initial.getHours() + Math.floor(nextHour / 60), nextHour % 60, 0, 0);
    if (initial.getHours() < 8) initial.setHours(8, 0, 0, 0);
    if (initial.getHours() > 18 || (initial.getHours() === 18 && initial.getMinutes() > 0)) {
      initial.setHours(18, 0, 0, 0);
    }
    setForm({
      id_alumno: options.alumnos[0]?.id ?? 0,
      id_instructor: options.instructores[0]?.id ?? 0,
      id_vehiculo: options.vehiculos.find((vehicle) => !isVehicleInMaintenance(vehicle.estado))?.id ?? options.vehiculos[0]?.id ?? 0,
      fecha_hora: initial,
      estado: "programada",
    });
    setError(undefined);
    setSuccess(undefined);
    setModalOpen(true);
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      await clasesApi.crear(form);
      setModalOpen(false);
      setSuccess("Clase programada correctamente.");
      await load();
    } catch (cause) {
      setError(mensajeDeError(cause));
    } finally {
      setSaving(false);
    }
  }

  function moveWeek(amount: number) {
    setWeekStart((current) => addDays(current, amount * 7));
  }

  return (
    <section className="schedule-page">
      <div className="schedule-heading">
        <div><p className="schedule-eyebrow">GESTIÓN ACADÉMICA</p><h1>PROGRAMACIÓN DE CLASES</h1><p className="schedule-subtitle">Agenda semanal · Asigna alumno, instructor y vehículo.</p></div>
        <button className="schedule-primary" onClick={() => { openCreate(); }} type="button">+ PROGRAMAR CLASE</button>
      </div>

      <div className="schedule-toolbar">
        <label>INSTRUCTOR<select onChange={(event) => { setFilterInstructor(event.target.value); }} value={filterInstructor}><option value="todos">Todos</option>{options.instructores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
        <label>VEHÍCULO<select onChange={(event) => { setFilterVehicle(event.target.value); }} value={filterVehicle}><option value="todos">Todos</option>{options.vehiculos.map((item) => <option key={item.id} value={item.id}>{item.placa} · {item.modelo}</option>)}</select></label>
        <label>ESTADO<select onChange={(event) => { setFilterState(event.target.value); }} value={filterState}><option value="todas">Todas</option><option value="programada">Programada</option><option value="impartida">Impartida</option><option value="cancelada">Cancelada</option></select></label>
        <label className="schedule-search">BUSCAR<input onChange={(event) => { setSearch(event.target.value); }} placeholder="Alumno, instructor o vehículo..." value={search} /></label>
      </div>

      <div className="schedule-controls">
        <div><h2>AGENDA SEMANAL</h2><button onClick={() => { setWeekStart(mondayOf(new Date())); }} type="button">HOY</button><button aria-label="Semana anterior" onClick={() => { moveWeek(-1); }} type="button">‹</button><button aria-label="Semana siguiente" onClick={() => { moveWeek(1); }} type="button">›</button><strong>{dateRange}</strong></div>
        <p>{loading ? "Cargando agenda..." : `${visibleClasses.length} clases`}</p>
      </div>

      {(error || success) && !modalOpen && <ApiMessage error={error} success={success} />}

      <div className="schedule-calendar-wrap">
        <div className="schedule-calendar">
          <div className="schedule-corner"><span>HORA</span></div>
          {days.map((day) => <div className={`schedule-day-head ${dateKey(day) === dateKey(new Date()) ? "today" : ""}`} key={dateKey(day)}><span>{new Intl.DateTimeFormat("es-SV", { weekday: "short" }).format(day).replace(".", "").toUpperCase()}</span><strong>{new Intl.DateTimeFormat("es-SV", { day: "2-digit", month: "short" }).format(day).toUpperCase()}</strong></div>)}
          {Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }, (_, rowIndex) => {
            const hour = CALENDAR_START_HOUR + rowIndex;
            return <div className="schedule-grid-row" key={hour}>
              <div className="schedule-time">{String(hour).padStart(2, "0")}:00</div>
              {days.map((day) => {
                const dayClasses = visibleClasses.filter((item) => {
                  const start = new Date(item.fecha_hora);
                  return dateKey(start) === dateKey(day) && start.getHours() === hour;
                });
                return <div className="schedule-slot" key={dateKey(day)} onClick={() => { openCreate(slotDateTime(day, hour)); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openCreate(slotDateTime(day, hour)); } }} role="button" tabIndex={0}>
                  {dayClasses.map((item) => <article aria-label={`${item.alumno_nombre}, ${item.instructor_nombre}, ${item.vehiculo_placa}`} className={`schedule-class ${item.estado}`} key={item.id_clase} onClick={(event) => { event.stopPropagation(); }}>
                    <strong>{new Intl.DateTimeFormat("es-SV", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(item.fecha_hora))} — {new Intl.DateTimeFormat("es-SV", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(new Date(item.fecha_hora).getTime() + CLASS_MINUTES * 60_000))}</strong>
                    <span>{item.alumno_nombre}</span><small>{item.instructor_nombre} · {item.vehiculo_placa}</small>
                  </article>)}
                </div>;
              })}
            </div>;
          })}
        </div>
      </div>

      {!loading && visibleClasses.length === 0 && <p className="schedule-empty">No hay clases para este rango y filtros. Selecciona una franja del calendario o usa “Programar clase”.</p>}
      <div className="schedule-legend"><span><i className="programada" />PROGRAMADA</span><span><i className="impartida" />IMPARTIDA</span><span><i className="cancelada" />CANCELADA</span><p>Duración: {CLASS_MINUTES} min · Los solapes de instructor o vehículo se validan al guardar.</p></div>

      {modalOpen && <div className="schedule-modal-backdrop"><section aria-labelledby="schedule-modal-title" className="schedule-modal">
        <button aria-label="Cerrar" className="schedule-modal-close" onClick={() => { setModalOpen(false); setError(undefined); }} type="button">×</button>
        <p className="schedule-eyebrow">NUEVA ASIGNACIÓN</p><h2 id="schedule-modal-title">PROGRAMAR CLASE</h2>
        {error && <ApiMessage error={error} />}
        <form onSubmit={createClass}>
          <label>ESTUDIANTE<select required onChange={(event) => { setForm({ ...form, id_alumno: Number(event.target.value) }); }} value={form.id_alumno || ""}><option disabled value="">Selecciona un estudiante</option>{options.alumnos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
          <label>INSTRUCTOR<select required onChange={(event) => { setForm({ ...form, id_instructor: Number(event.target.value) }); }} value={form.id_instructor || ""}><option disabled value="">Selecciona un instructor</option>{options.instructores.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {item.especialidad}</option>)}</select></label>
          <label>VEHÍCULO<select required onChange={(event) => { setForm({ ...form, id_vehiculo: Number(event.target.value) }); }} value={form.id_vehiculo || ""}><option disabled value="">Selecciona un vehículo</option>{options.vehiculos.map((item) => <option disabled={isVehicleInMaintenance(item.estado)} key={item.id} value={item.id}>{item.placa} · {item.modelo}{isVehicleInMaintenance(item.estado) ? " (Mantenimiento)" : ""}</option>)}</select></label>
          <label>FECHA Y HORA<input required onChange={(event) => { setForm({ ...form, fecha_hora: new Date(event.target.value) }); }} type="datetime-local" value={localDateTime(form.fecha_hora)} /></label>
          <div className="schedule-modal-actions"><button className="schedule-secondary" onClick={() => { setModalOpen(false); setError(undefined); }} type="button">CANCELAR</button><button className="schedule-primary" disabled={saving} type="submit">{saving ? "GUARDANDO..." : "GUARDAR CLASE"}</button></div>
        </form>
      </section></div>}
    </section>
  );
};
