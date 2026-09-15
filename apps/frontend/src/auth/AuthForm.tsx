import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./supabase.js";
import "./auth.css";

export const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) setError(authError.message);
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="auth-brand-mark">D</span>
          <span>DUNAMIS</span>
        </div>
        <p className="auth-eyebrow">PANEL ADMINISTRATIVO</p>
        <h1 id="auth-title">BIENVENIDO<br /><span>DE VUELTA.</span></h1>
        <p className="auth-description">Ingresa a tu cuenta para gestionar la operación de tu autoescuela.</p>
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            CORREO ELECTRONICO
            <input
              autoComplete="email"
              onChange={(event) => { setEmail(event.target.value); }}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            CONTRASENA
            <input
              autoComplete="current-password"
              onChange={(event) => { setPassword(event.target.value); }}
              required
              minLength={6}
              type="password"
              value={password}
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={loading} type="submit">
            {loading ? "INGRESANDO..." : "INICIAR SESION"}
            <span aria-hidden="true">-&gt;</span>
          </button>
        </form>
        <p className="auth-footer">DUNAMIS ERP <span>/</span> ACCESO SEGURO</p>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-art-glow" />
        <p>CONDUCE TU<br /><strong>FUTURO.</strong></p>
        <span className="auth-art-line" />
      </aside>
    </main>
  );
};
