# Dockerfile
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
# Prune for api + web
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
# Builder (build both)
# =========================
FROM installer AS builder

# WEB build args (Vite)
ARG VITE_APP_ENV=prod
ARG VITE_APP_TITLE="PR Calculator"
ARG VITE_API_BASE="/api"

ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_API_BASE=$VITE_API_BASE

# build api + web (turbo/tsc will cache)
RUN pnpm --filter @repo/api build
RUN pnpm --filter @repo/web build

# =========================
# Runtime API image (Nest)
# =========================
FROM node:20-alpine AS api
ENV NODE_ENV=production
WORKDIR /app

# If you need prisma client at runtime, you already bundle it in dist via @prisma/client.
# Copy only built output + package.json + node_modules needed
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3001
CMD ["node", "dist/main.js"]

# =========================
# Runtime WEB image (Nginx static)
# =========================
FROM nginx:1.27-alpine AS web
COPY ./apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
