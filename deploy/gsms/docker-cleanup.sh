#!/bin/bash
# Nettoyage disque Docker — images dangling, cache build, volumes orphelins
# Usage : bash deploy/gsms/docker-cleanup.sh
#   AGGRESSIVE=1  → supprime tout le cache build (pas seulement >48h)
set -euo pipefail

AGGRESSIVE="${AGGRESSIVE:-0}"
KEEP_CACHE_HOURS="${KEEP_CACHE_HOURS:-48}"

echo "========== Docker cleanup =========="
echo "Avant :"
df -h / | tail -1
docker system df 2>/dev/null || true
echo ""

echo "==> Conteneurs arretes..."
docker container prune -f >/dev/null 2>&1 || true

echo "==> Images non utilisees..."
docker image prune -af >/dev/null 2>&1 || true

echo "==> Cache build Docker..."
if [[ "$AGGRESSIVE" == "1" ]]; then
  docker builder prune -af >/dev/null 2>&1 || true
else
  docker builder prune -af --filter "until=${KEEP_CACHE_HOURS}h" >/dev/null 2>&1 || true
fi

echo "==> Volumes orphelins (sans conteneur)..."
docker volume prune -f >/dev/null 2>&1 || true

echo "==> Reseaux orphelins..."
docker network prune -f >/dev/null 2>&1 || true

echo ""
echo "Apres :"
df -h / | tail -1
docker system df 2>/dev/null || true
echo "OK"
