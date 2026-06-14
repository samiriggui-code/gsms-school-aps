#!/bin/bash
# Installation initiale VPS (après nettoyage — n8n + traefik seuls)
# Usage : bash install.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
GIT_REPO="${GIT_REPO:-git@github.com:samiriggui-code/gsms-school-final.git}"

echo "========== Installation GSMS from Git =========="

mkdir -p "$GSMS_DIR"

if [[ ! -f "$GSMS_DIR/.env" ]]; then
  echo "ERREUR: $GSMS_DIR/.env manquant."
  echo "  Copiez le fichier prod (hors Git) : scp deploy/gsms/.env root@VPS:/opt/gsms/.env"
  exit 1
fi
chmod 600 "$GSMS_DIR/.env"

if [[ ! -d "$APP_ROOT/.git" ]]; then
  git clone "$GIT_REPO" "$APP_ROOT"
fi

export APP_ROOT GSMS_DIR RESET_DB=1 REBUILD_WORKER=1
bash "$APP_ROOT/deploy/gsms/deploy.sh"
