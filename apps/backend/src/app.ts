import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerErrorHandler } from "./shared/middleware/errors.js";
import { registerAuth } from "./shared/middleware/auth.js";
import { estudiantesRoutes } from "./modules/estudiantes/estudiantes.routes.js";
import { clasesRoutes } from "./modules/clases/clases.routes.js";
import { paquetesRoutes } from "./modules/paquetes/paquetes.routes.js";
import { vehiculosRoutes } from "./modules/vehiculos/vehiculos.routes.js";
import { mantenimientosRoutes } from "./modules/mantenimientos/mantenimientos.routes.js";
import { pagosRoutes } from "./modules/pagos/pagos.routes.js";
import { reportesRoutes } from "./modules/reportes/reportes.routes.js";

export const buildApp = () => {
  const app = Fastify({ logger: true });

  app.register(cors);
  registerErrorHandler(app);
  registerAuth(app); // auth global: todo endpoint exige JWT salvo PUBLIC_ROUTES

  app.get("/health", () => ({ status: "ok" }));

  // Un register por módulo. Copiar este patrón para pagos, clases, instructores, vehiculos.
  app.register(estudiantesRoutes, { prefix: "/api/estudiantes" });
  app.register(clasesRoutes, { prefix: "/api/clases" });
  app.register(paquetesRoutes, { prefix: "/api/paquetes" });
  app.register(vehiculosRoutes, { prefix: "/api/vehiculos" });
  app.register(mantenimientosRoutes, { prefix: "/api/mantenimientos" });
  app.register(pagosRoutes, { prefix: "/api/pagos" });
  app.register(reportesRoutes, { prefix: "/api/reportes" });

  return app;
};
