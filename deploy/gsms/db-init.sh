#!/bin/bash
# Init Postgres : migrate deploy + db push + seed (monorepo pnpm)
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

echo "==> Prisma migrate + push + seed (pnpm monorepo)"
docker run --rm \
  --network gsms \
  -v "$APP_ROOT:/app" \
  -w /app \
  -e DATABASE_URL \
  -e SKIP_SEED="${SKIP_SEED:-1}" \
  -e ALLOW_DB_PUSH_DATA_LOSS="${ALLOW_DB_PUSH_DATA_LOSS:-0}" \
  node:22-bookworm-slim bash -lc '
    set -euo pipefail
    apt-get update -qq
    apt-get install -y -qq openssl ca-certificates git >/dev/null
    rm -rf /var/lib/apt/lists/*

    corepack enable
    corepack prepare pnpm@11.5.1 --activate

    echo "==> pnpm install (@repo/database + deps workspace)"
    pnpm install --filter @repo/database... --ignore-scripts

    echo "==> prisma generate"
    pnpm -C packages/database db:generate

    echo "==> prisma migrate deploy"
    pnpm -C packages/database exec prisma migrate deploy --schema=prisma/schema.prisma

    if [[ "${ALLOW_DB_PUSH_DATA_LOSS:-0}" == "1" ]]; then
      echo "==> prisma db push (alignement schema, --accept-data-loss demande explicitement)"
      pnpm -C packages/database exec prisma db push --schema=prisma/schema.prisma --accept-data-loss
    else
      echo "==> db push ignore (ALLOW_DB_PUSH_DATA_LOSS!=1) — migrate deploy suffit normalement"
    fi

    if [[ "${SKIP_SEED}" == "1" ]]; then
      echo "==> SKIP_SEED=1 (pas de seed)"
    else
      echo "==> seed (comptes demo @ecole.local / demo1234 vont etre crees)"
      pnpm -C packages/database db:seed || echo "AVERTISSEMENT: seed partiel"
    fi

    if [[ "${SKIP_DIRECTION_SYNC:-0}" != "1" ]]; then
      echo "==> sync équipe direction + emails structure (idempotent)"
      node packages/database/prisma/scripts/sync-direction-team.js || echo "AVERTISSEMENT: sync direction partiel"
    fi
  '

echo "==> Tables: $(docker exec gsms-postgres psql -U lms -d lms_app -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")"
echo "OK db-init"
