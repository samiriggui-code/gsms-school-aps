#!/bin/sh
# Rattache n8n au réseau Docker « gsms » pour joindre gsms-crm, gsms-landing, etc.
set -e
N8N_CONTAINER="${N8N_CONTAINER:-n8n-k2pw-n8n-1}"
NETWORK="${NETWORK:-gsms}"

if docker network inspect "$NETWORK" >/dev/null 2>&1; then
  docker network connect "$NETWORK" "$N8N_CONTAINER" 2>/dev/null || true
  echo "n8n connecté au réseau $NETWORK"
else
  echo "Réseau $NETWORK introuvable — stack GSMS démarrée ?"
  exit 1
fi

docker exec "$N8N_CONTAINER" wget -qO- --timeout=5 http://gsms-crm:3001/api/health && echo "" && echo "OK gsms-crm:3001"
