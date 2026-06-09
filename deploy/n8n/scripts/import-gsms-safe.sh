#!/bin/bash
# Import GSMS workflows SANS toucher database.sqlite (évite corruption WAL).
set -euo pipefail
C="${N8N_CONTAINER:-n8n-k2pw-n8n-1}"
AR="${APP_ROOT:-/opt/gsms-school}"
GD="${GSMS_DIR:-/opt/gsms}"
PROJECT_ID="${PROJECT_ID:-qRRKIBKP4Foknqq6}"
TMP=/tmp/gsms-n8n-import
SECRET="$(grep '^N8N_WEBHOOK_SECRET=' "$GD/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"

mkdir -p "$TMP"
cp "$AR/deploy/n8n/workflows/gsms-0"*.json "$TMP/"

if [ -n "$SECRET" ]; then
  GSMS_N8N_SECRET="$SECRET" python3 - <<'PY'
import json, os, pathlib, re
secret = os.environ.get("GSMS_N8N_SECRET", "")
p = pathlib.Path("/tmp/gsms-n8n-import/gsms-00-standard-webhooks.json")
w = json.loads(p.read_text(encoding="utf-8"))
for n in w.get("nodes", []):
    if n.get("name") == "Préparer actions":
        code = n["parameters"]["jsCode"]
        n["parameters"]["jsCode"] = re.sub(
            r"const INTERNAL_SECRET = '[^']*';",
            f"const INTERNAL_SECRET = {json.dumps(secret)};",
            code,
            count=1,
        )
p.write_text(json.dumps(w, ensure_ascii=False, indent=2), encoding="utf-8")
print("Secret injecté dans Préparer actions")
PY
else
  echo "WARN: N8N_WEBHOOK_SECRET vide dans $GD/.env — éditer Préparer actions dans n8n"
fi

docker network connect gsms "$C" 2>/dev/null || true
docker start "$C" 2>/dev/null || true
sleep 5

for f in gsms-00-standard-webhooks.json gsms-02-cron-stats-worker.json gsms-03-sonde-disponibilite.json; do
  docker cp "$TMP/$f" "$C:/tmp/gsms-n8n/$f"
  docker exec "$C" n8n import:workflow --input="/tmp/gsms-n8n/$f" --projectId="$PROJECT_ID"
done

for wid in \
  a1b1c1d1-e000-4000-8000-000000000000 \
  a1b1c1d1-e002-4000-8000-000000000002 \
  a1b1c1d1-e003-4000-8000-000000000003; do
  docker exec "$C" n8n update:workflow --id="$wid" --active=true 2>/dev/null || true
  docker exec "$C" n8n publish:workflow --id="$wid" 2>/dev/null || true
done

docker restart "$C"
sleep 18

echo "=== Test webhook ==="
curl -sS -o /dev/null -w "webhook HTTP %{http_code}\n" -X POST \
  "https://n8n-k2pw.srv1722028.hstgr.cloud/webhook/standard/gsms" \
  -H "Content-Type: application/json" \
  -d '{"group":"standard","event":"landing.contact.submitted","payload":{"name":"Test","subject":"Sonde"}}' \
  || true

echo "=== OK import safe ==="
