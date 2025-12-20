#!/usr/bin/env sh
set -e

echo "[api] booting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[api] ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

DB_HOST="$(node -e 'const u=new URL(process.env.DATABASE_URL); process.stdout.write(u.hostname || "")')"
DB_PORT="$(node -e 'const u=new URL(process.env.DATABASE_URL); process.stdout.write(String(u.port || 5432))')"

echo "[api] waiting for db tcp ${DB_HOST}:${DB_PORT} …"
i=0
until DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" node -e '
  const net = require("net");
  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT);
  const s = net.createConnection({ host, port });
  s.on("connect", () => { s.end(); process.exit(0); });
  s.on("error", () => process.exit(1));
' >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 180 ]; then
    echo "[api] ERROR: db not reachable after 180s (${DB_HOST}:${DB_PORT})" >&2
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
# FILE: apps/api/docker/entrypoint.sh
# ... (todo igual arriba)

echo "[api] starting server…"

MAIN=""
for p in \
  /app/dist/main.js \
  /app/dist/src/main.js \
  /app/dist/apps/api/src/main.js \
  /app/dist/apps/api/main.js \
  /app/dist/**/main.js
do
  if [ -f "$p" ]; then MAIN="$p"; break; fi
done

# Busybox sh no expande **, así que hacemos un fallback con find
if [ -z "$MAIN" ]; then
  MAIN="$(find /app -maxdepth 6 -type f -name main.js 2>/dev/null | head -n 1 || true)"
fi

if [ -z "$MAIN" ]; then
  echo "[api] ERROR: could not locate main.js under /app" >&2
  echo "[api] DEBUG: /app tree (top):" >&2
  ls -la /app >&2 || true
  echo "[api] DEBUG: /app/dist:" >&2
  ls -la /app/dist >&2 || true
  exit 1
fi

echo "[api] using entry: $MAIN"
exec node "$MAIN"
