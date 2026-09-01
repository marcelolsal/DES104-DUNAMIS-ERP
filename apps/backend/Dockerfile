# Contexto de build = raíz del repo (workspace-aware).
#   docker build -f apps/backend/Dockerfile -t dunamis-api .
FROM node:22-slim
WORKDIR /repo
RUN corepack enable

COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile

WORKDIR /repo/apps/backend
EXPOSE 3000
CMD ["pnpm", "start"]
# ponytail: corre en prod vía tsx (sin paso de build). Si el arranque pesa,
# migrar a `pnpm deploy --prod` + bundle. YAGNI hasta que moleste.
