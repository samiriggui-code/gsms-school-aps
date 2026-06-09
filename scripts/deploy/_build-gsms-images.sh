#!/bin/bash
# Build images GSMS sur le VPS (sourcé par les scripts apps/rebuild)
# Env : REBUILD_DOCS=1 pour Mintlify (lent) · DOCKER_BUILD_NO_CACHE=1 · REBUILD_WORKER=0 pour ignorer worker
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"

# Source de vérité : monorepo (sync tar). /opt/gsms peut être plus récent après étape infra
# mais le build utilise APP_ROOT comme contexte — on aligne les Dockerfiles après sync.
if [[ -z "${DOCKERFILES:-}" ]]; then
  if [[ -f "$APP_ROOT/deploy/gsms/Dockerfile.crm" ]]; then
    DOCKERFILES="$APP_ROOT/deploy/gsms"
  elif [[ -f "$GSMS_DIR/Dockerfile.crm" ]]; then
    DOCKERFILES="$GSMS_DIR"
  else
    echo "ERREUR: Dockerfile.crm introuvable sous $APP_ROOT/deploy/gsms et $GSMS_DIR"
    exit 1
  fi
fi

sync_dockerfiles_to_gsms_dir() {
  if [[ -d "$APP_ROOT/deploy/gsms" && -d "$GSMS_DIR" ]]; then
    cp -f "$APP_ROOT/deploy/gsms"/Dockerfile.* "$GSMS_DIR/" 2>/dev/null || true
  fi
}

BUILD_EXTRA=()
if [[ "${DOCKER_BUILD_NO_CACHE:-}" == "1" ]]; then
  BUILD_EXTRA+=(--no-cache)
  echo "==> docker build --no-cache"
fi

build_image() {
  local tag="$1"
  local file="$2"
  echo "==> Build gsms-${tag} (logs détaillés ci-dessous)..."
  # --progress=plain : affiche la sortie pnpm/npm en cas d'échec (terminal cockpit / SSH)
  docker build --progress=plain "${BUILD_EXTRA[@]}" -f "$DOCKERFILES/Dockerfile.${file}" -t "gsms-${tag}:latest" "$APP_ROOT"
}

build_gsms_images() {
  if ! docker info >/dev/null 2>&1; then
    echo "ERREUR: daemon Docker indisponible"
    exit 1
  fi
  sync_dockerfiles_to_gsms_dir
  cd "$APP_ROOT"
  build_image crm crm
  build_image landing landing
  if [[ "${REBUILD_WORKER:-0}" == "1" ]]; then
    build_image worker worker
  fi
  if [[ "${REBUILD_DOCS:-0}" == "1" ]]; then
    build_image docs docs
  else
    echo "==> Skip gsms-docs (REBUILD_DOCS=1 pour inclure Mintlify)"
  fi
}
