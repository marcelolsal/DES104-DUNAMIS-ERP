# Architecture Decision Records (ADR)

Registro de decisiones de arquitectura del proyecto. Cada ADR captura **una**
decisión: el contexto, la decisión tomada, sus consecuencias y las alternativas
descartadas. Son inmutables: si una decisión cambia, se crea un ADR nuevo que
*supersede* al anterior (no se reescribe la historia).

Formato: [MADR](https://adr.github.io/madr/) simplificado. Plantilla en
[`0000-template.md`](0000-template.md).

## Índice

| # | Decisión | Estado |
|---|----------|--------|
| [0001](0001-supabase-plataforma-unica.md) | Supabase para BD + Auth (+ Storage) | Aceptado |
| [0002](0002-fastify-sobre-express.md) | Fastify como framework HTTP del backend, en lugar de Express | Aceptado |
| [0003](0003-typescript-zod-contratos.md) | TypeScript en todo el stack y Zod como fuente única de validación y tipos | Aceptado |
| [0004](0004-drizzle-acceso-a-datos.md) | Drizzle ORM como capa de acceso a datos | Aceptado |
| [0005](0005-monorepo-pnpm-contratos.md) | Monorepo con pnpm workspaces y paquete de contratos compartido | Aceptado |
| [0006](0006-frontera-autenticacion.md) | Frontera de autenticación: Supabase Auth + verificación del JWT en Fastify | Aceptado |
| [0007](0007-s3-almacenamiento-evidencias.md) | Amazon S3 como almacenamiento externo de evidencias | ⛔ Reemplazado por 0009 |
| [0008](0008-contenedores-despliegue.md) | Docker para build/deploy, desarrollo nativo (monolito modular) | Aceptado |
| [0009](0009-supabase-storage-evidencias.md) | Supabase Storage para evidencias (reemplaza a 0007) | Aceptado |

## Pendientes por decidir

_Sin decisiones pendientes por ahora. Nuevas decisiones se agregan como ADR
siguiendo la [plantilla](0000-template.md)._
