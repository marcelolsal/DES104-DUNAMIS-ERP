# DUNAMIS ERP — Sistema ERP para Autoescuela

Sistema ERP web para la gestión de la **Autoescuela Dunamis**. Centraliza en un
solo lugar la información de estudiantes, paquetes, clases, instructores,
vehículos, mantenimientos y pagos, reemplazando los contratos físicos, el libro
de pagos y los grupos de WhatsApp con los que se operaba antes.

> Proyecto académico — Universidad Don Bosco, Facultad de Ingeniería ·
> Desarrollo de Software Empresarial (DES104).

## Índice

1. [Qué resuelve](#1-qué-resuelve)
2. [Cómo funciona la app](#2-cómo-funciona-la-app)
3. [Arquitectura](#3-arquitectura)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Frontend: módulos](#5-frontend-módulos)
6. [Backend: API REST](#6-backend-api-rest)
7. [Reglas de negocio clave](#7-reglas-de-negocio-clave)
8. [Puesta en marcha (desarrollo local)](#8-puesta-en-marcha-desarrollo-local)
9. [Pruebas y calidad](#9-pruebas-y-calidad)
10. [Despliegue](#10-despliegue)
11. [Flujo de trabajo (Git)](#11-flujo-de-trabajo-git)
12. [Documentación y equipo](#12-documentación-y-equipo)

---

## 1. Qué resuelve

| Antes (manual)                              | Con DUNAMIS ERP                                                  |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Contratos y fichas de alumnos en papel      | Registro de estudiantes con búsqueda, filtros y progreso por horas |
| Libro contable de pagos                     | Abonos, cuentas por cobrar y estados (pagado / pendiente / vencido) |
| Agenda de clases por WhatsApp               | Agenda semanal con validación de choques de instructor y vehículo |
| Fotos de odómetro enviadas al encargado     | Flota con kilometraje, estado e historial de mantenimientos      |
| Sin indicadores                             | Panel de KPIs financieros por periodo                            |

Usuarios: **secretaría** y **administración** de la autoescuela. Los visitantes
sin sesión solo ven una página pública informativa.

## 2. Cómo funciona la app

### Flujo general

```
Visitante ──► Landing pública ──► #login ──► Supabase Auth (correo + contraseña)
                                                   │ devuelve JWT
                                                   ▼
                     Panel administrativo (React) con pestañas por módulo
                                                   │ fetch + Authorization: Bearer <JWT>
                                                   ▼
                     API Fastify (/api/*) ──► valida JWT ──► valida body (Zod)
                                                   │
                                   controller ─► service (reglas) ─► repository (Drizzle)
                                                   │
                                                   ▼
                                        PostgreSQL (Supabase)
```

1. **Sin sesión** se muestra la landing (`apps/frontend/src/landing/Landing.tsx`).
   El botón **Admin** cambia el hash a `#login` y aparece el formulario.
2. **Login:** el frontend habla directo con **Supabase Auth** solo para
   autenticarse. No hay registro público: las cuentas se crean desde el panel de
   Supabase (Authentication → Add user).
3. **Con sesión** se muestra el panel con 8 pestañas (Estudiantes, Instructores,
   Paquetes, Vehículos, Mantenimientos, Clases, Pagos, Finanzas).
4. **Datos de negocio:** todo pasa por la API. La capa `src/api/client.ts` adjunta
   el JWT en cada request; si la API responde **401**, cierra la sesión y pide
   iniciar sesión de nuevo.
5. **La API** verifica el JWT en un hook global, valida el body con el esquema Zod
   compartido, aplica las reglas de negocio y responde JSON.

### Un ejemplo de punta a punta: el progreso de un estudiante

1. Secretaría inscribe a un estudiante en el paquete *Premium* (por ejemplo, 10 h).
2. Programa clases en la agenda; el backend rechaza cualquier choque de horario
   del instructor o del vehículo (**409 Solape**).
3. Cuando llega la hora de la clase, se marca **impartida**.
4. Cada clase impartida suma **1 hora** al estudiante. El listado calcula
   `progreso = horas_completadas / horas_totales`; al llegar a 100 % el estado
   pasa de **Activo** a **Graduado** automáticamente.
5. En paralelo, cada abono **pagado** descuenta del saldo
   (`precio del paquete − abonos pagados`), y los KPIs de Finanzas lo reflejan.

## 3. Arquitectura

### Stack

| Capa                 | Tecnología                                                         |
| -------------------- | ------------------------------------------------------------------ |
| Frontend             | React 19 + Vite + TypeScript (Vercel)                              |
| Backend / API        | Node.js 22 + Fastify + TypeScript (imagen Docker en Render)        |
| Contratos            | Zod, en el paquete compartido `@dunamis/contracts`                 |
| Acceso a datos       | Drizzle ORM + migraciones `drizzle-kit`                            |
| Base de datos        | PostgreSQL (Supabase)                                              |
| Autenticación        | Supabase Auth (JWT HS256 / ES256 / RS256)                          |
| Archivos             | Supabase Storage (adaptador listo para evidencias)                 |
| CI/CD                | GitHub Actions (deploy ordenado a producción)                      |

### Monorepo (pnpm workspaces)

```
DES104-DUNAMIS-ERP/
├── apps/
│   ├── frontend/          React + Vite
│   │   └── src/
│   │       ├── App.tsx            Shell: sesión, pestañas y módulo Estudiantes
│   │       ├── landing/           Página pública
│   │       ├── auth/              Cliente Supabase y formulario de login
│   │       ├── api/               Único lugar con fetch (un archivo por módulo)
│   │       ├── components/        Pantallas de cada módulo
│   │       └── *.ts               Lógica pura de UI (agenda, pagos, kpis, alumnos)
│   └── backend/           Fastify
│       └── src/
│           ├── app.ts             Registro de plugins, auth y rutas
│           ├── server.ts          Arranque (puerto PORT)
│           ├── modules/<modulo>/  routes → controller → service → repository
│           └── shared/            config, db (schema, seed, migraciones), middleware, storage
├── packages/contracts/    Esquemas Zod compartidos por front y back
├── supabase/              Config del stack local (Supabase CLI)
├── docs/                  Análisis, BPMN, arquitectura, ADRs, manual de usuario
└── .github/workflows/     Deploy a producción y automatización del roadmap
```

### Las 4 capas del backend

Cada módulo sigue el mismo patrón y cada capa solo llama a la de abajo:

| Capa           | Responsabilidad                                                          |
| -------------- | ------------------------------------------------------------------------ |
| `routes`       | Declara los endpoints y engancha `validateBody(schema)` como preHandler. |
| `controller`   | Traduce HTTP ↔ servicio: parsea params/query con Zod y fija el status (201, 204). |
| `service`      | Reglas de negocio. No conoce `req`/`res`; lanza errores con `statusCode`. |
| `repository`   | Única capa que toca la BD (Drizzle). Transacciones y bloqueos aquí.      |

### Contratos compartidos

`packages/contracts` define con Zod las entidades, los payloads de escritura y
las respuestas. El backend los usa para validar la **entrada** (400 si no cumple)
y, en reportes, también la **salida** (`parseSalida`: si la BD devuelve algo que
no cumple el contrato es un 500, no un error del cliente). El frontend importa
los mismos tipos, así que un cambio de contrato rompe la compilación en ambos lados.

### Seguridad

- **Auth global:** `registerAuth` (hook `onRequest`) exige `Authorization: Bearer <JWT>`
  en todas las rutas salvo `/health`. Verifica firma, `issuer` (`<SUPABASE_URL>/auth/v1`)
  y `audience` (`authenticated`). Acepta HS256 (secreto del proyecto) y ES256/RS256 (JWKS).
- **Rol:** se lee de `app_metadata.role` y queda en `req.user.role`
  (ADR-0006). La autorización por rol se decide en el backend, nunca en el frontend.
- **Errores:** 4xx devuelven `{ error }` con un mensaje legible; los 5xx se
  registran en el log y al cliente solo le llega `"Error interno"`.
- **service_role key** solo vive en el backend (adaptador de Storage).

Decisiones de diseño documentadas en [`docs/adr/`](docs/adr/README.md)
(Supabase, Fastify, Zod, Drizzle, monorepo, frontera de auth, almacenamiento, Docker).

## 4. Modelo de datos

Siete tablas en PostgreSQL (`apps/backend/src/shared/db/schema.ts`):

```
paquete 1───* alumno 1───* clase *───1 instructor
                 │            *
                 │            │
                 *            1
               pago        vehiculo 1───* mantenimiento
```

| Tabla           | Campos principales                                                          |
| --------------- | --------------------------------------------------------------------------- |
| `paquete`       | `id_paquete`, `nombre`, `total_horas`, `precio numeric(10,2)`               |
| `alumno`        | `id_alumno`, `nombre`, `dui`, `correo`, `telefono`, `contacto_emergencia`, `fecha_inscripcion date`, `id_paquete → paquete` |
| `instructor`    | `id_instructor`, `nombre`, `especialidad`, `telefono`, `fecha_ingreso date` (opcional) |
| `vehiculo`      | `id_vehiculo`, `placa` (**única**), `modelo`, `kilometraje`, `estado` (`activo` · `en_mantenimiento` · `baja`) |
| `clase`         | `id_clase`, `id_alumno`, `id_instructor`, `id_vehiculo`, `fecha_hora timestamp`, `estado` (`programada` · `impartida` · `cancelada`) |
| `mantenimiento` | `id_mantenimiento`, `id_vehiculo`, `fecha date`, `descripcion`, `costo numeric(10,2)` |
| `pago`          | `id_pago`, `id_alumno`, `monto numeric(10,2)`, `fecha date`, `metodo` (`efectivo` · `tarjeta` · `transferencia`), `estado` (`pagado` · `pendiente`) |

- **Dinero** en `numeric` (exacto). En el backend se suma en **centavos enteros**,
  nunca con floats.
- **Fechas de calendario** viajan como `YYYY-MM-DD` para no correr el día por UTC.
  "Hoy" siempre es el día en **El Salvador** (`America/El_Salvador`).
- **Datos derivados** (no se guardan): progreso y estado del estudiante, estado
  `vencido` de un pago, saldo por cobrar, métricas del instructor.
- Migraciones en `apps/backend/src/shared/db/migrations/` (`0000` esquema
  inicial, `0001` placa única, `0002` fecha de ingreso del instructor).

Detalle completo en [`docs/04-modelo-datos/`](docs/04-modelo-datos/modelo-datos.md).

## 5. Frontend: módulos

Una SPA sin router: `App.tsx` decide entre landing, login o panel según la
sesión, y dentro del panel muestra la pestaña elegida. Cada módulo tiene su
componente en `src/components/`, su cliente en `src/api/` y, cuando hay lógica
no trivial, un archivo puro testeable (`agenda.ts`, `pagos.ts`, `kpis.ts`,
`alumnos.ts`). El manual completo de uso está en
[`docs/manual-usuario.md`](docs/manual-usuario.md).

| Pestaña            | Componente(s)                                    | Qué hace |
| ------------------ | ------------------------------------------------ | -------- |
| **Landing**        | `landing/Landing.tsx`, `auth/AuthForm.tsx`       | Página pública fija (cursos, instructores, paquetes sin precio, contacto). `#login` muestra el formulario de acceso. |
| **Estudiantes**    | `App.tsx` (tabla + `StudentModal`)               | Lista con curso, instructor de la clase más reciente, barra de horas, estado (Activo/Graduado) y fecha de ingreso. Búsqueda por nombre/correo, filtro por estado, alta, edición y eliminación (solo sin clases ni pagos). Recarga al volver a la pestaña. |
| **Instructores**   | `InstructoresPanel.tsx`, `InstructorModal.tsx`   | Tarjetas con especialidad, teléfono, antigüedad ("Desde 2021") y métricas por instructor: estudiantes asignados y horas impartidas. CRUD con fecha de ingreso opcional y nunca futura. |
| **Paquetes**       | `PaquetesPanel.tsx`                              | Catálogo de cursos (nombre, horas, precio). CRUD; no se borra un paquete con alumnos. |
| **Vehículos**      | `VehiculosPanel.tsx`, `VehiculosListado.tsx`, `VehiculoModal.tsx`, `VehiculoDetalle.tsx`, `FlotaModal.tsx` | Flota con búsqueda por placa/modelo y filtro por estado. Detalle por vehículo con su historial de mantenimientos y alta de mantenimientos desde ahí. Placa en mayúsculas y única. |
| **Mantenimientos** | `MantenimientosPanel.tsx`, `MantenimientoModal.tsx` | Vista global de mantenimientos de toda la flota: crear, editar y eliminar. |
| **Clases**         | `ClasesPage.tsx`, lógica en `agenda.ts`          | Agenda semanal (lunes a domingo, 07:00–18:00, se amplía si hay clases fuera). Navegación por semanas, filtros por instructor/vehículo/estado y búsqueda. Clic en celda vacía = programar en esa hora. Cambios de estado según el ciclo de vida (ver §7). Vehículos no disponibles salen deshabilitados. |
| **Pagos**          | `PagosPage.tsx`, lógica en `pagos.ts`            | Abonos con filtros por estado y por estudiante; tabla de **cuentas por cobrar** con botón *Abonar*. El formulario muestra el saldo del estudiante en vivo. |
| **Finanzas**       | `KpisPanel.tsx`, lógica en `kpis.ts`             | KPIs por periodo (por defecto el mes en curso): total recaudado, pendiente de cobro, cobros vencidos; y al día de hoy: ingreso del día y saldo por cobrar. |

Piezas transversales:

- `api/client.ts`: único `fetch` de la app. Pone el JWT, traduce errores de red
  a español y convierte el 401 en cierre de sesión.
- `components/ApiMessage.tsx`: avisos de éxito/error, con los detalles de
  validación del backend (`campo: mensaje`).
- Estilos por módulo en archivos CSS planos (`students.css`, `schedule.css`,
  `pagos.css`, `vehiculos.css`, `kpis.css`), tema oscuro con acento naranja.

## 6. Backend: API REST

**Base URL:** `http://localhost:3000` en local · Render en producción.

**Convenciones comunes**

- Todas las rutas `/api/*` requieren `Authorization: Bearer <JWT de Supabase>`.
  Sin token → `401 {"error":"Token ausente"}`; token inválido → `401 {"error":"Token inválido"}`.
- Los cuerpos son JSON y se validan con el esquema Zod indicado. Si no cumplen →
  `400 {"error":"Datos inválidos","detalles":{...}}`.
- Los `:id` deben ser enteros positivos (en varios módulos solo dígitos y dentro de `int4`); si no → 400.
- Crear → **201** con el recurso; eliminar → **204** sin cuerpo; no existe → **404**;
  conflicto de negocio → **409**.
- Fechas de escritura: `YYYY-MM-DD`. Dinero: número con hasta 2 decimales.

### Salud

| Método | Ruta      | Auth | Descripción |
| ------ | --------- | ---- | ----------- |
| GET    | `/health` | No   | Health check para Render. Responde `{"status":"ok"}`. |

### Estudiantes — `/api/estudiantes`

Body de escritura (`nuevoAlumnoSchema`): `nombre`, `dui`, `correo` (email),
`telefono`, `contacto_emergencia`, `fecha_inscripcion` (`YYYY-MM-DD`), `id_paquete`.

| Método | Ruta         | Descripción |
| ------ | ------------ | ----------- |
| GET    | `/`          | Listado enriquecido: datos del alumno + `curso`, `instructor` (el de su clase más reciente o `null`), `horas_completadas` (clases impartidas, tope en las del paquete), `horas_totales`, `progreso` (0–100) y `estado` (`Activo` / `Graduado`). |
| GET    | `/paquetes`  | Paquetes disponibles para el selector de curso. |
| GET    | `/:id`       | Un alumno. 404 si no existe. |
| POST   | `/`          | Inscribe un alumno. 400 si el paquete no existe. |
| PUT    | `/:id`       | Reemplaza los datos del alumno. 404 / 400 (paquete inexistente). |
| DELETE | `/:id`       | Elimina. **409** si tiene clases o pagos asociados. |

### Paquetes — `/api/paquetes`

Body (`nuevoPaqueteSchema`): `nombre`, `total_horas` (entero ≥ 0), `precio` (≥ 0, 2 decimales).

| Método | Ruta   | Descripción |
| ------ | ------ | ----------- |
| GET    | `/`    | Lista los paquetes. |
| GET    | `/:id` | Un paquete. 404 si no existe. |
| POST   | `/`    | Crea un paquete. |
| PUT    | `/:id` | Actualiza un paquete. 404. |
| DELETE | `/:id` | Elimina. **409** si hay alumnos con ese paquete. |

### Instructores — `/api/instructores`

Body (`nuevoInstructorSchema`): `nombre`, `especialidad`, `telefono` (sin solo
espacios), `fecha_ingreso` opcional (`YYYY-MM-DD`, `null` la borra, **no futura** según El Salvador).

| Método | Ruta            | Descripción |
| ------ | --------------- | ----------- |
| GET    | `/`             | Lista los instructores. |
| GET    | `/:id`          | Un instructor. 404. |
| GET    | `/:id/metricas` | `{ id_instructor, horas_impartidas, estudiantes_asignados }`. Horas = clases impartidas × `CLASE_DURACION_MIN` / 60. Estudiantes = alumnos distintos con alguna clase no cancelada. |
| POST   | `/`             | Crea un instructor. |
| PUT    | `/:id`          | Actualiza. 404. |
| DELETE | `/:id`          | Elimina. **409** si tiene clases (de cualquier estado). |

### Vehículos — `/api/vehiculos`

Body (`nuevoVehiculoSchema`): `placa`, `modelo`, `kilometraje` (entero ≥ 0),
`estado` (`activo` · `en_mantenimiento` · `baja`).

| Método | Ruta   | Descripción |
| ------ | ------ | ----------- |
| GET    | `/`    | Lista la flota. |
| GET    | `/:id` | Un vehículo. 404. |
| POST   | `/`    | Registra un vehículo. **409** si la placa ya existe. |
| PUT    | `/:id` | Actualiza. 404 / **409** por placa duplicada. |
| DELETE | `/:id` | Elimina. **409** si tiene clases o mantenimientos (se recomienda marcarlo `baja`). |

### Mantenimientos — `/api/mantenimientos`

Body (`nuevoMantenimientoSchema`): `id_vehiculo`, `fecha` (`YYYY-MM-DD`),
`descripcion` (≤ 255), `costo` (≥ 0, 2 decimales).

| Método | Ruta   | Descripción |
| ------ | ------ | ----------- |
| GET    | `/`    | Lista todos. Con `?id_vehiculo=N` devuelve solo los de ese vehículo (historial). |
| GET    | `/:id` | Un mantenimiento. 404. |
| POST   | `/`    | Registra un mantenimiento. 404 si el vehículo no existe. |
| PUT    | `/:id` | Actualiza. 404 (mantenimiento o vehículo). |
| DELETE | `/:id` | Elimina. 404. |

### Clases — `/api/clases`

Body (`nuevoClaseSchema`): `id_alumno`, `id_instructor`, `id_vehiculo`,
`fecha_hora` (fecha-hora ISO), `estado` (`programada` por defecto · `impartida` · `cancelada`).

| Método | Ruta        | Descripción |
| ------ | ----------- | ----------- |
| GET    | `/agenda`   | `?desde=<ISO>&hasta=<ISO>`. Clases del rango con `alumno_nombre`, `instructor_nombre`, `vehiculo_modelo` y `vehiculo_placa`. 400 si el rango es inválido, `hasta ≤ desde` o supera **62 días**. |
| GET    | `/opciones` | Datos para los selectores del formulario: `alumnos`, `instructores`, `vehiculos` (con estado) y `duracion_min` configurada. |
| GET    | `/`         | Todas las clases (sin joins). |
| GET    | `/:id`      | Una clase. 404. |
| POST   | `/`         | Programa una clase. 400 si alguna referencia no existe o si se marca `impartida` antes de su hora; **409 Solape** si el instructor o el vehículo ya tienen clase en esa franja. |
| PUT    | `/:id`      | Edita la clase o cambia su estado. Mismas validaciones (excluye la propia clase del solape). 404. |
| DELETE | `/:id`      | Elimina definitivamente. 404. (Para dejar historial, mejor `cancelada`.) |

### Pagos — `/api/pagos`

Body (`nuevoPagoSchema`): `id_alumno`, `monto` (> 0, 2 decimales), `fecha`
(`YYYY-MM-DD`), `metodo` (`efectivo` · `tarjeta` · `transferencia`),
`estado` (`pagado` por defecto · `pendiente`; `vencido` no se escribe, se deriva).

| Método | Ruta                  | Descripción |
| ------ | --------------------- | ----------- |
| GET    | `/`                   | Abonos con `alumno` y `curso`. Filtros opcionales `?id_alumno=N` y `?estado=pagado\|pendiente\|vencido` (aplicado sobre el estado efectivo). |
| GET    | `/cuentas-por-cobrar` | Alumnos que aún deben: `precio`, `total_pagado`, `saldo_pendiente`, `estado` de la cuenta (`pendiente` o `vencido`). |
| GET    | `/saldo/:id`          | Saldo de **un alumno** (`:id` = `id_alumno`). 404 si no existe. |
| GET    | `/:id`                | Un abono con su estado efectivo. 404. |
| POST   | `/`                   | Registra un abono. 404 si el alumno no existe; **409** si el monto excede el saldo pendiente. |
| PUT    | `/:id`                | Edita un abono. Solo revalida el saldo si la edición **aumenta** lo pagado. 404 / 409. |
| DELETE | `/:id`                | Elimina un abono. 404. |

### Reportes — `/api/reportes`

| Método | Ruta          | Descripción |
| ------ | ------------- | ----------- |
| GET    | `/financiero` | `?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` (juntos, inclusivos, máx. **366 días**; sin ellos = todo el historial). Responde `total_recaudado`, `pendiente_de_cobro`, `cobros_vencidos` (del rango), `ingreso_del_dia` y `saldo_por_cobrar` (al día de `hoy`, independientes del rango), más `desde`, `hasta` y `hoy`. Sumas hechas en SQL con `numeric`. |

### Ejemplo con `curl`

```bash
# 1. Obtener un JWT de Supabase (local)
TOKEN=$(curl -s "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"<correo>","password":"<contraseña>"}' | jq -r .access_token)

# 2. Llamar a la API
curl -s http://localhost:3000/api/pagos/cuentas-por-cobrar -H "Authorization: Bearer $TOKEN"

curl -s -X POST http://localhost:3000/api/pagos -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id_alumno":1,"monto":50,"fecha":"2026-10-05","metodo":"efectivo"}'
```

## 7. Reglas de negocio clave

**Clases**
- Cada clase dura `CLASE_DURACION_MIN` minutos (60 por defecto) y ocupa la
  franja `[fecha_hora, fecha_hora + duración)`. Dos clases chocan si sus inicios
  distan menos que la duración.
- Un instructor o un vehículo no pueden tener dos clases no canceladas que
  choquen. La validación corre en una **transacción con `pg_advisory_xact_lock`**
  por instructor y por vehículo (siempre en ese orden para evitar interbloqueos),
  así dos requests simultáneos no pueden reservar la misma franja.
- Una clase **cancelada** no ocupa franja.
- Solo se puede marcar **impartida** una clase cuya hora de inicio ya pasó.
- Ciclo de vida en la UI: `programada → impartida | cancelada`, y ambas pueden
  **volver a programada** (se revalida el solape). Solo una clase programada se
  edita.

**Estudiantes**
- `horas_completadas` = clases impartidas (1 h cada una), con tope en las horas del paquete.
- `estado` = `Graduado` si el progreso llega a 100 %; si no, `Activo`.

**Pagos**
- `saldo = precio del paquete − Σ abonos pagados` (nunca negativo), en centavos.
- Un abono `pendiente` con fecha anterior a hoy (El Salvador) se muestra como
  **vencido**; una cuenta es `vencido` si debe y tiene algún abono vencido.
- Un abono no puede superar el saldo pendiente del alumno.

**Integridad referencial**
- No se elimina un paquete con alumnos, un alumno con clases/pagos, un instructor
  con clases ni un vehículo con clases/mantenimientos → **409**. Las violaciones
  de FK de Postgres (`23503`) y de unicidad (`23505`) se traducen a mensajes
  legibles en lugar de un 500.

## 8. Puesta en marcha (desarrollo local)

### Requisitos
- **Node.js ≥ 22** y **pnpm** (`npm install -g pnpm`)
- **Docker** (Docker Desktop corriendo)
- **Supabase CLI** (`brew install supabase/tap/supabase`)

### Pasos

```bash
# 1. Dependencias del monorepo
pnpm install

# 2. Supabase local (Postgres + Auth + Storage en Docker)
supabase start

# 3. Variables de entorno (archivos gitignoreados). Los valores salen de `supabase status`.
cp .env.example .env                                      # backend
cp apps/frontend/.env.example apps/frontend/.env.local    # frontend (Vite lee esta carpeta)

# 4. Crear las tablas
pnpm db:migrate

# 5. (Opcional) Datos de prueba: 200 alumnos, 1346 clases, 495 pagos, etc.
pnpm db:seed               # rellena solo lo que falta
pnpm db:seed -- --reset    # borra todo y vuelve a cargar

# 6. Crear un usuario para entrar: Studio → Authentication → Add user
#    (http://127.0.0.1:54323), con "Auto confirm user".

# 7. Front + back en paralelo
pnpm dev
```

| Servicio         | URL                     |
| ---------------- | ----------------------- |
| Frontend         | http://localhost:5173   |
| API              | http://localhost:3000   |
| Supabase Studio  | http://127.0.0.1:54323  |

### Variables de entorno

| Variable                    | Dónde    | Para qué |
| --------------------------- | -------- | -------- |
| `DATABASE_URL`              | backend  | Conexión a Postgres. |
| `SUPABASE_URL`              | backend  | Issuer del JWT y JWKS. |
| `SUPABASE_JWT_SECRET`       | backend  | Verificación de JWT HS256. |
| `SUPABASE_SERVICE_ROLE_KEY` | backend  | Acceso a Storage (solo servidor, secreta). |
| `SUPABASE_BUCKET_EVIDENCIAS`| backend  | Bucket de evidencias (default `evidencias`). |
| `PORT`                      | backend  | Puerto de la API (default 3000; Render lo inyecta). |
| `CLASE_DURACION_MIN`        | backend  | Duración de una clase en minutos (default 60). |
| `VITE_API_URL`              | frontend | URL base de la API. |
| `VITE_SUPABASE_URL`         | frontend | URL de Supabase para el login. |
| `VITE_SUPABASE_ANON_KEY`    | frontend | Llave pública (anon) de Supabase. |

El backend valida su entorno con Zod al arrancar: si falta algo, falla de
inmediato con un mensaje claro. El frontend lanza un error si faltan las
variables de Supabase (página en blanco con el error en consola).

### Comandos útiles

| Comando                         | Qué hace |
| ------------------------------- | -------- |
| `pnpm dev`                      | Frontend + backend en paralelo (`dev:web` / `dev:api` por separado) |
| `pnpm db:generate`              | Genera una migración nueva a partir de `schema.ts` |
| `pnpm db:migrate`               | Aplica las migraciones pendientes |
| `pnpm db:seed` / `db:seed:gen`  | Carga / regenera los fixtures JSONL de prueba |
| `pnpm lint` / `pnpm typecheck`  | Calidad de código |
| `pnpm build`                    | Build de todos los paquetes |
| `supabase status` / `stop`      | URLs y llaves del stack local / apagarlo |

## 9. Pruebas y calidad

Pruebas con el runner nativo de Node (`node --test`), sin frameworks extra:

```bash
pnpm --filter @dunamis/backend test    # lógica pura + pruebas contra la BD local
pnpm --filter @dunamis/frontend test   # lógica pura de agenda, pagos, KPIs y alumnos
```

| Área       | Archivos de prueba |
| ---------- | ------------------ |
| Clases     | `solape`, `rango-agenda`, `clases.db` (concurrencia y solapes contra Postgres) |
| Pagos      | `saldo`, `pagos` |
| Reportes   | `fechas`, `reportes`, `reportes.db` |
| Otros      | `instructores`, `metricas`, `estudiantes/eliminar`, `mantenimientos/contratos`, `entradas-invalidas` |
| Frontend   | `agenda`, `alumnos`, `kpis`, `pagos` |
| CI         | `.github/workflows/deploy-detect.test.mjs` (detección de cambios del deploy) |

Las pruebas `*.db.test.mjs` necesitan Supabase local corriendo. Convenciones de
código en [`docs/convenciones-codigo.md`](docs/convenciones-codigo.md).

## 10. Despliegue

| Pieza     | Plataforma | Config |
| --------- | ---------- | ------ |
| Frontend  | Vercel     | `apps/frontend/vercel.json` (SPA rewrite; auto-deploy de `main` apagado) |
| Backend   | Render     | `render.yaml` + `apps/backend/Dockerfile` (health check `/health`; auto-deploy apagado) |
| BD / Auth | Supabase   | Proyecto cloud de producción |

Al mergear `develop → main` corre **`.github/workflows/deploy.yml`**, un pipeline
ordenado y fail-fast:

1. **detect** — qué capas cambiaron respecto al commit previo de `main`.
2. **migrate** — migraciones Drizzle contra la BD de producción.
3. **deploy-backend** — deploy en Render y espera a que quede *live*.
4. **deploy-frontend** — build y deploy en Vercel.
5. **close-milestones** — cierra los milestones completados.

Las etapas sin cambios se saltan, y si una falla las siguientes no corren. Un
*Run workflow* manual desde `main` despliega todo. `docker-compose.yml` existe
solo para smoke tests; el desarrollo diario es nativo (ADR-0008). Más detalle en
[`docs/despliegue.md`](docs/despliegue.md).

## 11. Flujo de trabajo (Git)

- Ramas `feature/*` o `fix/*` desde `develop` → PR → `develop` (**squash**) →
  PR de release `develop → main` (**merge commit**) → deploy automático.
- `develop` y `main` protegidas con PR y 1 aprobación.
- En el PR que resuelve un issue, escribir **`Closes #N`**: al mergear el issue
  se cierra y su tarjeta pasa a *Done* (el workflow `roadmap-fechas.yml` registra
  las fechas en el Project).

## 12. Documentación y equipo

La documentación completa está en [`docs/`](docs/README.md): visión general,
procesos BPMN, diseño técnico, modelo de datos, mockups, cronograma, presupuesto,
ADRs, valor agregado y el [manual de usuario](docs/manual-usuario.md).

**Equipo** — Universidad Don Bosco, Facultad de Ingeniería · DES104

Kevin Argueta · Marcelo Leiva · Erick Chinchilla · Karla Flores · Edwin Portillo · Edmilson Martínez
