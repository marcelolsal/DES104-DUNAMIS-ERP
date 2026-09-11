import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno del frontend.",
  );
}

// Cliente de Supabase Auth (ADR-0006): el frontend habla directo con Supabase
// SOLO para autenticación; los datos de negocio pasan por la API (Fastify).
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);
