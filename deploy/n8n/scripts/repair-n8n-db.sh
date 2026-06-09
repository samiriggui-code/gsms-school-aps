#!/bin/bash
# Restaure database.sqlite n8n depuis une copie saine + réimport workflows GSMS.
set -euo pipefail
C=n8n-k2pw-n8n-1
VOL=/var/lib/docker/volumes/n8n-k2pw_n8n_data/_data
AR=/opt/gsms-school
BACKUP="$VOL/database.sqlite.bak-$(date +%Y%m%d%H%M%S)"
GOOD_DB="${1:-/tmp/n8n-gsms.sqlite}"

echo "==> Stop n8n"
docker stop "$C"

echo "==> Backup DB actuelle"
cp -a "$VOL/database.sqlite" "$BACKUP" 2>/dev/null || true
cp -a "$VOL/database.sqlite-wal" "$BACKUP-wal" 2>/dev/null || true
cp -a "$VOL/database.sqlite-shm" "$BACKUP-shm" 2>/dev/null || true

if [ -f "$GOOD_DB" ]; then
  echo "==> Restaure depuis $GOOD_DB"
  cp -f "$GOOD_DB" "$VOL/database.sqlite"
  rm -f "$VOL/database.sqlite-wal" "$VOL/database.sqlite-shm"
else
  echo "WARN: pas de copie $GOOD_DB — tentative sqlite3 .recover"
  python3 - <<'PY'
import sqlite3, shutil, sys
src = "/tmp/n8n-live.sqlite"
dst = "/var/lib/docker/volumes/n8n-k2pw_n8n_data/_data/database.sqlite"
try:
    c = sqlite3.connect(src)
    c.execute("SELECT COUNT(*) FROM workflow_entity")
    c.close()
    shutil.copy2(src, dst)
    print("OK copie", src)
except Exception as e:
    print("FAIL", e)
    sys.exit(1)
PY
  rm -f "$VOL/database.sqlite-wal" "$VOL/database.sqlite-shm"
fi

chown -R 1000:1000 "$VOL/database.sqlite"*
docker start "$C"
sleep 20

if docker logs "$C" --tail 5 2>&1 | grep -q SQLITE_CORRUPT; then
  echo "ERREUR: DB toujours corrompue — réimport workflows requis"
  mkdir -p /tmp/gsms-n8n
  cp "$AR/deploy/n8n/workflows/gsms-0"*.json /tmp/gsms-n8n/
  python3 "$AR/deploy/n8n/scripts/deploy-gsms-folder.py" /tmp/gsms-n8n
fi

echo "==> Test webhook"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -X POST \
  "https://n8n-k2pw.srv1722028.hstgr.cloud/webhook/standard/gsms" \
  -H "Content-Type: application/json" \
  -d '{"group":"standard","event":"landing.contact.submitted","payload":{"name":"Test"}}'
