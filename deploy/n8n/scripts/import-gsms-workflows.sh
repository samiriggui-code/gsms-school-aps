#!/bin/sh
# Importe les workflows GSMS dans n8n (dossier « gsms ») — VPS Hostinger.
set -e

N8N_CONTAINER="${N8N_CONTAINER:-n8n-k2pw-n8n-1}"
IMPORT_DIR="${IMPORT_DIR:-/tmp/gsms-n8n}"
PROJECT_ID="${PROJECT_ID:-qRRKIBKP4Foknqq6}"
FOLDER_NAME="${FOLDER_NAME:-gsms}"
FOLDER_ID="${FOLDER_ID:-gsms-school-folder-001}"
DB_PATH="/home/node/.n8n/database.sqlite"

echo "=== GSMS n8n — import workflows ==="

docker start "$N8N_CONTAINER" 2>/dev/null || true
sleep 5
docker cp "/tmp/gsms-n8n/." "$N8N_CONTAINER:$IMPORT_DIR/"

echo ">> Import (n8n actif)..."
docker exec "$N8N_CONTAINER" n8n import:workflow --separate --input="$IMPORT_DIR" --projectId="$PROJECT_ID"

echo ">> Dossier gsms + activation (arrêt court)..."
docker stop "$N8N_CONTAINER"
docker cp "$N8N_CONTAINER:$DB_PATH" /tmp/n8n-import.sqlite
docker cp "$N8N_CONTAINER:${DB_PATH}-wal" /tmp/n8n-import.sqlite-wal 2>/dev/null || true
docker cp "$N8N_CONTAINER:${DB_PATH}-shm" /tmp/n8n-import.sqlite-shm 2>/dev/null || true

python3 <<'PY'
import sqlite3, datetime
db = '/tmp/n8n-import.sqlite'
c = sqlite3.connect(db)
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
folder_id = 'gsms-school-folder-001'
project_id = 'qRRKIBKP4Foknqq6'
name = 'gsms'
row = c.execute('SELECT id FROM folder WHERE name=? AND projectId=?', (name, project_id)).fetchone()
if not row:
    c.execute(
        'INSERT INTO folder (id, name, parentFolderId, projectId, createdAt, updatedAt) VALUES (?,?,?,?,?,?)',
        (folder_id, name, None, project_id, now, now),
    )
else:
    folder_id = row[0]
names = (
    'GSMS — Webhook standard (landing + CRM)',
    'GSMS — Hub événements LMS',
    'GSMS — Cron stats (équiv. worker)',
    'GSMS — Sonde apps (5 min)',
    'GSMS — Devis landing (gap app)',
    'GSMS — Parcours candidat (référence)',
)
for n in names:
    c.execute('UPDATE workflow_entity SET parentFolderId=? WHERE name=?', (folder_id, n))
for wid in (
    'a1b1c1d1-e000-4000-8000-000000000000',
    'a1b1c1d1-e003-4000-8000-000000000003',
):
    c.execute('UPDATE workflow_entity SET active=1 WHERE id=?', (wid,))
c.commit()
for r in c.execute("SELECT id,name,active,parentFolderId FROM workflow_entity WHERE name LIKE 'GSMS%'"):
    print(r)
PY

docker cp /tmp/n8n-import.sqlite "$N8N_CONTAINER:$DB_PATH"
docker cp /tmp/n8n-import.sqlite-wal "$N8N_CONTAINER:${DB_PATH}-wal" 2>/dev/null || true
docker cp /tmp/n8n-import.sqlite-shm "$N8N_CONTAINER:${DB_PATH}-shm" 2>/dev/null || true
chown 1000:1000 /var/lib/docker/volumes/n8n-k2pw_n8n_data/_data/database.sqlite* 2>/dev/null || \
  docker exec -u root "$N8N_CONTAINER" chown -R node:node /home/node/.n8n
docker start "$N8N_CONTAINER"
sleep 12

echo ">> Workflows GSMS:"
docker exec "$N8N_CONTAINER" n8n list:workflow 2>&1 | grep GSMS || docker exec "$N8N_CONTAINER" n8n list:workflow

echo ">> Test webhook standard..."
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -X POST \
  "https://n8n-k2pw.srv1722028.hstgr.cloud/webhook/standard/gsms" \
  -H "Content-Type: application/json" \
  -d '{"group":"standard","event":"landing.contact.submitted","payload":{"name":"Test"}}' || true

echo "=== Terminé ==="
