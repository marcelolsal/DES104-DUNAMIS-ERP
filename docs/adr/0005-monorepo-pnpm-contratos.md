# ADR-0005: Monorepo con pnpm workspaces y paquete de contratos compartido

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Decisores:** Arquitecto de Software, Frontend, Backend / DevOps

## Contexto

Frontend y backend comparten un contrato de datos definido con esquemas Zod
(ver [ADR-0003](0003-typescript-zod-contratos.md)). Si viven en repos separados,
esos contratos se duplican o hay que publicarlos como paquete npm versionado,
lo que añade fricción a cada cambio de contrato. Se busca que la separación
frontend/backend sea limpia sin duplicar el contrato.

## Decisión

El proyecto es un **monorepo gestionado con pnpm workspaces**:

```
repo/
├── apps/
│   ├── frontend/     # React
│   └── backend/      # Fastify
├── packages/
│   └── contracts/    # esquemas Zod + tipos inferidos, compartidos
├── pnpm-workspace.yaml
└── package.json
```

`packages/contracts` es la **fuente única del contrato** de la API: lo consumen
tanto el frontend como el backend por referencia de workspace, no por copia.

## Consecuencias

**Positivas**
- Un solo contrato tipado, compartido sin duplicar ni publicar paquetes.
- Un cambio de esquema se refleja de inmediato en ambos lados; el type-check
  detecta las incompatibilidades al instante.
- Frontend y backend siguen siendo **aplicaciones separadas** (cada una con su
  imagen Docker); el monorepo es organización de código, no acoplamiento en runtime.
- pnpm ahorra espacio y acelera instalaciones con su store de contenido.

**Negativas / costos**
- Configuración inicial de workspaces y de los scripts de build/deploy por app.
- El equipo debe entender el modelo de workspaces (qué paquete depende de cuál).

## Alternativas consideradas

- **Repos separados** — descartado: obliga a duplicar los contratos Zod o a
  publicarlos como paquete versionado, con fricción en cada cambio.
- **npm/yarn workspaces** — válidos; se elige pnpm por su store eficiente y su
  buen soporte de monorepos.
