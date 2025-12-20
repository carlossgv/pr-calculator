# FILE: Dockerfile
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
# Prune for web + api
# =========================
FROM base AS pruner
COPY turbo.json package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps
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
# Builder (api + web)
# =========================
FROM installer AS builder

# ---- Vite build-time args (from GitHub Actions build-args)
ARG VITE_APP_ENV=prod
ARG VITE_APP_TITLE="PR Calculator"
ARG VITE_API_BASE="/api"
ARG VITE_APP_VERSION=""

# ---- Ensure Vite sees them
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# ✅ Prisma Client MUST be generated in CI (since we used --ignore-scripts)
RUN pnpm --filter @repo/api prisma:generate

# Build API + WEB
RUN pnpm --filter @repo/api build
RUN pnpm --filter @repo/web build

# ✅ Create self-contained prod bundle
RUN pnpm --filter @repo/api deploy --prod /app/deploy/api

# ✅ Include Prisma schema + migrations in the deployed bundle (needed for migrate deploy at runtime)
RUN mkdir -p /app/deploy/api/prisma && \
    cp -r /app/apps/api/prisma/* /app/deploy/api/prisma/

# =========================
# Runtime API image
# =========================
FROM node:20-alpine AS api
ENV NODE_ENV=production
WORKDIR /app

# Prisma engines on alpine often need openssl (safe to include)
RUN apk add --no-cache dumb-init openssl bash

EXPOSE 3001
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Copy the deployed API bundle (includes prisma/)
COPY --from=builder /app/deploy/api /app

# Run migrations on boot, then start the server
COPY ./apps/api/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]

# =========================
# Runtime WEB image (Nginx static)
# =========================
FROM nginx:1.27-alpine AS web
COPY ./apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
