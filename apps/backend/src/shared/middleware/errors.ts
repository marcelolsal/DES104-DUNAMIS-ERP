import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

// Manejo centralizado de errores (capa transversal).
export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: "Datos inválidos", detalles: error.flatten() });
    }
    app.log.error(error);
    return reply.code(error.statusCode ?? 500).send({ error: "Error interno" });
  });
};
