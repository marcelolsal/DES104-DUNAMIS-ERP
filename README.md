# DUNAMIS ERP — Sistema ERP para Autoescuela

Sistema ERP para la gestión de una autoescuela. Centraliza en un solo lugar la
información de alumnos, pagos, clases, instructores y vehículos, reemplazando los
contratos físicos, libros de pagos y grupos de WhatsApp que se usan actualmente.

## Objetivo

Pasar de una gestión basada en documentos físicos y canales de comunicación
dispersos a una plataforma web donde la información esté ordenada, relacionada y
disponible de forma inmediata. La prioridad inicial es la base de datos de
alumnos (datos, historial y progreso) y el control de pagos con reportes.

## Alcance (módulos)

- **Estudiantes** — inscripción, historial y progreso de clases.
- **Pagos** — abonos, cuentas por cobrar y reportes financieros.
- **Clases** — programación y asignación de instructor y vehículo.
- **Instructores** — datos, especialidad y carga de clases.
- **Vehículos** — estado, kilometraje y mantenimiento.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite (desplegado en Vercel) |
| Backend / API | Node.js + Fastify — API REST (desplegado en Render) |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth |
| Almacenamiento de archivos | Supabase Storage |

Monorepo pnpm (`apps/frontend`, `apps/backend`, `packages/contracts`).
Arquitectura cliente-servidor de tres capas. Más detalle en
[`docs/03-arquitectura/`](docs/03-arquitectura/diseno-tecnico.md) y las
decisiones en [`docs/adr/`](docs/adr/README.md).

## Puesta en marcha (desarrollo local)

### Requisitos
- **Node.js ≥ 22** y **pnpm** (`npm install -g pnpm`)
- **Docker** (con Docker Desktop corriendo)
- **Supabase CLI** (`brew install supabase/tap/supabase`)

### Pasos
```bash
# 1. Dependencias del monorepo
pnpm install

# 2. Levantar Supabase local (Postgres + Auth + Storage, dentro de Docker).
#    La primera vez descarga imágenes; puede tardar unos minutos.
supabase start

# 3. Crear el .env local (gitignoreado) y completarlo con los valores locales.
#    Los valores salen de `supabase status` (URL de la base, llaves, JWT secret).
#    Las llaves locales son idénticas en toda instalación de Supabase CLI.
cp .env.example .env

# 4. Aplicar las migraciones → crea las 7 tablas en la base local
pnpm db:migrate

# 5. Levantar front + back en paralelo
pnpm dev
```

Frontend en http://localhost:5173 · API en http://localhost:3000 · Supabase
Studio (panel de la base) en http://127.0.0.1:54323.

### Comandos útiles
| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | Frontend + backend en paralelo |
| `pnpm db:generate` | Genera una migración nueva a partir de `schema.ts` |
| `pnpm db:migrate` | Aplica las migraciones pendientes |
| `pnpm lint` / `pnpm typecheck` | Calidad de código |
| `supabase status` | URLs y llaves del stack local |
| `supabase stop` | Apaga el stack local |

### Flujo de trabajo (Git)
- Ramas: `feature/*` → PR → `develop` → (release) → `main`.
- `develop` y `main` protegidas: **PR con 1 aprobación**; a `develop` el merge es **squash**.
- En el PR que resuelve un issue, escribí **`Closes #N`**: al mergear a `develop` el issue se cierra solo y su tarjeta pasa a *Done*.

## Documentación

La documentación completa del proyecto (análisis, procesos BPMN, arquitectura,
modelo de datos, mockups, cronograma y presupuesto) está en
[`docs/`](docs/README.md).

## Equipo

Universidad Don Bosco — Facultad de Ingeniería · Desarrollo de Software Empresarial (DES104).

Kevin Argueta · Marcelo Leiva · Erick Chinchilla · Karla Flores · Edwin Portillo · Edmilson Martínez
