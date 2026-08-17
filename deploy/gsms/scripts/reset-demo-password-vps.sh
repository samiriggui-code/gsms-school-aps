#!/bin/bash
set -euo pipefail
ENV_FILE="${GSMS_ENV:-/opt/gsms/.env}"
SCRIPT="${1:-/tmp/reset-demo-password.cjs}"

DB_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//')
if [[ -z "$DB_URL" ]]; then
  U=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
  P=$(grep -E '^POSTGRES_PASSWORD_ENCODED=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
  D=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
  DB_URL="postgresql://${U}:${P}@gsms-postgres:5432/${D}"
fi
DB_URL=$(echo "$DB_URL" | sed 's/@postgres:/@gsms-postgres:/')

docker run --rm --network gsms \
  -v "$SCRIPT:/work/reset.cjs:ro" \
  -w /work \
  -e DATABASE_URL="$DB_URL" \
  node:22-bookworm-slim \
  bash -lc 'npm install --silent bcrypt@5.1.1 pg@8.13.1 && node reset.cjs'
