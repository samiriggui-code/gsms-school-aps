#!/bin/bash
# Build images : gsms-app (lms-crm) + gsms-worker
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/gsms-school}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"

if [[ -z "${DOCKERFILES:-}" ]]; then
  if [[ -f "$APP_ROOT/deploy/gsms/Dockerfile.app" ]]; then
    DOCKERFILES="$APP_ROOT/deploy/gsms"
  elif [[ -f "$GSMS_DIR/Dockerfile.app" ]]; then
    DOCKERFILES="$GSMS_DIR"
  else
    echo "ERREUR: Dockerfile.app introuvable"
    exit 1
  fi
fi

sync_dockerfiles_to_gsms_dir() {
  if [[ -d "$APP_ROOT/deploy/gsms" && -d "$GSMS_DIR" ]]; then
    cp -f "$APP_ROOT/deploy/gsms"/Dockerfile.app "$APP_ROOT/deploy/gsms"/Dockerfile.worker "$GSMS_DIR/" 2>/dev/null || true
  fi
}

BUILD_EXTRA=()
if [[ "${DOCKER_BUILD_NO_CACHE:-}" == "1" ]]; then
  BUILD_EXTRA+=(--no-cache)
fi

build_image() {
  local tag="$1"
  local file="$2"
  echo "==> Build gsms-${tag}:latest ..."
  docker build --progress=plain "${BUILD_EXTRA[@]}" -f "$DOCKERFILES/Dockerfile.${file}" -t "gsms-${tag}:latest" "$APP_ROOT"
}

build_gsms_images() {
  if ! docker info >/dev/null 2>&1; then
    echo "ERREUR: Docker indisponible"
    exit 1
  fi
  sync_dockerfiles_to_gsms_dir
  cd "$APP_ROOT"
  if [[ ! -f apps/lms-crm/.next/standalone/apps/lms-crm/server.js ]]; then
    echo "ERREUR: build local manquant — lancez pnpm build sur le PC avant deploy"
    exit 1
  fi
  build_image app app
  if [[ "${REBUILD_WORKER:-1}" == "1" ]]; then
    build_image worker worker
  fi
}
