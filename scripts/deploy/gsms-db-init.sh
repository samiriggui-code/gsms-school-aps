#!/bin/bash
# Initialise Postgres du stack GSMS : migrations Prisma + seed
set -euo pipefail

if ! docker info >/dev/null 2>&1; then
  echo "ERREUR: daemon Docker indisponible"
  exit 1
fi

if ! docker network inspect gsms >/dev/null 2>&1; then
  echo "ERREUR: reseau Docker 'gsms' absent — demarrez d'abord: cd /opt/gsms && docker compose up -d postgres"
  exit 1
fi

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
  if [[ -z "$_pg_user" || -z "$_pg_pass" || -z "$_pg_db" ]]; then
    echo "ERREUR: DATABASE_URL absent et POSTGRES_* incomplet dans $GSMS_ENV"
    exit 1
  fi
  DATABASE_URL="postgresql://${_pg_user}:${_pg_pass}@postgres:5432/${_pg_db}"
fi
export DATABASE_URL

echo "==> DATABASE_URL host=$(echo "$DATABASE_URL" | sed -E 's|.*@([^/]+)/.*|\1|')"

echo "==> verification / recovery schema Postgres"
LEAD_OK="$(docker exec gsms-postgres psql -U lms -d lms_app -tAc \
  "SELECT (to_regclass('public.\"Lead\"') IS NOT NULL)" 2>/dev/null | tr -d '[:space:]' || true)"
MIG_TABLE="$(docker exec gsms-postgres psql -U lms -d lms_app -tAc \
  "SELECT to_regclass('public.\"_prisma_migrations\"') IS NOT NULL" 2>/dev/null | tr -d '[:space:]' || true)"
FAILED_MIG=""
OLD_MIG_COUNT="0"
BASELINE_APPLIED="0"
if [ "$MIG_TABLE" = "t" ]; then
  FAILED_MIG="$(docker exec gsms-postgres psql -U lms -d lms_app -tAc \
    "SELECT migration_name FROM \"_prisma_migrations\" WHERE finished_at IS NULL AND rolled_back_at IS NULL LIMIT 1" \
    2>/dev/null | tr -d '[:space:]' || true)"
  OLD_MIG_COUNT="$(docker exec gsms-postgres psql -U lms -d lms_app -tAc \
    "SELECT count(*)::text FROM \"_prisma_migrations\" WHERE migration_name <> '20250101000000_baseline'" \
    2>/dev/null | tr -d '[:space:]' || echo "0")"
  BASELINE_APPLIED="$(docker exec gsms-postgres psql -U lms -d lms_app -tAc \
    "SELECT count(*)::text FROM \"_prisma_migrations\" WHERE migration_name = '20250101000000_baseline' AND finished_at IS NOT NULL" \
    2>/dev/null | tr -d '[:space:]' || echo "0")"
fi

if [ "$LEAD_OK" != "t" ] && { [ -n "$FAILED_MIG" ] || [ "${OLD_MIG_COUNT:-0}" != "0" ]; }; then
  echo "==> Recovery: Lead absent + migrations obsoletes ou en echec — reinit schema public"
  docker exec gsms-postgres psql -U lms -d lms_app -v ON_ERROR_STOP=1 -c \
    'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO lms; GRANT ALL ON SCHEMA public TO public;'
elif [ "$LEAD_OK" = "t" ] && [ "${OLD_MIG_COUNT:-0}" != "0" ] && [ "${BASELINE_APPLIED:-0}" = "0" ]; then
  echo "==> Baseline: schema deja present, marquage migration 20250101000000_baseline"
  docker run --rm \
    --network gsms \
    -v "$APP_ROOT/packages/database:/work" \
    -w /work \
    -e DATABASE_URL \
    node:22-bookworm-slim bash -lc '
      apt-get update -y
      apt-get install -y --no-install-recommends openssl ca-certificates
      rm -rf /var/lib/apt/lists/*
      npm install prisma@7.8.0 --no-save --no-audit --no-fund
      npx prisma migrate resolve --applied 20250101000000_baseline --schema=prisma/schema.prisma
    '
fi

echo "==> prisma migrate deploy"
docker run --rm \
  --network gsms \
  -v "$APP_ROOT/packages/database:/work" \
  -w /work \
  -e DATABASE_URL \
  node:22-bookworm-slim bash -lc '
    apt-get update -y
    apt-get install -y --no-install-recommends openssl ca-certificates
    rm -rf /var/lib/apt/lists/*
    npm install prisma@7.8.0 --no-save --no-audit --no-fund
    npx prisma migrate deploy --schema=prisma/schema.prisma
  '

echo "==> prisma db push (aligne schema si baseline obsolete)"
docker run --rm \
  --network gsms \
  -v "$APP_ROOT/packages/database:/work" \
  -w /work \
  -e DATABASE_URL \
  node:22-bookworm-slim bash -lc '
    apt-get update -y
    apt-get install -y --no-install-recommends openssl ca-certificates
    rm -rf /var/lib/apt/lists/*
    npm install prisma@7.8.0 --no-save --no-audit --no-fund
    npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
  '

echo "==> prisma generate + seed (monorepo)"
docker run --rm \
  --network gsms \
  -v "$APP_ROOT:/app" \
  -w /app \
  -e DATABASE_URL \
  node:22-bookworm-slim bash -lc '
    apt-get update -y
    apt-get install -y --no-install-recommends openssl ca-certificates
    rm -rf /var/lib/apt/lists/*
    corepack enable
    pnpm install --filter @repo/database... --ignore-scripts
    pnpm -C packages/database db:generate
    pnpm -C packages/database db:seed || echo "AVERTISSEMENT: seed partiel (non bloquant)"
  '

echo "==> Tables"
docker exec gsms-postgres psql -U lms -d lms_app -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"

echo "==> Utilisateurs (demo)"
docker exec gsms-postgres psql -U lms -d lms_app -t -c \
  'SELECT email FROM "User" LIMIT 8;' 2>/dev/null || true

echo "OK."
