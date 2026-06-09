#!/bin/bash
# Build images + demarrage conteneurs apps (script generique multi-VPS)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# CRLF Windows -> casse les noms de fonctions bash (exit 127)
find "$SCRIPT_DIR" -maxdepth 1 -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true

# Docs Mintlify : lent + reseau requis — activer via REBUILD_DOCS=1 (deploy-lms -RebuildDocs)
export REBUILD_DOCS="${REBUILD_DOCS:-0}"
export REBUILD_WORKER="${REBUILD_WORKER:-0}"

# shellcheck source=scripts/deploy/_build-gsms-images.sh
source "$SCRIPT_DIR/_build-gsms-images.sh"
# shellcheck source=scripts/deploy/_deploy-maintenance.sh
source "$SCRIPT_DIR/_deploy-maintenance.sh"
# shellcheck source=scripts/deploy/_gsms-storage.sh
source "$SCRIPT_DIR/_gsms-storage.sh"
# shellcheck source=scripts/deploy/_free-app-ports.sh
source "$SCRIPT_DIR/_free-app-ports.sh"

capture_gsms_storage_backup rebuild apps

enable_deploy_maintenance
_deploy_exit() {
  local rc=$?
  disable_deploy_maintenance || true
  if [[ "$rc" -ne 0 ]]; then
    echo "ERREUR: deploy apps interrompu (code $rc) — voir les lignes au-dessus (pas un probleme maintenance)."
  fi
  exit "$rc"
}
trap _deploy_exit EXIT

build_gsms_images

cd "$GSMS_DIR"
free_app_ports
echo "==> Up stack (profile apps)..."
APP_SERVICES=(crm landing)
[[ "${REBUILD_WORKER:-0}" == "1" ]] && APP_SERVICES+=(worker)
[[ "${REBUILD_DOCS:-0}" == "1" ]] && APP_SERVICES+=(docs)
docker compose --profile apps up -d "${APP_SERVICES[@]}"
# shellcheck source=scripts/deploy/_deploy-remote-lib.sh
if [[ -f "$SCRIPT_DIR/_deploy-remote-lib.sh" ]]; then
  # shellcheck source=scripts/deploy/_deploy-remote-lib.sh
  source "$SCRIPT_DIR/_deploy-remote-lib.sh"
fi

docker rm -f gsms-traefik 2>/dev/null || true
if declare -f deploy_install_external_traefik_routes >/dev/null 2>&1; then
  deploy_install_external_traefik_routes
fi

echo "==> Apps via Traefik (labels Docker) :"
grep -E '^DOMAIN=|^CRM_HOST=|^MONITORING_HOST=' "$GSMS_DIR/.env" 2>/dev/null | sed 's/^/    /' || true
echo "    (HTTPS automatique — Let's Encrypt)"

echo "==> Status"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'gsms-crm|gsms-landing|gsms-docs|gsms-worker|NAMES' || true
