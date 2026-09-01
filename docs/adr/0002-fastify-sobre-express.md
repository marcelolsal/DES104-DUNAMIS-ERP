# ADR-0002: Fastify como framework HTTP del backend

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Decisores:** Arquitecto de Software, Backend / DevOps

## Contexto

El diseño inicial contemplaba Node.js + Express para la API REST. Express es
correcto pero minimalista: no valida entradas, no tipa las rutas y su ecosistema
de middleware es antiguo. Se busca un backend **ligero pero eficiente** y con
buen soporte de TypeScript de cara al futuro.

## Decisión

Se usa **Fastify** como framework HTTP del backend, sobre Node.js.

## Consecuencias

**Positivas**
- Validación de entrada/salida por esquema integrada en el framework, que se
  integra con Zod (ver [ADR-0003](0003-typescript-zod-contratos.md)) y permite
  generar documentación OpenAPI a partir de los esquemas.
- Mejor rendimiento y menor overhead que Express.
- Soporte de TypeScript de primera clase (tipos oficiales, sin `@types` externos).
- Sistema de plugins con encapsulamiento, que encaja con la organización por
  módulos del backend.

**Negativas / costos**
- Menos familiar para el equipo que Express; curva de aprendizaje inicial.
- Ecosistema de middleware más pequeño (mitigado por los plugins oficiales de
  Fastify, que cubren CORS, auth, rate-limit, swagger, etc.).

## Alternativas consideradas

- **Express** — descartado por ser demasiado básico: sin validación ni tipado de
  rutas, ecosistema legado.
- **NestJS** — descartado por sobredimensionado para el alcance: demasiada
  estructura y ceremonia para un ERP pequeño.
