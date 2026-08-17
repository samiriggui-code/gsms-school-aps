#!/bin/bash
# Provision workflows n8n GSMS — appelé par deploy.sh après démarrage stack.
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_ENV="${GSMS_ENV:-${GSMS_DIR:-/opt/gsms}/.env}"
PROVISION="${APP_ROOT}/deploy/gsms/n8n/provision.mjs"
WIRE="${APP_ROOT}/deploy/gsms/n8n/wire-n8n-network.sh"

if [[ ! -f "$PROVISION" ]]; then
  echo "==> n8n provision ignoré (script absent)"
  exit 0
fi

if [[ ! -f "$GSMS_ENV" ]]; then
  echo "==> n8n provision ignoré (.env absent: $GSMS_ENV)"
  exit 0
fi

# Branche n8n sur le réseau Docker gsms (gsms-app:3001)
if [[ -f "$WIRE" ]]; then
  sed -i 's/\r$//' "$WIRE" 2>/dev/null || true
  chmod +x "$WIRE"
  bash "$WIRE" || echo "AVERTISSEMENT: wire réseau n8n échoué"
fi

# Force URL interne si absente
if ! grep -qE '^N8N_CRM_INTERNAL_URL=' "$GSMS_ENV"; then
  echo 'N8N_CRM_INTERNAL_URL=http://gsms-app:3001' >> "$GSMS_ENV"
elif grep -qE '^N8N_CRM_INTERNAL_URL=$' "$GSMS_ENV"; then
  sed -i 's|^N8N_CRM_INTERNAL_URL=.*|N8N_CRM_INTERNAL_URL=http://gsms-app:3001|' "$GSMS_ENV"
fi

# Node sur le VPS (docker node ou hôte)
NODE_BIN="${NODE_BIN:-node}"
if ! command -v "$NODE_BIN" >/dev/null 2>&1; then
  echo "==> n8n provision via conteneur node..."
  docker run --rm \
    -v "$APP_ROOT:/app" \
    -v "$(dirname "$GSMS_ENV"):/opt/gsms" \
    -e GSMS_ENV="/opt/gsms/$(basename "$GSMS_ENV")" \
    --env-file "$GSMS_ENV" \
    -w /app \
    node:22-alpine \
    node deploy/gsms/n8n/provision.mjs
else
  GSMS_ENV="$GSMS_ENV" "$NODE_BIN" "$PROVISION"
fi
