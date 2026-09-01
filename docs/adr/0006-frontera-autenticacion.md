# ADR-0006: Frontera de autenticación (Supabase Auth + verificación en Fastify)

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Decisores:** Arquitecto de Software, Backend / DevOps

## Contexto

Se usa Supabase Auth y no un módulo propio (ver
[ADR-0001](0001-supabase-plataforma-unica.md)), y la arquitectura define una
**API centralizada**: el frontend no accede directo a la base de datos. Hay que
fijar cómo fluye el token entre el frontend, Supabase y Fastify, y qué habla
cada quién con qué, para no romper esa centralización.

## Decisión

- **Login:** el frontend autentica contra **Supabase Auth** (SDK) y obtiene un
  **JWT**. Autenticación es lo único que el frontend habla directo con Supabase.
- **Llamadas de negocio:** el frontend manda el JWT como `Authorization: Bearer`
  a **Fastify**, que lo **verifica** en un middleware (capa transversal) usando
  el secreto/JWKS de Supabase antes de llegar a cualquier ruta.
- **Autorización por rol** (Admin / Secretaria) se resuelve en Fastify a partir
  de los claims del token.
- **Datos de negocio:** siempre pasan por Fastify. El frontend **no** consulta
  las tablas de negocio directo por el SDK de Supabase.
- **Auth global por defecto (secure-by-default):** la verificación del JWT se
  aplica con un hook `onRequest` global (`registerAuth`), de modo que **todo
  endpoint exige autenticación** sin declararlo por ruta. Las rutas públicas son
  una lista blanca explícita (`PUBLIC_ROUTES`, p. ej. `/health`). Exponer una
  ruta requiere un acto deliberado; olvidar la auth no deja nada abierto.

```
Frontend ──login──> Supabase Auth ──JWT──> Frontend
Frontend ──Bearer JWT──> Fastify (verifica + autoriza) ──> BD (Drizzle)
```

## Consecuencias

**Positivas**
- Se preserva la API centralizada: toda la lógica y los datos pasan por Fastify.
- No se implementa manejo de contraseñas ni emisión de tokens (lo hace Supabase).
- Un único punto de verificación y autorización, en la capa transversal.

**Negativas / costos**
- Fastify depende de la configuración de claves de Supabase para verificar el JWT.
- Si a futuro entra un tercer rol (p. ej. instructor), hay que extender la
  autorización; el modelo de claims lo soporta sin rediseño.

## Alternativas consideradas

- **Frontend habla directo con Supabase para datos (RLS)** — descartado: rompe la
  API centralizada y reparte la lógica de negocio entre RLS y el backend.
- **Módulo de auth propio en Fastify** — descartado en el ADR-0001.
