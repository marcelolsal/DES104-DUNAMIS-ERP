import { useEffect, useState } from "react";
import type { Alumno } from "@dunamis/contracts";
import { estudiantesApi } from "./api/estudiantes.js";
import { AuthForm } from "./auth/AuthForm.js";
import { supabase } from "./auth/supabase.js";
import type { Session } from "@supabase/supabase-js";

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthLoading(false);
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
    estudiantesApi.listar().then(setAlumnos).catch((e) => setError(String(e)));
  }, [session]);

  if (authLoading) return <main style={{ fontFamily: "system-ui", padding: 24 }}>Cargando sesión...</main>;
  if (!session) return <AuthForm />;

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError(logoutError.message);
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <header style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <h1>DUNAMIS ERP — Estudiantes</h1>
        <button onClick={handleLogout} type="button">Cerrar sesión</button>
      </header>
      <p>Sesión iniciada como {session.user.email}</p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <ul>
        {alumnos.map((a) => (
          <li key={a.id_alumno}>{a.nombre}</li>
        ))}
      </ul>
    </main>
  );
}
