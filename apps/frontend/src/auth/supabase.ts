import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase Auth (ADR-0006): el frontend habla directo con Supabase
// SOLO para autenticación; los datos de negocio pasan por la API (Fastify).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
