#!/bin/bash
# Déploiement GSMS — git pull + build sur VPS + Docker
# Usage depuis /opt/gsms-school après clone :
#   RESET_DB=1 bash deploy/gsms/deploy.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
GIT_REPO="${GIT_REPO:-https://github.com/samiriggui-code/gsms-school-final.git}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========== GSMS deploy =========="
echo "APP_ROOT=$APP_ROOT  GSMS_DIR=$GSMS_DIR"

sync_stack_config() {
  mkdir -p "$GSMS_DIR/homepage/config" "$GSMS_DIR/traefik/dynamic"
  cp -f "$APP_ROOT/deploy/gsms/docker-compose.yml" "$GSMS_DIR/"
  cp -f "$APP_ROOT/deploy/gsms/deploy.sh" "$GSMS_DIR/"
  cp -f "$APP_ROOT/deploy/gsms/db-init.sh" "$GSMS_DIR/"
  cp -rf "$APP_ROOT/deploy/gsms/homepage/config/"* "$GSMS_DIR/homepage/config/"
  cp -f "$APP_ROOT/deploy/gsms/traefik/dynamic/routers.yaml" "$GSMS_DIR/traefik/dynamic/"
  chmod +x "$GSMS_DIR/deploy.sh" "$GSMS_DIR/db-init.sh"
  if [[ ! -f "$GSMS_DIR/.env" ]]; then
    echo "ERREUR: $GSMS_DIR/.env manquant — copiez deploy/gsms/.env avant le premier deploy"
    exit 1
  fi
}

git_sync() {
  if [[ ! -d "$APP_ROOT/.git" ]]; then
    echo "==> Clone $GIT_REPO ..."
    rm -rf "$APP_ROOT"
    git clone "$GIT_REPO" "$APP_ROOT"
  else
    echo "==> git pull ..."
    cd "$APP_ROOT"
    git fetch origin main
    git reset --hard origin/main
  fi
}

build_monorepo() {
  cd "$APP_ROOT"
  echo "==> pnpm install ..."
  corepack enable 2>/dev/null || true
  corepack prepare pnpm@11.5.1 --activate 2>/dev/null || true
  pnpm install --frozen-lockfile

  echo "==> pnpm build (lms-crm standalone) ..."
  pnpm build

  if [[ ! -f apps/lms-crm/.next/standalone/apps/lms-crm/server.js ]]; then
    echo "ERREUR: build standalone manquant"
    exit 1
  fi
}

build_images() {
  local build_args=()
  if [[ "${DOCKER_BUILD_NO_CACHE:-}" == "1" ]]; then
    build_args+=(--no-cache)
  fi

  cd "$APP_ROOT"
  echo "==> Docker build gsms-app ..."
  docker build "${build_args[@]}" \
    -f deploy/gsms/Dockerfile.app \
    -t gsms-app:latest \
    .

  if [[ "${REBUILD_WORKER:-1}" == "1" ]] || ! docker image inspect gsms-worker:latest >/dev/null 2>&1; then
    echo "==> Docker build gsms-worker ..."
    docker build "${build_args[@]}" \
      -f deploy/gsms/Dockerfile.worker \
      -t gsms-worker:latest \
      .
  fi

  docker image prune -f >/dev/null 2>&1 || true
}

reset_db_if_requested() {
  if [[ "${RESET_DB:-0}" != "1" ]]; then
    return 0
  fi
  echo "==> RESET DB ..."
  cd "$GSMS_DIR"
  docker compose stop app worker 2>/dev/null || true
  docker volume rm -f gsms_postgres_data 2>/dev/null || true
}

start_stack() {
  cd "$GSMS_DIR"
  echo "==> Demarrage stack ..."
  docker compose up -d postgres redis minio
  docker compose up -d --force-recreate app worker homepage

  for i in $(seq 1 30); do
    docker exec gsms-postgres pg_isready -U lms -d lms_app >/dev/null 2>&1 && break
    sleep 2
  done
}

init_minio_bucket() {
  local user pass
  user="$(grep -E '^MINIO_ROOT_USER=' "$GSMS_DIR/.env" | cut -d= -f2- | tr -d '\r' || echo lms)"
  pass="$(grep -E '^MINIO_ROOT_PASSWORD=' "$GSMS_DIR/.env" | cut -d= -f2- | tr -d '\r' || true)"
  docker exec gsms-minio mc alias set local http://localhost:9000 "$user" "$pass" 2>/dev/null || true
  docker exec gsms-minio mc mb --ignore-existing local/lms-uploads 2>/dev/null || true
}

install_traefik_routes() {
  local dest="${TRAEFIK_DYNAMIC_DIR:-/opt/traefik/dynamic}/gsms-lms-routes.yaml"
  if [[ -f "$GSMS_DIR/traefik/dynamic/routers.yaml" ]]; then
    mkdir -p "$(dirname "$dest")"
    cp -f "$GSMS_DIR/traefik/dynamic/routers.yaml" "$dest"
    chmod 644 "$dest"
    echo "==> Traefik routes -> $dest"
  fi
}

run_db_init() {
  if [[ "${SKIP_DB_INIT:-0}" == "1" ]]; then
    return 0
  fi
  bash "$GSMS_DIR/db-init.sh"
}

git_sync
sync_stack_config
reset_db_if_requested
build_monorepo
build_images
start_stack
init_minio_bucket
install_traefik_routes
run_db_init

echo ""
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'gsms-|NAMES' || true
echo ""
echo "OK"
echo "  App       : https://hosting-global-it-ss.com"
echo "  Monitoring: https://monitoring.hosting-global-it-ss.com"
