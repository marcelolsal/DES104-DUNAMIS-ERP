# Contexto de build = raíz del repo (workspace-aware).
#   docker build -f apps/frontend/Dockerfile -t dunamis-web .
FROM node:22-slim AS build
WORKDIR /repo
RUN corepack enable

COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/frontend ./apps/frontend

RUN pnpm install --frozen-lockfile
# Las VITE_* se inyectan en build; pasarlas con --build-arg en CI.
RUN pnpm --filter @dunamis/frontend build

FROM nginx:alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
