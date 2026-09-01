# ADR-0008: Docker para build/deploy, desarrollo nativo

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Decisores:** Arquitecto de Software, Backend / DevOps

## Contexto

El proyecto se despliega en la nube (frontend y backend) y se busca paridad
entre lo que corre en el servidor y lo que se prueba localmente. A la vez, el
equipo desarrolla en macOS, donde correr las apps dentro de contenedores con
bind-mounts degrada el hot-reload (HMR de Vite, watch de Fastify) sin aportar
nada al ciclo de desarrollo. Supabase, además, ya ofrece su stack local vía la
Supabase CLI (que gestiona sus propios contenedores).

## Decisión

- **Deploy: Docker.** Una imagen por app (`apps/frontend`, `apps/backend`),
  build multi-stage y consciente del workspace (contexto = raíz del repo). Es
  donde Docker aporta: reproducibilidad y paridad con producción.
- **Desarrollo: nativo.** El ciclo diario es `pnpm dev` (Vite + Fastify con
  watch), sin contenedores de las apps propias.
- **Supabase en dev:** Supabase CLI (`supabase start`, que corre en Docker por
  su cuenta) **o** un proyecto Supabase de desarrollo hosteado. No se
  conteneriza a mano la base.
- **`docker-compose.yml`** existe pero está **reservado a CI / smoke test**, no
  es el driver de desarrollo.
- **No hay contenedor de "capa de negocio".** El negocio es la capa `service`
  dentro del backend: **monolito modular, no microservicios**. Dos imágenes
  (frontend, backend); Supabase es gestionado.

## Consecuencias

**Positivas**
- Inner loop rápido en macOS (HMR nativo, sin bind-mounts lentos).
- Imágenes reproducibles para deploy, con paridad de producción.
- Menos piezas: dos contenedores, no una malla de servicios.

**Negativas / costos**
- Ligera divergencia entre el entorno de dev (nativo) y el de deploy (Docker);
  se mitiga con el `docker-compose.yml` de smoke test antes de publicar.

## Alternativas consideradas

- **Docker también en dev (compose como driver diario)** — descartado: en macOS
  ralentiza el hot-reload sin beneficio.
- **Un tercer contenedor para la lógica de negocio** — descartado: sería un
  monolito distribuido; la lógica vive en la capa `service` del backend.
