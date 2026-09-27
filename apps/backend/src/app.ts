import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerErrorHandler } from "./shared/middleware/errors.js";
import { registerAuth } from "./shared/middleware/auth.js";
import { estudiantesRoutes } from "./modules/estudiantes/estudiantes.routes.js";
import { clasesRoutes } from "./modules/clases/clases.routes.js";

export const buildApp = () => {
  const app = Fastify({ logger: true });

  app.register(cors);
  registerErrorHandler(app);
  registerAuth(app); // auth global: todo endpoint exige JWT salvo PUBLIC_ROUTES

  app.get("/health", () => ({ status: "ok" }));

  // Un register por módulo. Copiar este patrón para pagos, clases, instructores, vehiculos.
  app.register(estudiantesRoutes, { prefix: "/api/estudiantes" });
  app.register(clasesRoutes, { prefix: "/api/clases" });

  return app;
};
