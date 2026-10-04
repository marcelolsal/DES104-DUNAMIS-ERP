import { useEffect, useSyncExternalStore } from "react";
import type { ReactElement } from "react";

import { AuthForm } from "../auth/AuthForm.js";
import "./landing.css";

const LOGIN_HASH = "#login";

// Contenido: solo lo respaldado por el repo. Titular y bajada salen del mockup
// docs/05-diseno-ui/assets/landing-hero.jpg; el proceso de inscripción (secretaría, abono,
// programación de clases), de docs/02-procesos/bpmn.md. El repo no define teléfono, correo,
// dirección ni testimonios, y aún no hay registro público: por eso el CTA de registro
// lleva a la sección Contacto, que explica cómo inscribirse sin datos inventados.

const secciones = ["Cursos", "Instructores", "Precios", "Testimonios", "Contacto"];

const cursos = [
  {
    titulo: "Clases prácticas programadas",
    texto: "Cada clase se agenda con un instructor y un vehículo asignados.",
  },
  {
    titulo: "Avance por horas",
    texto: "Tu progreso se mide contra el total de horas de tu paquete.",
  },
  {
    titulo: "Pagos por abonos",
    texto: "Puedes pagar tu paquete por abonos.",
  },
];

const especialidades = ["Ciudad", "Autopista", "Nocturno", "Automático", "Mecánico"];

// Paquetes del catálogo semilla (apps/backend/src/shared/db/seed-data/paquete.jsonl).
// ponytail: lista estática y sin importes; mostrar horas y precio reales cuando exista
// un endpoint público de paquetes (hoy /api/paquetes exige sesión).
const paquetes = ["Básico", "Estándar", "Intensivo", "Premium", "Express", "Fin de semana"];

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
        Cómo inscribirme
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
          Cómo inscribirme
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
      <h2 id="instructores-title">Instructores por especialidad</h2>
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
      <p>
        El precio depende del paquete y de sus horas de clase. Te lo detallamos al inscribirte y
        puedes pagarlo por abonos. La lista es informativa: la oferta vigente se confirma en la
        inscripción.
      </p>
      <ul className="landing-tags">
        {paquetes.map((paquete) => (
          <li key={paquete}>{paquete}</li>
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
      <h2 id="contacto-title">Cómo inscribirte</h2>
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
