import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import { ApiMessage, mensajeDeError } from "./ApiMessage.js";

const useEscape = (alEscapar: () => void): void => {
  useEffect(() => {
    const alPulsar = (event: KeyboardEvent): void => {
      if (event.key === "Escape") alEscapar();
    };
    document.addEventListener("keydown", alPulsar);
    return () => {
      document.removeEventListener("keydown", alPulsar);
    };
  }, [alEscapar]);
};

const detener = (event: SyntheticEvent): void => {
  event.stopPropagation();
};

interface FlotaModalProps {
  etiqueta: string;
  titulo: string;
  textoGuardar: string;
  /** Si rechaza, el mensaje se muestra dentro del diálogo y este sigue abierto. */
  onGuardar: () => Promise<void>;
  onCerrar: () => void;
  children: ReactNode;
}

type EncabezadoProps = Pick<FlotaModalProps, "etiqueta" | "titulo" | "onCerrar">;

const Encabezado = ({ etiqueta, titulo, onCerrar }: EncabezadoProps): ReactNode => (
  <div className="fleet-modal-header">
    <div>
      <p className="fleet-eyebrow">{etiqueta}</p>
      <h3 id="fleet-modal-title">{titulo}</h3>
    </div>
    <button className="fleet-close" type="button" aria-label="Cerrar" onClick={onCerrar}>
      ×
    </button>
  </div>
);

// Marco común de los modales de flota: formulario, estado de guardado y su error.
export const FlotaModal = (props: FlotaModalProps): ReactNode => {
  const { etiqueta, titulo, textoGuardar, onGuardar, onCerrar, children } = props;
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();
  const cerrar = (): void => {
    if (!guardando) onCerrar();
  };
  useEscape(cerrar);

  const enviar = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setGuardando(true);
    setError(undefined);
    onGuardar()
      .catch((errorDesconocido: unknown) => {
        setError(mensajeDeError(errorDesconocido));
      })
      .finally(() => {
        setGuardando(false);
      });
  };

  return (
    <div className="fleet-modal-backdrop" role="presentation" onMouseDown={cerrar}>
      <div
        className="fleet-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fleet-modal-title"
        onMouseDown={detener}
      >
        <Encabezado etiqueta={etiqueta} titulo={titulo} onCerrar={cerrar} />
        <ApiMessage error={error} />
        <form className="fleet-form" onSubmit={enviar}>
          {children}
          <div className="fleet-form-actions">
            <button className="fleet-secondary" type="button" onClick={cerrar}>
              Cancelar
            </button>
            <button className="fleet-primary" disabled={guardando} type="submit">
              {guardando ? "Guardando..." : textoGuardar}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
