import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { NuevoAlumno, Paquete, EstudianteListado } from "@dunamis/contracts";
import { estudiantesApi } from "./api/estudiantes.js";
import { VistaPublica } from "./landing/Landing.js";
import { supabase } from "./auth/supabase.js";
import type { Session } from "@supabase/supabase-js";
import { MantenimientosPanel } from "./components/MantenimientosPanel.js";
import { PaquetesPanel } from "./components/PaquetesPanel.js";
import { VehiculosPanel } from "./components/VehiculosPanel.js";
import "./app.css";
import "./students.css";

const emptyForm: NuevoAlumno = {
  nombre: "",
  dui: "",
  correo: "",
  telefono: "",
  contacto_emergencia: "",
  fecha_inscripcion: new Date(),
  id_paquete: 1,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-SV", { year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function formFromStudent(student: EstudianteListado): NuevoAlumno {
  return {
    ...emptyForm,
    nombre: student.nombre,
    dui: student.dui,
    correo: student.correo,
    telefono: student.telefono,
    contacto_emergencia: student.contacto_emergencia,
    id_paquete: student.id_paquete,
    fecha_inscripcion: new Date(`${student.fecha_inscripcion}T00:00:00`),
  };
}

type Seccion = "estudiantes" | "paquetes" | "vehiculos" | "mantenimientos";

