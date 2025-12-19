# Dockerfile
# =========================
# Base with pnpm + turbo
# =========================
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm" CI=1
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache bash git dumb-init && \
    corepack enable && corepack prepare pnpm@9.12.0 --activate && \
    npm i -g turbo
WORKDIR /app

# =========================
# Prune for web + api
# =========================
FROM base AS pruner
COPY turbo.json package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps
# prunear ambos para un solo build context eficiente
RUN turbo prune --scope=@repo/web --scope=@repo/api --docker

# =========================
# Install deps (pruned)
# =========================
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner /app/out/full/ ./

# =========================
# Builder WEB (Vite)
# =========================
FROM installer AS builder_web
ARG PNPM_FILTER=@repo/web

ARG VITE_APP_ENV=prod
ARG VITE_APP_TITLE="PR Calculator"
ARG VITE_API_BASE="https://prcalc-api.carlosgv.dev"

ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_API_BASE=$VITE_API_BASE

RUN pnpm --filter ${PNPM_FILTER} build

# =========================
# Builder API (Nest)
# =========================
FROM installer AS builder_api
ARG PNPM_FILTER=@repo/api
RUN pnpm --filter ${PNPM_FILTER} build

# =========================
# Runtime API image
# =========================
FROM node:20-alpine AS api
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache dumb-init curl

# copia solo lo necesario
COPY --from=builder_api /app/apps/api/dist /app/apps/api/dist
COPY --from=builder_api /app/apps/api/package.json /app/apps/api/package.json
# si tu API necesita runtime deps fuera del dist, aquí es donde se complica.
# En Nest normalmente dist + node_modules bastan.
# Solución simple: copiar node_modules pruned (más pesado pero funciona):
COPY --from=builder_api /app/node_modules /app/node_modules

EXPOSE 3001
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/apps/api/dist/main.js"]

# =========================
# Runtime WEB image (Nginx static)
# =========================
FROM nginx:1.27-alpine AS web
COPY ./apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder_web /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
