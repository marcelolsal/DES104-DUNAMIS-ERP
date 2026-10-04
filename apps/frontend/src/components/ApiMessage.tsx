interface ApiMessageProps {
  error?: string;
  success?: string;
}

export const ApiMessage = ({ error, success }: ApiMessageProps): React.JSX.Element => (
  <>
    {error && <p className="api-message api-message--error" role="alert">{error}</p>}
    {success && <p className="api-message api-message--success" role="status">{success}</p>}
  </>
);

export const mensajeDeError = (error: unknown): string => {
  if (!(error instanceof Error)) return "Ocurrió un error inesperado.";

  const cuerpo = /\{.*\}$/u.exec(error.message)?.[0];
  if (!cuerpo) return error.message;

  try {
    const respuesta: unknown = JSON.parse(cuerpo);
    if (typeof respuesta === "object" && respuesta !== null) {
      if ("message" in respuesta && typeof respuesta.message === "string") return respuesta.message;
      if ("error" in respuesta && typeof respuesta.error === "string") return respuesta.error;
    }
  } catch {
    return error.message;
  }

  return error.message;
};
