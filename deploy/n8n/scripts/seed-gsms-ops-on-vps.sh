#!/bin/bash
set -euo pipefail
GD=/opt/gsms
AR=/opt/gsms-school
DB_URL=$(grep '^DATABASE_URL=' "$GD/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")

docker run --rm --network gsms \
  -e DATABASE_URL="$DB_URL" \
  -v "$AR/packages/database:/app" \
  -w /app \
  node:22-bookworm-slim \
  bash -c "npm install pg @prisma/adapter-pg --no-save 2>/dev/null; node scripts/seed-gsms-ops-chat.js"

OPS_CHAT_ID=$(docker exec gsms-postgres psql -U lms -d lms_app -tAc "SELECT id FROM \"ChatConversation\" WHERE title='GSMS Ops' LIMIT 1" | tr -d '[:space:]')
echo "OPS_CHAT_ID=$OPS_CHAT_ID"

if [ -n "$OPS_CHAT_ID" ]; then
  if grep -q '^GSMS_OPS_CHAT_CONVERSATION_ID=' "$GD/.env"; then
    sed -i "s|^GSMS_OPS_CHAT_CONVERSATION_ID=.*|GSMS_OPS_CHAT_CONVERSATION_ID=$OPS_CHAT_ID|" "$GD/.env"
  else
    echo "GSMS_OPS_CHAT_CONVERSATION_ID=$OPS_CHAT_ID" >> "$GD/.env"
  fi
  cd "$GD"
  docker compose --profile apps up -d --force-recreate crm
  sleep 4
  grep GSMS_OPS "$GD/.env"
fi
