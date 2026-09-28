import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config.js";

const jwks = createRemoteJWKSet(
  new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
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

// Verifica el JWT emitido por Supabase Auth.
export const requireAuth = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Token ausente" });
  }

  try {
    const token = header.slice(7);

    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${config.SUPABASE_URL}/auth/v1`,
      audience: "authenticated",
    });

    const appMetadata = payload.app_metadata;

    const role =
      typeof appMetadata === "object" &&
      appMetadata !== null &&
      "role" in appMetadata
        ? appMetadata.role
        : undefined;

    req.user = {
      sub: String(payload.sub),
      ...(typeof role === "string" ? { role } : {}),
    };
  } catch (error) {
    console.error("Error verificando JWT:", error);

    return reply.code(401).send({
      error: "Token inválido",
    });
  }
};

// Rutas públicas.
const PUBLIC_ROUTES = new Set<string>(["/health"]);

// Auth global por defecto.
export const registerAuth = (app: FastifyInstance) => {
  app.addHook("onRequest", async (req, reply) => {
    const route = req.routeOptions.url ?? req.url;

    if (PUBLIC_ROUTES.has(route)) {
      return;
    }

    await requireAuth(req, reply);
  });
};