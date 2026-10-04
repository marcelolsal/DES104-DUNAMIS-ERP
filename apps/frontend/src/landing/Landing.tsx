import { useEffect, useSyncExternalStore } from "react";
import type { ReactElement } from "react";

import { AuthForm } from "../auth/AuthForm.js";
import "./landing.css";

const LOGIN_HASH = "#login";

const secciones = ["Cursos", "Instructores", "Precios", "Testimonios", "Contacto"];

const cursos = [
  {
    titulo: "Clases prácticas programadas",
    texto: "Cada clase se agenda con instructor y vehículo asignados, sin choques de horario.",
  },
  {
    titulo: "Avance por horas",
    texto: "Tu progreso se mide contra el total de horas de tu paquete y puedes consultarlo.",
  },
  {
    titulo: "Pagos por abonos",
    texto: "Cada abono queda registrado y tu saldo pendiente siempre está claro.",
  },
];

const especialidades = ["Ciudad", "Autopista", "Nocturno", "Automático", "Mecánico"];

// Mismo catálogo que apps/backend/src/shared/db/seed-data/paquete.jsonl.
const paquetes = [
  { nombre: "Básico", horas: 20, precio: 600 },
  { nombre: "Estándar", horas: 20, precio: 500 },
  { nombre: "Intensivo", horas: 15, precio: 250 },
  { nombre: "Premium", horas: 30, precio: 600 },
  { nombre: "Express", horas: 25, precio: 600 },
  { nombre: "Fin de semana", horas: 30, precio: 500 },
];

const suscribirHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
  };
};

// Vista para visitantes sin sesión: landing, o el login cuando el hash es #login.
export const VistaPublica = (): ReactElement => {
  const esLogin = useSyncExternalStore(suscribirHash, () => window.location.hash === LOGIN_HASH);
  // El login reemplaza a la landing: no debe heredar su posición de scroll.
  useEffect(() => {
    if (esLogin) window.scrollTo(0, 0);
  }, [esLogin]);
  if (!esLogin) return <Landing />;
  return (
    <>
      <a className="landing-volver" href="#inicio">
        <span aria-hidden="true">&larr;</span> Volver al inicio
      </a>
      <AuthForm />
    </>
  );
};

const Encabezado = () => (
  <header className="landing-header">
    <a className="landing-brand" href="#inicio" aria-label="Dunamis, inicio">
      <span className="landing-brand-mark" aria-hidden="true">
        D
      </span>
      DUNA<span className="landing-accent">MIS</span>
    </a>
    <nav className="landing-nav" aria-label="Secciones">
      {secciones.map((nombre) => (
        <a href={`#${nombre.toLowerCase()}`} key={nombre}>
          {nombre}
        </a>
      ))}
    </nav>
    <div className="landing-actions">
      <a className="landing-btn landing-btn--primary" href="#contacto">
        Regístrate
      </a>
      <a className="landing-btn" href={LOGIN_HASH}>
        Admin
      </a>
    </div>
  </header>
);

const Hero = () => (
  <section className="landing-hero" aria-labelledby="landing-title">
    <div className="landing-hero-text">
      <h1 id="landing-title">
        Tu camino <span className="landing-accent">inicia</span> aquí.
      </h1>
      <p>Instructores profesionales de alto nivel. Una buena conducción evita accidentes.</p>
      <div className="landing-hero-cta">
        <a className="landing-btn landing-btn--primary" href="#cursos">
          Explorar cursos
        </a>
        <a className="landing-btn" href="#contacto">
          Regístrate
        </a>
      </div>
    </div>
    <div className="landing-hero-art" aria-hidden="true" />
  </section>
);

const Secciones = () => (
  <>
    <section className="landing-section" id="cursos" aria-labelledby="cursos-title">
      <p className="landing-kicker">Cursos</p>
      <h2 id="cursos-title">Aprende a conducir con seguimiento real</h2>
      <ul className="landing-cards">
        {cursos.map((curso) => (
          <li key={curso.titulo}>
            <h3>{curso.titulo}</h3>
            <p>{curso.texto}</p>
          </li>
        ))}
      </ul>
    </section>
    <section className="landing-section" id="instructores" aria-labelledby="instructores-title">
      <p className="landing-kicker">Instructores</p>
      <h2 id="instructores-title">Un instructor para cada tipo de manejo</h2>
      <p>Nuestros instructores se especializan en:</p>
      <ul className="landing-tags">
        {especialidades.map((especialidad) => (
          <li key={especialidad}>{especialidad}</li>
        ))}
      </ul>
    </section>
    <section className="landing-section" id="precios" aria-labelledby="precios-title">
      <p className="landing-kicker">Precios</p>
      <h2 id="precios-title">Paquetes de clases</h2>
      <ul className="landing-cards">
        {paquetes.map((paquete) => (
          <li key={paquete.nombre}>
            <h3>{paquete.nombre}</h3>
            <p>{paquete.horas} horas de clase</p>
            <p className="landing-precio">${paquete.precio}</p>
          </li>
        ))}
      </ul>
    </section>
  </>
);

const Cierre = () => (
  <>
    <section className="landing-section" id="testimonios" aria-labelledby="testimonios-title">
      <p className="landing-kicker">Testimonios</p>
      <h2 id="testimonios-title">Lo que dicen nuestros alumnos</h2>
      <p>Pronto compartiremos aquí las experiencias de nuestros alumnos.</p>
    </section>
    <section className="landing-section" id="contacto" aria-labelledby="contacto-title">
      <p className="landing-kicker">Contacto</p>
      <h2 id="contacto-title">Inscríbete en Dunamis</h2>
      <p>
        La inscripción se realiza en la secretaría de la autoescuela: te explicamos los paquetes,
        registramos tus datos y tu primer abono, y programamos tus clases.
      </p>
    </section>
  </>
);

const Landing = () => (
  <div className="landing" id="inicio">
    <Encabezado />
    <main>
      <Hero />
      <Secciones />
      <Cierre />
    </main>
    <footer className="landing-footer">
      <span>Dunamis · Autoescuela</span>
      <a href={LOGIN_HASH}>Acceso administrativo</a>
    </footer>
  </div>
);
