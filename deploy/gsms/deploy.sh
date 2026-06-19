#!/bin/bash
# Déploiement GSMS — build Docker sur VPS + stack compose
#
# Usage (code déjà dans /opt/gsms-school) :
#   SKIP_GIT=1 bash /opt/gsms-school/deploy/gsms/deploy.sh
#
# Variables utiles :
#   SKIP_GIT=1          code via tar/scp (pas de git pull)
#   REBUILD_WORKER=1    rebuild image Playwright/Chromium (défaut : 1)
#   DOCKER_BUILD_NO_CACHE=1
#   SKIP_DB_INIT=1      pas de migrate/seed
#   RESET_DB=1          drop volume postgres (destructif)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
GIT_REPO="${GIT_REPO:-git@github.com:samiriggui-code/gsms-school-final.git}"
GIT_REPO_HTTPS="https://github.com/samiriggui-code/gsms-school-final.git"

echo "========== GSMS deploy =========="
echo "APP_ROOT=$APP_ROOT"
echo "GSMS_DIR=$GSMS_DIR"

normalize_scripts() {
  find "$APP_ROOT/deploy/gsms" -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true
  chmod +x "$APP_ROOT/deploy/gsms"/*.sh 2>/dev/null || true
}

read_env() {
  local key="$1"
  grep -E "^${key}=" "$GSMS_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//'
}

sync_stack_config() {
  mkdir -p "$GSMS_DIR/homepage/config" "$GSMS_DIR/traefik/dynamic"
  cp -f "$APP_ROOT/deploy/gsms/docker-compose.yml" "$GSMS_DIR/"
  cp -f "$APP_ROOT/deploy/gsms/deploy.sh" "$GSMS_DIR/"
  cp -f "$APP_ROOT/deploy/gsms/db-init.sh" "$GSMS_DIR/"
  cp -f "$APP_ROOT/deploy/gsms/docker-cleanup.sh" "$GSMS_DIR/"
  cp -f "$APP_ROOT/deploy/gsms/verify.sh" "$GSMS_DIR/" 2>/dev/null || true
  cp -rf "$APP_ROOT/deploy/gsms/homepage/config/"* "$GSMS_DIR/homepage/config/"
  cp -f "$APP_ROOT/deploy/gsms/traefik/dynamic/routers.yaml" "$GSMS_DIR/traefik/dynamic/"
  chmod +x "$GSMS_DIR/deploy.sh" "$GSMS_DIR/db-init.sh" "$GSMS_DIR/docker-cleanup.sh"
  [[ -f "$GSMS_DIR/verify.sh" ]] && chmod +x "$GSMS_DIR/verify.sh"

  if [[ ! -f "$GSMS_DIR/.env" ]]; then
    echo "ERREUR: $GSMS_DIR/.env manquant."
    echo "  cp deploy/gsms/.env.example → /opt/gsms/.env puis renseigner les secrets"
    echo "  scp deploy/gsms/.env root@VPS:/opt/gsms/.env"
    exit 1
  fi
  chmod 600 "$GSMS_DIR/.env"
}

git_sync() {
  if [[ "${SKIP_GIT:-0}" == "1" ]]; then
    echo "==> SKIP_GIT (code déjà sur le VPS)"
    if [[ ! -f "$APP_ROOT/deploy/gsms/deploy.sh" ]]; then
      echo "ERREUR: $APP_ROOT/deploy/gsms/deploy.sh introuvable — extraire le tar dans $APP_ROOT"
      exit 1
    fi
    return 0
  fi
  if [[ -d "$APP_ROOT/.git" ]]; then
    echo "==> git pull origin main ..."
    cd "$APP_ROOT"
    git remote set-url origin "$GIT_REPO" 2>/dev/null || true
    git fetch origin main
    git reset --hard origin/main
    return 0
  fi
  echo "==> git clone ..."
  mkdir -p "$(dirname "$APP_ROOT")"
  if git clone "$GIT_REPO" "$APP_ROOT" 2>/dev/null; then
    return 0
  fi
  git clone "$GIT_REPO_HTTPS" "$APP_ROOT"
}

build_images() {
  local build_args=()
  local domain site_url
  if [[ "${DOCKER_BUILD_NO_CACHE:-}" == "1" ]]; then
    build_args+=(--no-cache)
  fi

  domain="$(read_env DOMAIN)"
  domain="${domain:-hosting-global-it-ss.com}"
  site_url="$(read_env NEXT_PUBLIC_SITE_URL)"
  site_url="${site_url:-https://${domain}}"
  if [[ -z "$(read_env NEXT_PUBLIC_SITE_URL)" ]]; then
    echo "==> NEXT_PUBLIC_SITE_URL dérivé de DOMAIN (${site_url})"
  fi

  cd "$APP_ROOT"
  echo "==> Docker build gsms-app (Next.js standalone, DOMAIN=${domain}) ..."
  docker build "${build_args[@]}" \
    --build-arg "DOMAIN=${domain}" \
    --build-arg "NEXT_PUBLIC_SITE_URL=${site_url}" \
    -f deploy/gsms/Dockerfile.app \
    -t gsms-app:latest \
    .

  if [[ "${REBUILD_WORKER:-1}" == "1" ]] || ! docker image inspect gsms-worker:latest >/dev/null 2>&1; then
    echo "==> Docker build gsms-worker (Playwright + Chromium, rapports PDF) ..."
    docker build "${build_args[@]}" \
      -f deploy/gsms/Dockerfile.worker \
      -t gsms-worker:latest \
      .
  else
    echo "==> gsms-worker déjà présent (REBUILD_WORKER=1 pour forcer)"
  fi

  echo "==> Nettoyage Docker (images dangling uniquement — pas gsms-app/worker) ..."
  docker image prune -f >/dev/null 2>&1 || true
  if [[ "${DOCKER_PRUNE_BUILD_CACHE:-1}" == "1" ]]; then
    docker builder prune -af >/dev/null 2>&1 || true
  fi
  docker container prune -f >/dev/null 2>&1 || true
  df -h / | tail -1 || true

  if ! docker image inspect gsms-app:latest >/dev/null 2>&1; then
    echo "ERREUR: gsms-app:latest introuvable apres build"
    exit 1
  fi
  if ! docker image inspect gsms-worker:latest >/dev/null 2>&1; then
    echo "ERREUR: gsms-worker:latest introuvable apres build"
    exit 1
  fi
}

reset_db_if_requested() {
  if [[ "${RESET_DB:-0}" != "1" ]]; then
    return 0
  fi
  echo "==> RESET DB (volume postgres) ..."
  cd "$GSMS_DIR"
  docker compose stop app worker 2>/dev/null || true
  docker volume rm -f gsms_postgres_data 2>/dev/null || true
}

pre_build_cleanup() {
  if [[ "${SKIP_DOCKER_CLEANUP:-0}" == "1" ]]; then
    return 0
  fi
  echo "==> Nettoyage disque Docker avant build ..."
  AGGRESSIVE="${DOCKER_CLEANUP_AGGRESSIVE:-1}" \
    KEEP_CACHE_HOURS="${DOCKER_KEEP_CACHE_HOURS:-0}" \
    bash "$APP_ROOT/deploy/gsms/docker-cleanup.sh" || true
  rm -f /tmp/gsms-school.tar.gz 2>/dev/null || true
}

start_stack() {
  cd "$GSMS_DIR"
  echo "==> Demarrage stack infra ..."
  docker compose up -d postgres redis minio
  for i in $(seq 1 30); do
    docker exec gsms-postgres pg_isready -U "${POSTGRES_USER:-lms}" -d "${POSTGRES_DB:-lms_app}" >/dev/null 2>&1 && break
    sleep 2
  done

  echo "==> Image monitoring (homepage) ..."
  docker compose pull homepage

  echo "==> Demarrage app + worker (images locales) ..."
  docker compose up -d --force-recreate app worker

  echo "==> Demarrage homepage ..."
  docker compose up -d --force-recreate homepage
}

init_minio_bucket() {
  local user pass bucket
  user="$(read_env MINIO_ROOT_USER)"
  user="${user:-lms}"
  pass="$(read_env MINIO_ROOT_PASSWORD)"
  bucket="$(read_env STORAGE_BUCKET)"
  bucket="${bucket:-lms-uploads}"
  docker exec gsms-minio mc alias set local http://localhost:9000 "$user" "$pass" 2>/dev/null || true
  docker exec gsms-minio mc mb --ignore-existing "local/${bucket}" 2>/dev/null || true
  if [[ -f "$APP_ROOT/deploy/gsms/scripts/init-storage-socle.sh" ]]; then
    echo "==> Arborescence socle MinIO/S3 ..."
    bash "$APP_ROOT/deploy/gsms/scripts/init-storage-socle.sh" "$GSMS_DIR/.env" || true
  fi
}

install_traefik_routes() {
  local dest="${TRAEFIK_DYNAMIC_DIR:-/opt/traefik/dynamic}/gsms-lms-routes.yaml"
  local domain monitoring
  domain="$(read_env DOMAIN)"
  domain="${domain:-hosting-global-it-ss.com}"
  monitoring="$(read_env MONITORING_HOST)"
  monitoring="${monitoring:-monitoring.${domain}}"

  if [[ -f "$APP_ROOT/deploy/gsms/traefik/dynamic/routers.yaml" ]]; then
    mkdir -p "$(dirname "$dest")"
    sed -e "s/__DOMAIN__/${domain}/g" -e "s/__MONITORING_HOST__/${monitoring}/g" \
      "$APP_ROOT/deploy/gsms/traefik/dynamic/routers.yaml" > "$dest"
    chmod 644 "$dest"
    echo "==> Traefik file routes → $dest (${domain})"
  fi
}

run_db_init() {
  if [[ "${SKIP_DB_INIT:-0}" == "1" ]]; then
    return 0
  fi
  APP_ROOT="$APP_ROOT" GSMS_ENV="$GSMS_DIR/.env" bash "$GSMS_DIR/db-init.sh"
}

verify_deploy() {
  if [[ -f "$GSMS_DIR/verify.sh" ]]; then
    bash "$GSMS_DIR/verify.sh" || true
  fi
}

normalize_scripts
git_sync
sync_stack_config
normalize_scripts
sed -i 's/\r$//' "$GSMS_DIR/docker-compose.yml" 2>/dev/null || true
reset_db_if_requested
pre_build_cleanup
build_images
start_stack
init_minio_bucket
install_traefik_routes
run_db_init
verify_deploy

DOMAIN="$(read_env DOMAIN)"
DOMAIN="${DOMAIN:-hosting-global-it-ss.com}"
MONITORING="$(read_env MONITORING_HOST)"
MONITORING="${MONITORING:-monitoring.${DOMAIN}}"

echo ""
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'gsms-|NAMES' || true
echo ""
echo "OK"
echo "  App         : https://${DOMAIN}"
echo "  Connexion   : https://${DOMAIN}/signin"
echo "  Docs        : https://${DOMAIN}/docs"
echo "  Monitoring  : https://${MONITORING}"