export const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [students, setStudents] = useState<EstudianteListado[]>([]);
  const [packages, setPackages] = useState<Paquete[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [editing, setEditing] = useState<EstudianteListado>();
  const [form, setForm] = useState<NuevoAlumno>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [seccion, setSeccion] = useState<Seccion>("estudiantes");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthLoading(false);
    }).catch((_error: unknown) => {
      if (active) setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function loadStudents() {
    const [studentData, packageData] = await Promise.all([estudiantesApi.listar(), estudiantesApi.paquetes()]);
    setStudents(studentData);
    setPackages(packageData);
  }

  useEffect(() => {
    if (!session) return;
    loadStudents().catch((e: unknown) => setError(String(e)));
  }, [session]);

  function openCreate() {
    setEditing(undefined);
    setForm({ ...emptyForm, fecha_inscripcion: new Date() });
    setModalOpen(true);
    setError(undefined);
  }

  function openEdit(student: EstudianteListado) {
    setEditing(student);
    setForm(formFromStudent(student));
    setModalOpen(true);
    setError(undefined);
  }

  async function saveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      if (editing) await estudiantesApi.actualizar(editing.id_alumno, form);
      else await estudiantesApi.inscribir(form);
      await loadStudents();
      setModalOpen(false);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async (): Promise<void> => {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError(logoutError.message);
  };

  if (authLoading) return <main className="students-loading">Cargando sesión...</main>;
  if (!session) return <VistaPublica />;

  const visibleStudents = students.filter((student) => {
    const matchesSearch = `${student.nombre} ${student.correo}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "Todos" || student.estado === status);
  });

  return (
    <main className="students-page">
      <header className="students-topbar">
        <div className="students-logo"><span>D</span> DUNAMIS</div>
        <div className="students-user"><strong>{session.user.email}</strong><button onClick={handleLogout} type="button">Cerrar sesión</button></div>
      </header>
      <nav className="tabs" aria-label="Módulos">
        {(["estudiantes", "paquetes", "vehiculos", "mantenimientos"] as Seccion[]).map((item) => (
          <button className={seccion === item ? "active" : undefined} key={item} type="button" onClick={() => { setSeccion(item); }}>
            {item[0]?.toUpperCase()}{item.slice(1)}
          </button>
        ))}
      </nav>
      {seccion === "paquetes" && <PaquetesPanel />}
      {seccion === "vehiculos" && <VehiculosPanel />}
      {seccion === "mantenimientos" && <MantenimientosPanel />}
      {seccion === "estudiantes" && <section className="students-content">
        <div className="students-heading">
          <div><p className="section-kicker">GESTIÓN</p><h1>ESTUDIANTES</h1></div>
          <button className="primary-button" onClick={openCreate} type="button">+ NUEVO ESTUDIANTE</button>
        </div>
        <div className="students-toolbar">
          <input aria-label="Buscar estudiantes" onChange={(event) => { setSearch(event.target.value); }} placeholder="Buscar por nombre o email..." value={search} />
          <select aria-label="Filtrar por estado" onChange={(event) => { setStatus(event.target.value); }} value={status}>
            <option>Todos</option><option>Activo</option><option>Graduado</option>
          </select>
        </div>
        {error && <p className="students-error">{error}</p>}
        <div className="students-table-wrap">
          <table className="students-table">
            <thead><tr><th>NOMBRE</th><th>CURSO</th><th>INSTRUCTOR</th><th>HORAS</th><th>ESTADO</th><th>INGRESO</th><th aria-label="Acciones" /></tr></thead>
            <tbody>
              {visibleStudents.map((student) => (
                <tr key={student.id_alumno}>
                  <td><strong>{student.nombre}</strong><small>{student.correo}</small></td>
                  <td>{student.curso}</td>
                  <td>{student.instructor ?? "Sin asignar"}</td>
                  <td><div className="progress-cell"><span><i style={{ width: `${student.progreso}%` }} /></span>{student.horas_completadas}h</div></td>
                  <td><span className={`status-badge ${student.estado.toLowerCase()}`}>{student.estado.toUpperCase()}</span></td>
                  <td>{formatDate(student.fecha_inscripcion)}</td>
                  <td><button className="edit-button" onClick={() => { openEdit(student); }} type="button">EDITAR</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleStudents.length === 0 && <p className="empty-state">No hay estudiantes que coincidan con la búsqueda.</p>}
        </div>
      </section>}
      {modalOpen && <StudentModal editing={editing} form={form} loading={loading} packages={packages} onChange={setForm} onClose={() => { setModalOpen(false); }} onSubmit={saveStudent} />}
    </main>
  );
};

function StudentModal({ editing, form, loading, packages, onChange, onClose, onSubmit }: { editing?: EstudianteListado; form: NuevoAlumno; loading: boolean; packages: Paquete[]; onChange: (form: NuevoAlumno) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const update = (field: keyof NuevoAlumno, value: string | number | Date) => onChange({ ...form, [field]: value });
  return <div className="modal-backdrop"><section aria-labelledby="modal-title" className="student-modal">
    <button aria-label="Cerrar" className="modal-close" onClick={onClose} type="button">×</button>
    <p className="section-kicker">GESTIÓN</p><h2 id="modal-title">{editing ? "EDITAR ESTUDIANTE" : "NUEVO ESTUDIANTE"}</h2>
    <form onSubmit={onSubmit}>
      <label>Nombre<input required onChange={(event) => { update("nombre", event.target.value); }} value={form.nombre} /></label>
      <label>Correo<input required type="email" onChange={(event) => { update("correo", event.target.value); }} value={form.correo} /></label>
      <div className="form-grid"><label>DUI<input required onChange={(event) => { update("dui", event.target.value); }} value={form.dui} /></label><label>Teléfono<input required onChange={(event) => { update("telefono", event.target.value); }} value={form.telefono} /></label></div>
      <label>Contacto de emergencia<input required onChange={(event) => { update("contacto_emergencia", event.target.value); }} value={form.contacto_emergencia} /></label>
      <div className="form-grid"><label>Curso<select onChange={(event) => { update("id_paquete", Number(event.target.value)); }} value={form.id_paquete}>{packages.map((item) => <option key={item.id_paquete} value={item.id_paquete}>{item.nombre}</option>)}</select></label><label>Fecha de ingreso<input required onChange={(event) => { update("fecha_inscripcion", new Date(`${event.target.value}T00:00:00`)); }} type="date" value={form.fecha_inscripcion.toISOString().slice(0, 10)} /></label></div>
      <div className="modal-actions"><button className="secondary-button" onClick={onClose} type="button">CANCELAR</button><button className="primary-button" disabled={loading} type="submit">{loading ? "GUARDANDO..." : "GUARDAR"}</button></div>
    </form>
  </section></div>;
}
