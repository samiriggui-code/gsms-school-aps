#!/bin/bash
# Rebuild images + redemarrage conteneurs apps (sans migrations Prisma par defaut)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=scripts/deploy/_build-gsms-images.sh
source "$SCRIPT_DIR/_build-gsms-images.sh"
# shellcheck source=scripts/deploy/_deploy-maintenance.sh
source "$SCRIPT_DIR/_deploy-maintenance.sh"
# shellcheck source=scripts/deploy/_gsms-storage.sh
source "$SCRIPT_DIR/_gsms-storage.sh"
# shellcheck source=scripts/deploy/_free-app-ports.sh
source "$SCRIPT_DIR/_free-app-ports.sh"

capture_gsms_storage_backup rebuild rebuild

enable_deploy_maintenance
trap disable_deploy_maintenance EXIT

build_gsms_images

cd "$GSMS_DIR"
free_app_ports
echo "==> Arret anciennes apps (landing / docs separees)..."
docker rm -f gsms-landing gsms-docs 2>/dev/null || true

SERVICES=(crm)
[[ "${REBUILD_WORKER:-1}" == "1" ]] && SERVICES+=(worker)

echo "==> Redemarrage conteneurs (${SERVICES[*]})..."
docker compose --profile apps up -d --force-recreate "${SERVICES[@]}"
docker compose up -d caddy 2>/dev/null || true

echo "==> Status"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'gsms-crm|gsms-worker|NAMES' || true
echo "OK rebuild images."
