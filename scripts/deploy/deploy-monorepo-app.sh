#!/bin/bash
# Deploiement app unique lms-crm + worker — ZERO landing/docs separes
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=scripts/deploy/_build-gsms-images.sh
source "$SCRIPT_DIR/_build-gsms-images.sh"
# shellcheck source=scripts/deploy/_deploy-maintenance.sh
source "$SCRIPT_DIR/_deploy-maintenance.sh"
# shellcheck source=scripts/deploy/_gsms-storage.sh
source "$SCRIPT_DIR/_gsms-storage.sh"

capture_gsms_storage_backup rebuild rebuild

enable_deploy_maintenance
trap disable_deploy_maintenance EXIT

echo "==> Purge ancienne archi (landing / docs / ancien crm)..."
docker rm -f gsms-landing gsms-docs gsms-crm 2>/dev/null || true
docker rmi gsms-landing:latest gsms-docs:latest gsms-crm:latest 2>/dev/null || true

build_gsms_images

cd "$GSMS_DIR"
echo "==> Demarrage app unique + worker..."
docker compose --profile apps up -d --force-recreate app worker

echo "==> Status"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'gsms-app|gsms-worker|NAMES' || true
echo "OK — monorepo lms-crm deploye."
