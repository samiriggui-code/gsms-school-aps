#!/bin/bash
# Nettoyage disque VPS après deploy/rebuild — archives, backups .env, Docker, journaux.
#
# Usage :
#   bash /opt/gsms-school/deploy/gsms/vps-disk-cleanup.sh
#
# Variables :
#   SKIP_DISK_CLEANUP=1       désactive tout le nettoyage
#   ENV_BACKUP_KEEP_DAYS=14   conserve les N derniers jours de .env.backup.*
#   DOCKER_CLEANUP_AGGRESSIVE=1  purge cache build Docker (défaut post-rebuild)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
ENV_BACKUP_KEEP_DAYS="${ENV_BACKUP_KEEP_DAYS:-14}"

if [[ "${SKIP_DISK_CLEANUP:-0}" == "1" ]]; then
  echo "==> SKIP_DISK_CLEANUP=1 (nettoyage disque ignoré)"
  exit 0
fi

echo "========== Nettoyage disque VPS =========="
echo "Avant :"
df -h / | tail -1
docker system df 2>/dev/null || true
echo ""

echo "==> Archives temporaires (/tmp)..."
rm -f /tmp/gsms-school-deploy.tar.gz /tmp/gsms-school.tar.gz 2>/dev/null || true
find /tmp -maxdepth 1 -name 'gsms-school*.tar.gz' -delete 2>/dev/null || true
find /tmp -maxdepth 1 -name '*.tar.gz' -mtime +1 -delete 2>/dev/null || true

echo "==> Backups .env > ${ENV_BACKUP_KEEP_DAYS}j..."
find "$GSMS_DIR" -maxdepth 1 -name '.env.backup.*' -mtime +"${ENV_BACKUP_KEEP_DAYS}" -delete 2>/dev/null || true

cleanup_script=""
if [[ -f "$APP_ROOT/deploy/gsms/docker-cleanup.sh" ]]; then
  cleanup_script="$APP_ROOT/deploy/gsms/docker-cleanup.sh"
elif [[ -f "$GSMS_DIR/docker-cleanup.sh" ]]; then
  cleanup_script="$GSMS_DIR/docker-cleanup.sh"
fi

if [[ -n "$cleanup_script" ]]; then
  echo "==> Docker (images dangling, cache build, volumes orphelins)..."
  AGGRESSIVE="${DOCKER_CLEANUP_AGGRESSIVE:-1}" \
    KEEP_CACHE_HOURS="${DOCKER_KEEP_CACHE_HOURS:-0}" \
    bash "$cleanup_script" || true
else
  echo "AVERTISSEMENT: docker-cleanup.sh introuvable"
fi

echo "==> Journaux système (> 7 jours)..."
journalctl --vacuum-time=7d >/dev/null 2>&1 || true

echo "==> Cache apt..."
apt-get clean >/dev/null 2>&1 || true

echo ""
echo "Après nettoyage disque :"
df -h / | tail -1
docker system df 2>/dev/null || true
echo "OK disk cleanup"
