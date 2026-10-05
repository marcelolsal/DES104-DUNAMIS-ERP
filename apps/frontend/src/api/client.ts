import { supabase } from "../auth/supabase.js";

const configuredBase = (import.meta.env as { VITE_API_URL?: unknown }).VITE_API_URL;
const BASE = typeof configuredBase === "string" ? configuredBase : "";

// Capa única de llamadas REST: adjunta el JWT de Supabase en cada request.
// Nadie fuera de src/api hace fetch suelto.
export const api = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (init.body === undefined || init.body === null) headers.delete("Content-Type");
  else headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // fetch rechaza con TypeError en inglés ("Failed to fetch") si no hay red.
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
  }).catch((error: unknown) => {
    throw error instanceof TypeError ? new Error("No se pudo conectar con el servidor.") : error;
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new Error("La sesión expiró. Inicia sesión nuevamente.");
  }

  // Solo cuerpos JSON llegan al mensaje; un HTML de proxy (502, etc.) no se muestra.
  if (!res.ok) {
    const cuerpo = await res.text();
    const esJson = (res.headers.get("Content-Type") ?? "").includes("json");
    throw new Error(`API ${String(res.status)}: ${esJson ? cuerpo : "Error del servidor"}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
};
