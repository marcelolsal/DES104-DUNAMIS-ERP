import { useEffect, useState } from "react";
import type { Alumno } from "@dunamis/contracts";
import { estudiantesApi } from "./api/estudiantes.js";

export function App() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    estudiantesApi.listar().then(setAlumnos).catch((e) => setError(String(e)));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>DUNAMIS ERP — Estudiantes</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <ul>
        {alumnos.map((a) => (
          <li key={a.id_alumno}>{a.nombre}</li>
        ))}
      </ul>
    </main>
  );
}
