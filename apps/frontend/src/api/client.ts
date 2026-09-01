import { supabase } from "../auth/supabase.js";

const BASE = import.meta.env.VITE_API_URL ?? "";

// Capa única de llamadas REST: adjunta el JWT de Supabase en cada request.
// Nadie fuera de src/api hace fetch suelto.
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}
