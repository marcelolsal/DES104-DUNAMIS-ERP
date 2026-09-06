import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

// Adaptador de almacenamiento de evidencias (Supabase Storage, ADR-0009).
// Único punto que conoce el proveedor de almacenamiento. Usa la service_role
// key (solo backend) para poder subir sin políticas RLS de por medio.
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// Sube una evidencia y devuelve su URL pública. La BD guarda esta URL, no el binario.
export const subirEvidencia = async (
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> => {
  const { error } = await supabase.storage
    .from(config.SUPABASE_BUCKET_EVIDENCIAS)
    .upload(key, body, { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage
    .from(config.SUPABASE_BUCKET_EVIDENCIAS)
    .getPublicUrl(key);
  return data.publicUrl;
};
