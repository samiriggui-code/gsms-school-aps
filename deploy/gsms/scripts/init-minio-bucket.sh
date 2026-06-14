#!/bin/bash
# Crée le bucket S3 sur MinIO GSMS (une fois).
set -euo pipefail
GD="${GSMS_DIR:-/opt/gsms}"
ENV_FILE="${1:-$GD/.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERREUR: $ENV_FILE introuvable"
  exit 1
fi

read_env() {
  grep "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//'
}

BUCKET="$(read_env STORAGE_BUCKET)"
[ -z "$BUCKET" ] && BUCKET="$(read_env S3_BUCKET)"
BUCKET="${BUCKET:-lms-uploads}"
USER="$(read_env MINIO_ROOT_USER)"
USER="${USER:-lms}"
PASS="$(read_env MINIO_ROOT_PASSWORD)"

if [ -z "$PASS" ]; then
  echo "ERREUR: MINIO_ROOT_PASSWORD manquant dans $ENV_FILE"
  exit 1
fi

docker start gsms-minio 2>/dev/null || true
sleep 3

docker run --rm --network gsms --entrypoint /bin/sh minio/mc:latest -c "
  mc alias set gsms http://gsms-minio:9000 '$USER' '$PASS'
  mc mb -p gsms/$BUCKET 2>/dev/null || true
  mc anonymous set download gsms/$BUCKET/misc 2>/dev/null || true
  mc ls gsms/$BUCKET
"
echo "OK bucket $BUCKET"
