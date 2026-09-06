# Despliegue

Pipeline de despliegue del ERP (issue #6). Tres plataformas, todas con plan
gratuito:

| Capa | Plataforma | Config en el repo |
|------|-----------|-------------------|
| Base de datos + Auth + Storage | **Supabase** (proyecto en la nube) | — (dashboard) |
| Backend / API | **Render** (Docker) | [`render.yaml`](../render.yaml) |
| Frontend | **Vercel** (Vite) | [`apps/frontend/vercel.json`](../apps/frontend/vercel.json) |

Flujo: `develop` → PR → `main`. **`main` es producción**: al mergear, Render y
Vercel redepliegan solos. Cada PR a `develop` obtiene un **preview** automático
de Vercel.

## 1. Supabase (producción)

1. [supabase.com](https://supabase.com) → **New project** (`dunamis-erp-prod`).
   Guardar la contraseña de la base.
2. Aplicar las migraciones contra la base de la nube (una vez, y en cada cambio
   de schema):
   ```bash
   DATABASE_URL="<connection string de prod>" pnpm db:migrate
   ```
3. En **Storage**, crear el bucket `evidencias`.
4. Anotar de **Settings → API / Database**: `Project URL`, `service_role`,
   `JWT Secret`, `anon`, y el `Connection string`.

## 2. Render (backend)

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** →
   conectar este repo. Render lee [`render.yaml`](../render.yaml) y crea el
   servicio `dunamis-api`.
2. Cargar las variables marcadas `sync: false` con los valores de Supabase prod:
   `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_JWT_SECRET`.
3. Deploy. Verificar `https://<servicio>.onrender.com/health` → `{"status":"ok"}`.

## 3. Vercel (frontend)

1. [vercel.com](https://vercel.com) → **Add New → Project** → importar este repo.
2. **Root Directory:** `apps/frontend` (Vercel detecta el workspace pnpm e
   instala desde la raíz). Framework: Vite (auto).
3. **Environment Variables:**
   | Variable | Valor |
   |----------|-------|
   | `VITE_API_URL` | URL pública del backend en Render |
   | `VITE_SUPABASE_URL` | Project URL de Supabase prod |
   | `VITE_SUPABASE_ANON_KEY` | anon key de Supabase prod |
4. Deploy. Vercel da la URL de producción + un preview por cada PR.

## Variables por entorno (resumen)

**Backend** (Render): `DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_BUCKET_EVIDENCIAS`.
Render inyecta `PORT`.

**Frontend** (Vercel): `VITE_API_URL`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`.

> 🔐 Ningún secreto se versiona. En local viven en `.env` (gitignoreado); en
> prod, en los paneles de Render y Vercel.
