# 4. Diseño técnico y arquitectura

El sistema se desarrolla bajo un enfoque de **desarrollo desde cero**, con una
**arquitectura cliente-servidor de tres capas** y un backend organizado como
**monolito modular** (un solo despliegue, seccionado por módulo y por capa).

> Las decisiones técnicas concretas (framework, ORM, autenticación,
> almacenamiento, contenedores) están registradas y justificadas en los
> [ADR](../adr/). Este documento resume el resultado; el ADR es la fuente de
> verdad de cada decisión.

## 4.1 Diagrama de arquitectura

```
Usuario (Admin / Secretaria)
        │  HTTPS
        ▼
   Frontend — React + Vite            (capa de presentación · Vercel)
   · módulos + capa api/ (cliente REST)
        │                         └──► Supabase Auth  (login → JWT)
        │  REST + Bearer JWT
        ▼
   Backend — Fastify (API REST)       (capa de lógica de negocio · Render)
   · routes → controller → service → repository
   · shared: auth (verifica JWT) · validación (Zod) · errores
        ├──► PostgreSQL (Supabase) vía Drizzle   (capa de datos)
        └──► Amazon S3                            (evidencias: contratos, fotos)

   packages/contracts — esquemas Zod compartidos por frontend y backend
```

## 4.2 Capas

| Capa | Responsabilidad | Tecnología |
|------|-----------------|-----------|
| **Presentación** | Interfaz web que consume la API REST; login contra Supabase Auth. | React + Vite |
| **Lógica de negocio** | API REST centralizada, organizada en `routes → controller → service → repository` por módulo. | Fastify (Node.js + TypeScript) |
| **Datos** | Persistencia relacional (acceso vía Drizzle) y almacenamiento de evidencias. | PostgreSQL (Supabase) + Amazon S3 |

**Regla de dependencia interna:** dentro de cada módulo cada capa solo llama a la
de abajo. El `controller` no toca la BD; el `service` no ve `req`/`res`; solo el
`repository` conoce Drizzle y solo `storage/s3` conoce S3.

## 4.3 Stack tecnológico

| Componente | Tecnología / Servicio | Notas | ADR |
|------------|----------------------|-------|-----|
| Frontend | **React + Vite** | Consume la API REST vía HTTPS. Desplegado en **Vercel**. | — |
| Backend / API | **Fastify** (Node.js) | API REST centraliza la lógica de negocio. Desplegado en **Render**. | [0002](../adr/0002-fastify-sobre-express.md) |
| Lenguaje | **TypeScript** en todo el stack | Zod como fuente única de validación y tipos. | [0003](../adr/0003-typescript-zod-contratos.md) |
| Base de datos | **PostgreSQL** en **Supabase** | Servicio administrado; acceso vía **Drizzle ORM**. | [0001](../adr/0001-supabase-plataforma-unica.md) · [0004](../adr/0004-drizzle-acceso-a-datos.md) |
| Autenticación | **Supabase Auth** | Login → JWT verificado en Fastify. Sin módulo de auth propio. | [0001](../adr/0001-supabase-plataforma-unica.md) · [0006](../adr/0006-frontera-autenticacion.md) |
| Almacenamiento de evidencias | **Amazon S3** | Contratos digitalizados y fotos de vehículos. | [0007](../adr/0007-s3-almacenamiento-evidencias.md) |
| Estructura | **Monorepo** (pnpm workspaces) | `apps/frontend`, `apps/backend`, `packages/contracts`. | [0005](../adr/0005-monorepo-pnpm-contratos.md) |
| Despliegue | **Docker** (build/deploy); dev nativo | Una imagen por app; dev con `pnpm dev` + Supabase CLI. | [0008](../adr/0008-contenedores-despliegue.md) |

## 4.4 Decisiones de diseño

- **API REST centralizada:** un único backend concentra la lógica de negocio; el
  frontend no accede directamente a la base de datos. El frontend solo habla
  directo con Supabase para **autenticación**.
- **Autenticación por defecto:** todo endpoint exige JWT (verificado en Fastify);
  las rutas públicas son una lista blanca explícita — ver [ADR-0006](../adr/0006-frontera-autenticacion.md).
- **Contrato único (Zod):** los esquemas viven en `packages/contracts` y los
  comparten frontend y backend, sin duplicar tipos.
- **Base de datos administrada (Supabase):** evita mantener un servidor de BD
  propio.
- **Monolito modular:** un solo backend desplegable, seccionado por módulo de
  negocio; la lógica es la capa `service`, no un servicio aparte.
- **Despliegue en la nube:** frontend y backend en Vercel y Render, según el
  [presupuesto](../06-gestion-proyecto/presupuesto.md).

El **modelo de datos** se diseñó a partir de las necesidades priorizadas en la
entrevista, con siete entidades principales: Alumno, Paquete, Clase, Instructor,
Vehículo, Mantenimiento y Pago. Ver [Modelo de datos →](../04-modelo-datos/modelo-datos.md).

**Anterior:** [← Procesos BPMN](../02-procesos/bpmn.md) · **Siguiente:** [Modelo de datos →](../04-modelo-datos/modelo-datos.md)
