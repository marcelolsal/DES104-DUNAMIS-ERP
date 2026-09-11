import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

const supabaseAuth = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export interface AuthUser {
  sub: string;
  role?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

// Verifica el JWT emitido por Supabase Auth (ADR-0006).
export const requireAuth = async (req: FastifyRequest, reply: FastifyReply) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Token ausente" });
  }
  try {
    const { data, error } = await supabaseAuth.auth.getUser(header.slice(7));
    if (error || !data.user) {
      return reply.code(401).send({ error: "Token inválido" });
    }
    req.user = { sub: data.user.id, role: data.user.role };
  } catch {
    return reply.code(401).send({ error: "Token inválido" });
  }
};

// Rutas públicas: la ÚNICA excepción a la auth global. Ampliar con criterio.
const PUBLIC_ROUTES = new Set<string>(["/health"]);

// Auth global por defecto: TODO endpoint exige JWT salvo los de PUBLIC_ROUTES.
// Secure-by-default: exponer una ruta es un acto deliberado, no un olvido.
export const registerAuth = (app: FastifyInstance) => {
  app.addHook("onRequest", async (req, reply) => {
    const route = req.routeOptions.url ?? req.url;
    if (PUBLIC_ROUTES.has(route)) return;
    await requireAuth(req, reply);
  });
};
