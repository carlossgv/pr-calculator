# =========================
# Base with pnpm + turbo
# =========================
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm" CI=1
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache bash git && \
    corepack enable && corepack prepare pnpm@9.12.0 --activate && \
    npm i -g turbo
WORKDIR /app

# =========================
# Prune for web
# =========================
FROM base AS pruner
ARG TURBO_SCOPE=@repo/web
COPY turbo.json package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps
RUN turbo prune --scope=${TURBO_SCOPE} --docker

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
# Builder (Vite)
# =========================
FROM installer AS builder
ARG PNPM_FILTER=@repo/web
RUN pnpm --filter ${PNPM_FILTER} build

# =========================
# Runtime (Nginx static)
# =========================
FROM nginx:1.27-alpine AS web
COPY ./apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
