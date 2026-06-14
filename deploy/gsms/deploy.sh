#!/bin/bash
# Déploiement VPS from scratch — stack minimale GSMS
# Usage: RESET_DB=1 REBUILD_WORKER=1 bash deploy/gsms/deploy.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========== GSMS deploy (stack minimale) =========="
echo "APP_ROOT=$APP_ROOT  GSMS_DIR=$GSMS_DIR"

purge_legacy() {
  echo "==> Suppression ancienne stack GSMS..."
  local containers=(
    gsms-landing gsms-crm gsms-docs gsms-maintenance
    gsms-portainer gsms-netdata gsms-uptime-kuma
    gsms-app gsms-worker
  )
  for c in "${containers[@]}"; do
    docker rm -f "$c" 2>/dev/null || true
  done
  docker rmi gsms-landing:latest gsms-crm:latest gsms-docs:latest 2>/dev/null || true

  echo "==> Suppression volumes lourds inutiles..."
  docker volume rm -f \
    gsms_portainer_data gsms_uptime_kuma_data \
    gsms_netdata_config gsms_netdata_lib gsms_netdata_cache 2>/dev/null || true

  echo "==> Prune images dangling..."
  docker image prune -f >/dev/null 2>&1 || true
}

reset_db_if_requested() {
  if [[ "${RESET_DB:-0}" != "1" ]]; then
    return 0
  fi
  echo "==> RESET DB : suppression volume postgres..."
  cd "$GSMS_DIR"
  docker compose stop app worker 2>/dev/null || true
  docker volume rm -f gsms_postgres_data 2>/dev/null || docker volume rm gsms_postgres_data 2>/dev/null || true
}

build_images() {
  local build_args=()
  if [[ "${DOCKER_BUILD_NO_CACHE:-}" == "1" ]]; then
    build_args+=(--no-cache)
  fi

  if [[ ! -f "$APP_ROOT/apps/lms-crm/.next/standalone/apps/lms-crm/server.js" ]]; then
    echo "ERREUR: build Next manquant — lancez pnpm build en local avant deploy"
    exit 1
  fi

  echo "==> Build gsms-app:latest (runtime standalone)..."
  docker build "${build_args[@]}" \
    -f "$APP_ROOT/deploy/gsms/Dockerfile.app" \
    -t gsms-app:latest \
    "$APP_ROOT"

  if [[ "${REBUILD_WORKER:-0}" == "1" ]]; then
    echo "==> Build gsms-worker:latest..."
    docker build "${build_args[@]}" \
      -f "$APP_ROOT/deploy/gsms/Dockerfile.worker" \
      -t gsms-worker:latest \
      "$APP_ROOT"
  fi

  docker image prune -f >/dev/null 2>&1 || true
}

start_stack() {
  cd "$GSMS_DIR"
  echo "==> Demarrage infra + app + worker + homepage..."
  docker compose up -d postgres redis minio
  if [[ "${REBUILD_WORKER:-0}" == "1" ]]; then
    docker compose up -d --force-recreate app worker homepage
  else
    docker compose up -d --force-recreate app homepage
    docker compose up -d worker 2>/dev/null || true
  fi

  echo "==> Attente postgres..."
  for i in $(seq 1 30); do
    if docker exec gsms-postgres pg_isready -U lms -d lms_app >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
}

init_minio_bucket() {
  if docker exec gsms-minio mc alias set local http://localhost:9000 "${MINIO_ROOT_USER:-lms}" "${MINIO_ROOT_PASSWORD:-}" 2>/dev/null; then
    docker exec gsms-minio mc mb --ignore-existing local/lms-uploads 2>/dev/null || true
  else
    echo "AVERTISSEMENT: bucket MinIO — configurez manuellement si besoin"
  fi
}

install_traefik_routes() {
  local routes_src="$GSMS_DIR/traefik/dynamic/routers.yaml"
  local routes_dest="${TRAEFIK_DYNAMIC_DIR:-/opt/traefik/dynamic}/gsms-lms-routes.yaml"

  if [[ ! -f "$routes_src" ]]; then
    routes_src="$APP_ROOT/deploy/gsms/traefik/dynamic/routers.yaml"
  fi
  if [[ ! -f "$routes_src" ]]; then
    echo "AVERTISSEMENT: routers.yaml introuvable"
    return 0
  fi

  echo "==> Publication routes Traefik -> $routes_dest"
  mkdir -p "$(dirname "$routes_dest")"
  cp -f "$routes_src" "$routes_dest"
  chmod 644 "$routes_dest"
}

run_db_init() {
  if [[ "${SKIP_DB_INIT:-0}" == "1" ]]; then
    return 0
  fi
  echo "==> Init DB (migrate + seed)..."
  bash "$SCRIPT_DIR/db-init.sh"
}

purge_legacy
reset_db_if_requested
build_images
start_stack

if [[ -f "$GSMS_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^(MINIO_ROOT_USER|MINIO_ROOT_PASSWORD|TRAEFIK_DYNAMIC_DIR)=' "$GSMS_DIR/.env" | tr -d '\r' || true)
  set +a
fi

init_minio_bucket
install_traefik_routes
run_db_init

echo ""
echo "==> Status"
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'gsms-|NAMES' || true
echo ""
echo "OK — https://hosting-global-it-ss.com"
echo "     https://monitoring.hosting-global-it-ss.com (homepage)"
