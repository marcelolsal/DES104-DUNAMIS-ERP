# Despliegue

Pipeline de despliegue del ERP (issue #6). Tres plataformas, todas con plan
gratuito:

| Capa | Plataforma | Config en el repo |
|------|-----------|-------------------|
| Base de datos + Auth + Storage | **Supabase** (proyecto en la nube) | — (dashboard) |
| Backend / API | **Render** (Docker) | [`render.yaml`](../render.yaml) |
| Frontend | **Vercel** (Vite) | [`apps/frontend/vercel.json`](../apps/frontend/vercel.json) |

## Cómo se despliega: pipeline ordenado

Al mergear `develop → main`, el workflow
[`deploy.yml`](../.github/workflows/deploy.yml) corre **en orden estricto**
(fail-fast: si una etapa falla, las siguientes no corren):

```
1. migrate          → migraciones Drizzle contra Supabase prod
2. deploy-backend   → deploy en Render, espera a que quede "live"
3. deploy-frontend  → deploy en Vercel (producción)
4. close-milestones → cierra los milestones completos
```

Por eso el **auto-deploy de Render y Vercel está APAGADO** (`autoDeploy: false`
y `git.deploymentEnabled.main: false`): quien manda el orden es el workflow, no
el push. Los **previews** de Vercel para PRs a `develop` siguen activos.

## Secrets requeridos (GitHub → Settings → Secrets and variables → Actions)

| Secret | De dónde |
|--------|----------|
| `PROD_DATABASE_URL` | Supabase prod → Connection string |
| `RENDER_API_KEY` | Render → Account Settings → API Keys |
| `RENDER_SERVICE_ID` | Render → el servicio → id `srv-…` en la URL |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → `.vercel/project.json` tras `vercel link` (o Settings) |
| `VERCEL_PROJECT_ID` | idem |

## Puesta en marcha (una vez)

### 1. Supabase (producción)
1. [supabase.com](https://supabase.com) → **New project** (`dunamis-erp-prod`).
2. En **Storage**, crear el bucket `evidencias`.
3. Anotar de **Settings → API / Database**: `Project URL`, `service_role`,
   `JWT Secret`, `anon`, y el `Connection string`.
4. Aplicar las migraciones la primera vez (luego lo hace el workflow):
   ```bash
   DATABASE_URL="<connection string de prod>" pnpm db:migrate
   ```

### 2. Render (backend)
1. **New → Blueprint** → conectar este repo. Render lee `render.yaml` y crea
   `dunamis-api`.
2. Cargar las variables `sync: false` con los valores de Supabase prod.
3. Anotar el `RENDER_SERVICE_ID` y crear un `RENDER_API_KEY`.

### 3. Vercel (frontend)
1. **Add New → Project** → importar este repo. **Root Directory:**
   `apps/frontend`.
2. **Environment Variables:** `VITE_API_URL` (URL de Render), `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`.
3. `vercel link` local para obtener `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`, y crear
   un `VERCEL_TOKEN`.

### 4. GitHub
Cargar los 6 secrets de la tabla de arriba.

## Variables por entorno (resumen)

**Backend** (Render): `DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_BUCKET_EVIDENCIAS`.
Render inyecta `PORT`.

**Frontend** (Vercel): `VITE_API_URL`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`.

> 🔐 Ningún secreto se versiona. En local viven en `.env` (gitignoreado); en
> prod, en los paneles de Render/Vercel y en los Secrets de GitHub Actions.
