import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

// Manejo centralizado de errores (capa transversal).
export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: "Datos inválidos", detalles: error.flatten() });
    }
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    // Errores de negocio (4xx) llevan un mensaje útil para el cliente; los 5xx
    // se ocultan (no filtrar internos) y se loguean.
    if (statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({ error: (error as Error).message });
    }
    app.log.error(error);
    return reply.code(statusCode).send({ error: "Error interno" });
  });
};
