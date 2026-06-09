#!/bin/bash
set -euo pipefail
C=n8n-k2pw-n8n-1
echo "=== n8n conteneur ==="
docker ps --format '{{.Names}} {{.Status}}' | grep n8n || echo "n8n absent"
echo ""
echo "=== Workflows GSMS (CLI) ==="
docker exec "$C" n8n list:workflow 2>&1 | grep GSMS || echo "(aucun GSMS via CLI)"
echo ""
echo "=== Base SQLite n8n ==="
docker stop "$C" 2>/dev/null || true
docker cp "$C:/home/node/.n8n/database.sqlite" /tmp/n8n-live.sqlite
python3 /tmp/list-gsms-workflows.py /tmp/n8n-live.sqlite
echo ""
echo "=== Test webhook (doit repondre 200) ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -X POST \
  "https://n8n-k2pw.srv1722028.hstgr.cloud/webhook/standard/gsms" \
  -H "Content-Type: application/json" \
  -d '{"group":"standard","event":"landing.contact.submitted","payload":{"name":"Test"}}' || echo "curl failed"
docker start "$C" 2>/dev/null || true
