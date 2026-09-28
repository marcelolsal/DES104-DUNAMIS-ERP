import { useEffect, useState, type ReactNode } from "react";
import type { Alumno } from "@dunamis/contracts";
import { estudiantesApi } from "./api/estudiantes.js";
import { AuthForm } from "./auth/AuthForm.js";
import { supabase } from "./auth/supabase.js";
import type { Session } from "@supabase/supabase-js";
import { MantenimientosPanel } from "./components/MantenimientosPanel.js";
import { PaquetesPanel } from "./components/PaquetesPanel.js";
import { VehiculosPanel } from "./components/VehiculosPanel.js";
import "./app.css";

type Seccion = "estudiantes" | "paquetes" | "vehiculos" | "mantenimientos";

export const App = (): ReactNode => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [error, setError] = useState<string>();
  const [seccion, setSeccion] = useState<Seccion>("estudiantes");

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
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

  useEffect(() => {
    if (!session) return;
    void estudiantesApi.listar().then((lista) => {
      setAlumnos(lista);
    }).catch((errorDesconocido: unknown) => {
      setError(String(errorDesconocido));
    });
  }, [session]);

  if (authLoading) return <main style={{ fontFamily: "system-ui", padding: 24 }}>Cargando sesión...</main>;
  if (!session) return <AuthForm />;

  const handleLogout = async (): Promise<void> => {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError(logoutError.message);
  };

  return (
    <main className="app-page">
      <header className="app-header">
        <div>
          <h1>DUNAMIS ERP</h1>
          <p>Sesión iniciada como {session.user.email}</p>
        </div>
        <button onClick={() => { void handleLogout(); }} type="button">Cerrar sesión</button>
      </header>
      <nav className="tabs" aria-label="Módulos">
        {(["estudiantes", "paquetes", "vehiculos", "mantenimientos"] as Seccion[]).map((item) => (
          <button className={seccion === item ? "active" : undefined} key={item} type="button" onClick={() => { setSeccion(item); }}>
            {item[0]?.toUpperCase()}{item.slice(1)}
          </button>
        ))}
      </nav>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {seccion === "estudiantes" && (
        <section className="module-panel">
          <h2>Estudiantes</h2>
          <ul>{alumnos.map((a) => {
            return <li key={a.id_alumno}>{a.nombre}</li>;
          })}</ul>
        </section>
      )}
      {seccion === "paquetes" && <PaquetesPanel />}
      {seccion === "vehiculos" && <VehiculosPanel />}
      {seccion === "mantenimientos" && <MantenimientosPanel />}
    </main>
  );
};
