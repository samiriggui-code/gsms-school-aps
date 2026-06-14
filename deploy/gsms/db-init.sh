#!/bin/bash
# Init Postgres : migrate deploy + seed (monorepo packages/database)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_ENV="${GSMS_ENV:-/opt/gsms/.env}"

read_gsms_env() {
  local key="$1"
  grep -E "^${key}=" "$GSMS_ENV" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//'
}

export DATABASE_URL
DATABASE_URL="$(read_gsms_env DATABASE_URL)"
if [[ -z "$DATABASE_URL" ]]; then
  _pg_user="$(read_gsms_env POSTGRES_USER)"
  _pg_pass="$(read_gsms_env POSTGRES_PASSWORD_ENCODED)"
  _pg_db="$(read_gsms_env POSTGRES_DB)"
  DATABASE_URL="postgresql://${_pg_user}:${_pg_pass}@postgres:5432/${_pg_db}"
fi
export DATABASE_URL

if [[ "${RESET_DB:-0}" == "1" ]]; then
  echo "==> DROP SCHEMA public (reset demande)"
  docker exec gsms-postgres psql -U lms -d lms_app -v ON_ERROR_STOP=1 -c \
    'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO lms; GRANT ALL ON SCHEMA public TO public;'
fi

echo "==> prisma migrate deploy"
docker run --rm \
  --network gsms \
  -v "$APP_ROOT/packages/database:/work" \
  -w /work \
  -e DATABASE_URL \
  node:22-bookworm-slim bash -lc '
    apt-get update -qq && apt-get install -y -qq openssl ca-certificates && rm -rf /var/lib/apt/lists/*
    npm install prisma@7.8.0 --no-save --no-audit --no-fund
    npx prisma migrate deploy --schema=prisma/schema.prisma
  '

echo "==> prisma db push (alignement schema)"
docker run --rm \
  --network gsms \
  -v "$APP_ROOT/packages/database:/work" \
  -w /work \
  -e DATABASE_URL \
  node:22-bookworm-slim bash -lc '
    apt-get update -qq && apt-get install -y -qq openssl ca-certificates && rm -rf /var/lib/apt/lists/*
    npm install prisma@7.8.0 --no-save --no-audit --no-fund
    npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
  '

echo "==> seed"
docker run --rm \
  --network gsms \
  -v "$APP_ROOT:/app" \
  -w /app \
  -e DATABASE_URL \
  node:22-bookworm-slim bash -lc '
    apt-get update -qq && apt-get install -y -qq openssl ca-certificates && rm -rf /var/lib/apt/lists/*
    corepack enable && corepack prepare pnpm@11.5.1 --activate
    pnpm install --filter @repo/database... --ignore-scripts
    pnpm -C packages/database db:generate
    pnpm -C packages/database db:seed || echo "AVERTISSEMENT: seed partiel"
  '

echo "==> Tables: $(docker exec gsms-postgres psql -U lms -d lms_app -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")"
echo "OK db-init"
