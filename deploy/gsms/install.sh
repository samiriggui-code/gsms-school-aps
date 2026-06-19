#!/bin/bash
# Premier déploiement VPS (Traefik + n8n déjà présents)
#
# Prérequis :
#   1. Code dans /opt/gsms-school (git clone OU tar extrait)
#   2. /opt/gsms/.env (copie de deploy/gsms/.env — hors Git)
#
# Usage :
#   bash /opt/gsms-school/deploy/gsms/install.sh
#   SKIP_GIT=1 bash /opt/gsms-school/deploy/gsms/install.sh   # après tar scp
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
GIT_REPO="${GIT_REPO:-git@github.com:samiriggui-code/gsms-school-final.git}"

echo "========== Installation GSMS =========="

mkdir -p "$GSMS_DIR"

if [[ ! -f "$GSMS_DIR/.env" ]]; then
  echo "ERREUR: $GSMS_DIR/.env manquant."
  echo ""
  echo "  cp deploy/gsms/.env.example deploy/gsms/.env"
  echo "  # renseigner les secrets localement"
  echo "  scp deploy/gsms/.env root@VPS:/opt/gsms/.env"
  echo "  ssh root@VPS chmod 600 /opt/gsms/.env"
  exit 1
fi

if [[ ! -d "$APP_ROOT/deploy/gsms" ]] && [[ "${SKIP_GIT:-0}" != "1" ]]; then
  echo "==> Clone monorepo → $APP_ROOT"
  git clone "$GIT_REPO" "$APP_ROOT"
fi

if [[ ! -f "$APP_ROOT/deploy/gsms/deploy.sh" ]]; then
  echo "ERREUR: code absent dans $APP_ROOT — extraire le tar ou cloner le repo"
  exit 1
fi

export APP_ROOT GSMS_DIR SKIP_GIT="${SKIP_GIT:-0}" RESET_DB=1 REBUILD_WORKER=1
bash "$APP_ROOT/deploy/gsms/deploy.sh"
