#!/usr/bin/env sh
set -e

echo "[api] booting…"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[api] ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

DB_HOST="$(node -e 'const u=new URL(process.env.DATABASE_URL); process.stdout.write(u.hostname || "")')"
DB_PORT="$(node -e 'const u=new URL(process.env.DATABASE_URL); process.stdout.write(String(u.port || 5432))')"

if [ -z "$DB_HOST" ]; then
  echo "[api] ERROR: could not parse DB host from DATABASE_URL" >&2
  exit 1
fi

echo "[api] waiting for db tcp ${DB_HOST}:${DB_PORT} …"
i=0
until node -e '
  const net = require("net");
  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT);
  const s = net.createConnection({host, port});
  s.on("connect", () => { s.end(); process.exit(0); });
  s.on("error", () => process.exit(1));
' DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 180 ]; then
    echo "[api] ERROR: db not reachable after 180 (${DB_HOST}:${DB_PORT})" >&2
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
