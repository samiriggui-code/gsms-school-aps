#!/bin/bash
# VPS — rebuild CRM, seed fil GSMS Ops, réimport workflows n8n, réseau Docker.
set -euo pipefail

AR="${APP_ROOT:-/opt/gsms-school}"
GD="${GSMS_DIR:-/opt/gsms}"
N8N_CONTAINER="${N8N_CONTAINER:-n8n-k2pw-n8n-1}"
N8N_WORKFLOWS_SRC="${N8N_WORKFLOWS_SRC:-$AR/deploy/n8n/workflows}"
N8N_IMPORT_TMP="/tmp/gsms-n8n"

echo "==> 1. Build image CRM"
cd "$AR"
docker build -f deploy/gsms/Dockerfile.crm -t gsms-crm:latest .

echo "==> 2. Recreate gsms-crm"
cd "$GD"
docker compose --profile apps up -d --force-recreate crm
sleep 8

echo "==> 3. Seed fil GSMS Ops"
docker exec -w /app/packages/database gsms-crm node scripts/seed-gsms-ops-chat.js || true

OPS_CHAT_ID=""
OPS_CHAT_ID="$(docker exec gsms-postgres psql -U lms -d lms_app -tAc \
  "SELECT id FROM \"ChatConversation\" WHERE title='GSMS Ops' LIMIT 1" 2>/dev/null | tr -d '[:space:]' || true)"

if [[ -n "$OPS_CHAT_ID" && -f "$GD/.env" ]]; then
  if grep -q '^GSMS_OPS_CHAT_CONVERSATION_ID=' "$GD/.env"; then
    sed -i "s|^GSMS_OPS_CHAT_CONVERSATION_ID=.*|GSMS_OPS_CHAT_CONVERSATION_ID=$OPS_CHAT_ID|" "$GD/.env"
  else
    echo "GSMS_OPS_CHAT_CONVERSATION_ID=$OPS_CHAT_ID" >> "$GD/.env"
  fi
  echo ">> GSMS_OPS_CHAT_CONVERSATION_ID=$OPS_CHAT_ID"
  docker compose --profile apps up -d --force-recreate crm
  sleep 5
fi

echo "==> 4. Réseau n8n ↔ gsms"
docker network connect gsms "$N8N_CONTAINER" 2>/dev/null || echo ">> Déjà connecté"

echo "==> 5. Import workflows n8n"
mkdir -p "$N8N_IMPORT_TMP"
cp "$N8N_WORKFLOWS_SRC"/gsms-00-standard-webhooks.json "$N8N_IMPORT_TMP/"
cp "$N8N_WORKFLOWS_SRC"/gsms-02-cron-stats-worker.json "$N8N_IMPORT_TMP/"
cp "$N8N_WORKFLOWS_SRC"/gsms-03-sonde-disponibilite.json "$N8N_IMPORT_TMP/"
python3 "$AR/deploy/n8n/scripts/deploy-gsms-folder.py" "$N8N_IMPORT_TMP"

echo "==> 6. Test webhook standard"
curl -sS -o /dev/null -w "webhook HTTP %{http_code}\n" -X POST \
  "https://n8n-k2pw.srv1722028.hstgr.cloud/webhook/standard/gsms" \
  -H "Content-Type: application/json" \
  -d '{"group":"standard","event":"landing.contact.submitted","payload":{"name":"Deploy test","subject":"Test"}}' \
  || true

echo "=== OK — CRM rebuild + n8n gsms ==="
