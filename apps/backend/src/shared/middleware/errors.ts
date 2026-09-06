import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

// Manejo centralizado de errores (capa transversal).
export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: "Datos inválidos", detalles: error.flatten() });
    }
    app.log.error(error);
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    return reply.code(statusCode).send({ error: "Error interno" });
  });
};
