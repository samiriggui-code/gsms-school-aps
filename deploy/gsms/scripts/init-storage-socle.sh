#!/bin/bash
# Initialise l'arborescence principale MinIO/S3 (fichiers .keep par préfixe).
# Idempotent — safe à relancer après chaque deploy.
# Aligné sur packages/storage/src/storage-socle.ts (STORAGE_SOCLE_PREFIXES).
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
BUCKET="${BUCKET:-lms-uploads}"
USER="$(read_env MINIO_ROOT_USER)"
USER="${USER:-lms}"
PASS="$(read_env MINIO_ROOT_PASSWORD)"

if [ -z "$PASS" ]; then
  echo "ERREUR: MINIO_ROOT_PASSWORD manquant"
  exit 1
fi

# Socle principal — garder synchronisé avec STORAGE_SOCLE_PREFIXES
SOCLE_PREFIXES=(
  ecole ecole/branding ecole/conformite
  utilisateurs
  rh rh/collaborateurs rh/equipes rh/candidats rh/formateurs rh/documents rh/absences
  academique academique/formations academique/sessions academique/stagiaires
  academique/certifications academique/cnaps academique/planning
  finance finance/devis finance/factures finance/exports finance/paiements
  communication communication/cms communication/marketing
  equipements equipements/inventaire equipements/salles
  rapports
  portail portail/candidat portail/formateur portail/mon-dossier
  archives misc company company/avatars avatars
)

docker start gsms-minio 2>/dev/null || true
sleep 2

echo "==> Socle stockage ($BUCKET) — ${#SOCLE_PREFIXES[@]} préfixes"

docker exec gsms-minio mc alias set local http://localhost:9000 "$USER" "$PASS" 2>/dev/null || true
docker exec gsms-minio mc mb --ignore-existing "local/${BUCKET}" 2>/dev/null || true

created=0
existing=0
for prefix in "${SOCLE_PREFIXES[@]}"; do
  key="${prefix}/.keep"
  if docker exec gsms-minio mc stat "local/${BUCKET}/${key}" >/dev/null 2>&1; then
    existing=$((existing + 1))
  else
    printf 'socle' | docker exec -i gsms-minio mc pipe "local/${BUCKET}/${key}" >/dev/null
    created=$((created + 1))
  fi
done

echo "OK socle: ${created} créés, ${existing} déjà présents (${#SOCLE_PREFIXES[@]} total)"
