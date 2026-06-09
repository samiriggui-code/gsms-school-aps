#!/bin/bash
set -euo pipefail
C="${N8N_CONTAINER:-n8n-k2pw-n8n-1}"
DB="/var/lib/docker/volumes/n8n-k2pw_n8n_data/_data/database.sqlite"
SCRIPT="${1:-/tmp/purge-gsms-workflows.py}"

echo "==> Arrêt n8n"
docker stop "$C"

echo "==> Purge workflows GSMS"
rm -f "${DB}-wal" "${DB}-shm"
chown root:root "$DB"
chmod 644 "$DB"
python3 "$SCRIPT" "$DB"
chown 1000:1000 "$DB"

echo "==> Redémarrage n8n"
docker start "$C"
sleep 12
docker exec "$C" n8n list:workflow 2>&1 | grep GSMS || echo "OK — plus aucun workflow GSMS"
