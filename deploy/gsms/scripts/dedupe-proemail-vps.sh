#!/usr/bin/env bash
# Déduplique User.proEmail + index unique sur le VPS (réseau Docker gsms).
set -euo pipefail
ENV_FILE="${GSMS_ENV:-/opt/gsms/.env}"
SQL_FILE="${1:-/tmp/dedupe-proemail.sql}"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "SQL manquant: $SQL_FILE" >&2
  exit 1
fi

DB_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//')
if [[ -z "$DB_URL" ]]; then
  U=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
  P=$(grep -E '^POSTGRES_PASSWORD_ENCODED=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
  D=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
  DB_URL="postgresql://${U}:${P}@gsms-postgres:5432/${D}"
fi
DB_URL=$(echo "$DB_URL" | sed 's/@postgres:/@gsms-postgres:/')

# Extraire user/pass/db pour psql via conteneur postgres
PGUSER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
PGDB=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
PGPASS=$(grep -E '^POSTGRES_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//')

docker cp "$SQL_FILE" gsms-postgres:/tmp/dedupe-proemail.sql
docker exec -e PGPASSWORD="$PGPASS" gsms-postgres \
  psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 -f /tmp/dedupe-proemail.sql
echo "OK — proEmail dédupliqué sur VPS ($PGDB)."
