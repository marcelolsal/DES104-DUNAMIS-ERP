# ADR-0004: Drizzle ORM como capa de acceso a datos

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Decisores:** Arquitecto de Software, Backend / DevOps

## Contexto

La capa `repository` del backend es la única que toca la base de datos (ver la
arquitectura en capas). Necesita una herramienta de acceso a datos que sea
TS-first, ligera y que no oscurezca el SQL, coherente con el objetivo de un
backend ligero pero eficiente. Supabase expone una PostgreSQL estándar, por lo
que el acceso no está obligado a pasar por el SDK de Supabase.

## Decisión

Se usa **Drizzle ORM** para la capa de acceso a datos. El esquema de la base se
define en TypeScript, las consultas son SQL-like y tipadas, y las migraciones se
versionan con `drizzle-kit`.

El SDK `supabase-js` se reserva para lo que es propio de la plataforma
(autenticación y Storage), **no** para el acceso a las tablas de negocio.

## Consecuencias

**Positivas**
- Consultas tipadas y explícitas, sin capa mágica ni engine binario (imagen
  Docker ligera).
- Tipos inferidos del esquema, en la misma línea que Zod (ver
  [ADR-0003](0003-typescript-zod-contratos.md)).
- Migraciones versionadas en el repo, revisables en PR.
- Al no acoplar el acceso a tablas al SDK de Supabase, un cambio de proveedor de
  PostgreSQL afecta solo a la configuración de conexión.

**Negativas / costos**
- Menos "automágico" que Prisma; hay que escribir el esquema y las consultas.
- Menos familiar para el equipo que un ORM de alto nivel.

## Alternativas consideradas

- **supabase-js para las tablas de negocio** — descartado: acopla el repository
  al SDK de Supabase y da menos control sobre el SQL.
- **Prisma** — descartado: engine binario y mayor peso en la imagen Docker;
  sobredimensionado para el alcance.
