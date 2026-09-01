import { z } from "zod";

// Valida el entorno al arrancar: si falta algo, el proceso falla claro y temprano.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_JWT_SECRET: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_EVIDENCIAS: z.string().min(1),
  PORT: z.coerce.number().default(3000),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
