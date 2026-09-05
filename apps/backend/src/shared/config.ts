import { z } from "zod";

// Valida el entorno al arrancar: si falta algo, el proceso falla claro y temprano.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  SUPABASE_BUCKET_EVIDENCIAS: z.string().min(1).default("evidencias"),
  PORT: z.coerce.number().default(3000),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
