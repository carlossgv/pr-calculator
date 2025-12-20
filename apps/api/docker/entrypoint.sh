# FILE: apps/api/docker/entrypoint.sh
#!/usr/bin/env sh
set -e

echo "[api] booting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[api] ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

echo "[api] waiting for db (pg_isready)…"
i=0
until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 180 ]; then
    echo "[api] ERROR: db not reachable after 180s" >&2
    exit 1
  fi
  sleep 1
done

if [ -d "/app/prisma/migrations" ]; then
  echo "[api] applying prisma migrations…"
  /app/node_modules/.bin/prisma migrate deploy
else
  echo "[api] WARNING: /app/prisma/migrations not found; skipping migrate deploy" >&2
fi

echo "[api] starting server…"
exec node /app/dist/main.js
