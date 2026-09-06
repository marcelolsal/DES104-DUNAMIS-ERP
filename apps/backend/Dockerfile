# Contexto de build = raíz del repo (workspace-aware).
#   docker build -f apps/backend/Dockerfile -t dunamis-api .
FROM node:22-slim
WORKDIR /repo
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/backend ./apps/backend

# ponytail: sin apps/frontend en la imagen, frozen-lockfile choca por importer
# faltante. --no-frozen-lockfile resuelve solo root+contracts+backend. Techo:
# reproducibilidad menor; subir a frozen + copiar manifests si molesta.
RUN pnpm install --no-frozen-lockfile

WORKDIR /repo/apps/backend
EXPOSE 3000
CMD ["pnpm", "start"]
# ponytail: corre en prod vía tsx (sin paso de build). Si el arranque pesa,
# migrar a `pnpm deploy --prod` + bundle. YAGNI hasta que moleste.
