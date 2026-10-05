import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import type { Instructor, NuevoInstructor } from "@dunamis/contracts";
import { instructoresApi } from "../api/instructores.js";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";

// Al menos un carácter que no sea espacio: el backend recorta y rechaza vacíos.
const NO_VACIO = ".*\\S.*";

interface Props {
  // null = alta, Instructor = edición.
  instructor: Instructor | null;
  // Botón que abrió el modal: recibe el foco al cerrar.
  origen: HTMLElement | null;
  onClose: () => void;
  onSaved: (mensaje: string) => void;
}

type CampoTexto = "nombre" | "especialidad" | "telefono";

export const InstructorModal = ({ instructor, origen, onClose, onSaved }: Props): ReactNode => {
  const [formulario, setFormulario] = useState(() => ({
    nombre: instructor?.nombre ?? "",
    especialidad: instructor?.especialidad ?? "",
    telefono: instructor?.telefono ?? "",
    // La fecha llega a medianoche UTC: su parte de fecha en UTC es la de calendario.
    fecha_ingreso: instructor?.fecha_ingreso
      ? new Date(instructor.fecha_ingreso).toISOString().slice(0, 10)
      : "",
  }));
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);
  const dialogo = useRef<HTMLElement>(null);

  useEffect(() => {
    dialogo.current?.querySelector("input")?.focus();
    return () => {
      origen?.focus();
    };
  }, [origen]);

  useEffect(() => {
    const alPulsar = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !guardando) onClose();
      if (event.key !== "Tab" || !dialogo.current) return;
      // Tab cicla dentro del modal.
      const enfocables = [
        ...dialogo.current.querySelectorAll<HTMLElement>("input, button:not(:disabled)"),
      ];
      const primero = enfocables[0];
      const ultimo = enfocables.at(-1);
      const actual = document.activeElement;
      if (!dialogo.current.contains(actual) || (!event.shiftKey && actual === ultimo)) {
        event.preventDefault();
        primero?.focus();
      } else if (event.shiftKey && actual === primero) {
        event.preventDefault();
        ultimo?.focus();
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => {
      window.removeEventListener("keydown", alPulsar);
    };
  }, [onClose, guardando]);

  const guardar = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setGuardando(true);
    setError(undefined);
    const datos: NuevoInstructor = {
      nombre: formulario.nombre.trim(),
      especialidad: formulario.especialidad.trim(),
      telefono: formulario.telefono.trim(),
      fecha_ingreso: formulario.fecha_ingreso || null,
    };
    try {
      if (instructor) await instructoresApi.actualizar(instructor.id_instructor, datos);
      else await instructoresApi.crear(datos);
      onSaved(
        instructor ? "Instructor actualizado correctamente." : "Instructor creado correctamente.",
      );
    } catch (errorDesconocido) {
      setError(mensajeDeError(errorDesconocido));
      setGuardando(false);
    }
  };

  const campo = (nombre: CampoTexto, etiqueta: string, maximo: number) => (
    <label>
      {etiqueta}
      <input
        required
        maxLength={maximo}
        pattern={NO_VACIO}
        title="No puede estar vacío"
        type={nombre === "telefono" ? "tel" : "text"}
        value={formulario[nombre]}
        onChange={(event) => {
          setFormulario({ ...formulario, [nombre]: event.target.value });
        }}
      />
    </label>
  );

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="inst-modal-titulo"
        aria-modal="true"
        className="student-modal"
        ref={dialogo}
        role="dialog"
      >
        <button
          aria-label="Cerrar"
          className="modal-close"
          disabled={guardando}
          type="button"
          onClick={onClose}
        >
          ×
        </button>
        <p className="section-kicker">GESTIÓN</p>
        <h2 id="inst-modal-titulo">{instructor ? "EDITAR INSTRUCTOR" : "NUEVO INSTRUCTOR"}</h2>
        <form
          onSubmit={(event) => {
            void guardar(event);
          }}
        >
          {campo("nombre", "Nombre", 160)}
          {campo("especialidad", "Especialidad", 120)}
          {campo("telefono", "Teléfono", 30)}
          <label>
            Fecha de ingreso (opcional)
            <input
              max={new Date().toLocaleDateString("en-CA")}
              type="date"
              value={formulario.fecha_ingreso}
              onChange={(event) => {
                setFormulario({ ...formulario, fecha_ingreso: event.target.value });
              }}
            />
          </label>
          <ApiMessage error={error} />
          <div className="modal-actions">
            <button
              className="secondary-button"
              disabled={guardando}
              type="button"
              onClick={onClose}
            >
              CANCELAR
            </button>
            <button className="primary-button" disabled={guardando} type="submit">
              {guardando ? "GUARDANDO..." : "GUARDAR"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
