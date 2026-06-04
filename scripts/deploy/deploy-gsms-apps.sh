#!/bin/bash
# Build images + demarrage conteneurs apps (script generique multi-VPS)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export REBUILD_DOCS=1
export REBUILD_WORKER=1

# shellcheck source=scripts/deploy/_build-gsms-images.sh
source "$SCRIPT_DIR/_build-gsms-images.sh"
# shellcheck source=scripts/deploy/_deploy-maintenance.sh
source "$SCRIPT_DIR/_deploy-maintenance.sh"
# shellcheck source=scripts/deploy/_gsms-storage.sh
source "$SCRIPT_DIR/_gsms-storage.sh"

capture_gsms_storage_backup rebuild apps

enable_deploy_maintenance
trap disable_deploy_maintenance EXIT

build_gsms_images

cd "$GSMS_DIR"
echo "==> Up stack (profile apps)..."
if [[ "${REBUILD_DOCS:-0}" == "1" ]]; then
  docker compose --profile apps up -d crm docs landing worker
else
  docker compose --profile apps up -d crm landing worker
fi
docker compose up -d traefik

echo "==> Status"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'gsms-crm|gsms-docs|gsms-landing|gsms-traefik|gsms-worker|NAMES'
