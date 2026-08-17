#!/bin/bash
# Rebuild complet VPS : archive (optionnelle) + Docker app/worker + Prisma migrate/push.
#
# Usage sur le VPS :
#   bash /opt/gsms-school/deploy/gsms/vps-rebuild-complete.sh
#   bash /opt/gsms-school/deploy/gsms/vps-rebuild-complete.sh /tmp/gsms-school-deploy.tar.gz
#
# Depuis Windows (poste dev) :
#   .\scripts\vps-rebuild-complete.ps1
#
# Variables d'environnement :
#   APP_ROOT=/opt/gsms-school   GSMS_DIR=/opt/gsms
#   RUN_DB_INIT=1                 migrate + db push après deploy (défaut: 1)
#   SKIP_SEED=1                   pas de seed Prisma (défaut: 1 — données prod préservées)
#   SKIP_SEED=0                   relancer le seed complet
#   REBUILD_WORKER=1              rebuild image worker (défaut: 1)
#   SKIP_DEPLOY=1                 sauter rebuild Docker (db-init seulement)
#   SKIP_TAR_EXTRACT=1            ne pas extraire l'archive (code déjà en place)
#   SKIP_ENV_BACKUP=1             ne pas copier .env avant deploy
#   RESET_DB=1                    drop schema + seed (destructif)
#   SKIP_DISK_CLEANUP=1           pas de nettoyage disque en fin de rebuild
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
TAR="${1:-${TAR:-/tmp/gsms-school-deploy.tar.gz}}"

RUN_DB_INIT="${RUN_DB_INIT:-1}"
SKIP_SEED="${SKIP_SEED:-1}"
REBUILD_WORKER="${REBUILD_WORKER:-1}"
SKIP_DEPLOY="${SKIP_DEPLOY:-0}"
SKIP_TAR_EXTRACT="${SKIP_TAR_EXTRACT:-0}"
SKIP_ENV_BACKUP="${SKIP_ENV_BACKUP:-0}"

echo "========== GSMS rebuild complet =========="
echo "APP_ROOT=$APP_ROOT  GSMS_DIR=$GSMS_DIR"
echo "RUN_DB_INIT=$RUN_DB_INIT  SKIP_SEED=$SKIP_SEED  REBUILD_WORKER=$REBUILD_WORKER"

if [[ "$SKIP_ENV_BACKUP" != "1" && -f "$GSMS_DIR/.env" ]]; then
  backup="$GSMS_DIR/.env.backup.$(date +%Y%m%d-%H%M%S)"
  cp -a "$GSMS_DIR/.env" "$backup"
  echo "==> .env sauvegarde: $backup"
elif [[ ! -f "$GSMS_DIR/.env" ]]; then
  echo "AVERTISSEMENT: $GSMS_DIR/.env absent"
fi

if [[ "$SKIP_TAR_EXTRACT" != "1" && -f "$TAR" ]]; then
  mkdir -p "$APP_ROOT"
  # Purge les arbres sources avant extract — sinon les fichiers déplacés/supprimés
  # en local restent sur le VPS et cassent le typecheck Next (ex. vieux composants examens).
  echo "==> Purge sources obsolètes ($APP_ROOT/{apps,packages,deploy,scripts,docker,config}) ..."
  rm -rf \
    "$APP_ROOT/apps" \
    "$APP_ROOT/packages" \
    "$APP_ROOT/deploy" \
    "$APP_ROOT/scripts" \
    "$APP_ROOT/docker" \
    "$APP_ROOT/config"
  echo "==> Extraction $TAR -> $APP_ROOT"
  tar -xzf "$TAR" -C "$APP_ROOT"
  rm -f "$TAR"
elif [[ "$SKIP_TAR_EXTRACT" != "1" && -n "${1:-}" && ! -f "$TAR" ]]; then
  echo "ERREUR: archive introuvable: $TAR"
  exit 1
fi

find "$APP_ROOT/deploy/gsms" -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true
chmod +x "$APP_ROOT/deploy/gsms"/*.sh 2>/dev/null || true

if [[ "$SKIP_DEPLOY" != "1" ]]; then
  export APP_ROOT GSMS_DIR SKIP_GIT=1 SKIP_DB_INIT=1 REBUILD_WORKER
  echo "==> Rebuild Docker (gsms-app + gsms-worker) + redémarrage..."
  bash "$APP_ROOT/deploy/gsms/deploy.sh"
else
  echo "==> SKIP_DEPLOY=1 (pas de rebuild Docker)"
fi

if [[ "$RUN_DB_INIT" == "1" ]]; then
  echo "==> Prisma migrate + db push (SKIP_SEED=$SKIP_SEED)..."
  export APP_ROOT GSMS_DIR SKIP_SEED RESET_DB="${RESET_DB:-0}"
  bash "$APP_ROOT/deploy/gsms/db-init.sh"
else
  echo "==> RUN_DB_INIT=0 (schéma DB inchangé)"
fi

if [[ "${SKIP_DISK_CLEANUP:-0}" != "1" ]]; then
  echo "==> Nettoyage disque VPS après rebuild..."
  export APP_ROOT GSMS_DIR
  bash "$APP_ROOT/deploy/gsms/vps-disk-cleanup.sh" || true
fi

echo ""
echo "OK rebuild complet"
echo "  App : https://$(grep -E '^DOMAIN=' "$GSMS_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' || echo 'votre-domaine')"
