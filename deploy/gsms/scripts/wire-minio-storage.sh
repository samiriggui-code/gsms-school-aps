#!/bin/bash
# Ajoute STORAGE_* dans /opt/gsms/.env + bucket MinIO + recreate CRM.
set -euo pipefail
GD="${GSMS_DIR:-/opt/gsms}"
AR="${APP_ROOT:-/opt/gsms-school}"
ENV="$GD/.env"

if [ ! -f "$ENV" ]; then
  echo "ERREUR: $ENV introuvable"
  exit 1
fi

MINIO_USER="$(grep '^MINIO_ROOT_USER=' "$ENV" | cut -d= -f2- | tr -d '"' | tr -d "'")"
MINIO_PASS="$(grep '^MINIO_ROOT_PASSWORD=' "$ENV" | cut -d= -f2- | tr -d '"' | tr -d "'")"
BUCKET="$(grep '^S3_BUCKET=' "$ENV" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
BUCKET="${BUCKET:-lms-uploads}"
CRM_URL="$(grep '^NEXTAUTH_URL=' "$ENV" | cut -d= -f2- | tr -d '"' | tr -d "'")"
CRM_URL="${CRM_URL:-https://crm.hosting-global-it-ss.com}"

patch_env() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "$ENV"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV"
  else
    echo "${key}=${val}" >> "$ENV"
  fi
}

echo "==> STORAGE_* dans $ENV"
patch_env STORAGE_ENDPOINT "http://gsms-minio:9000"
patch_env STORAGE_ACCESS_KEY_ID "$MINIO_USER"
patch_env STORAGE_SECRET_ACCESS_KEY "$MINIO_PASS"
patch_env STORAGE_BUCKET "$BUCKET"
patch_env STORAGE_REGION "us-east-1"
patch_env STORAGE_CDN_URL "${CRM_URL}/api/public/storage"

echo "==> Bucket MinIO"
bash "$AR/deploy/gsms/scripts/init-minio-bucket.sh" "$ENV"

echo "==> Rebuild + recreate gsms-crm"
cd "$AR"
docker build -f deploy/gsms/Dockerfile.crm -t gsms-crm:latest .
cd "$GD"
docker compose --profile apps up -d --force-recreate crm
sleep 8

echo "==> Test stockage (health)"
docker exec gsms-crm node -e "
const ok = !!(process.env.STORAGE_ENDPOINT && process.env.STORAGE_BUCKET && process.env.STORAGE_ACCESS_KEY_ID);
console.log('STORAGE configured:', ok);
console.log('CDN:', process.env.STORAGE_CDN_URL || '(none)');
"

echo "=== OK MinIO branché au CRM ==="
