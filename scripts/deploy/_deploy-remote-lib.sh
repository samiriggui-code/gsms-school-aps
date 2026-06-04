#!/bin/bash
# Helpers partages par deploy-lms-remote.sh et install-docker-vps.sh
# Ne pas executer seul.
set -euo pipefail

deploy_normalize_scripts() {
  local app_root="${APP_ROOT:-/opt/app-prisma}"
  local files=(
    "${INSTALL_DOCKER_SCRIPT:-/tmp/install-docker-vps.sh}"
    "${PREPARE_VPS_SCRIPT:-/tmp/prepare-vps.sh}"
    /tmp/deploy-lms-remote.sh
    "${DEPLOY_LIB:-/tmp/_deploy-remote-lib.sh}"
  )
  for f in "${files[@]}"; do
    if [[ -f "$f" ]]; then
      sed -i 's/\r$//' "$f" 2>/dev/null || true
    fi
  done
  if [[ -d "$app_root/scripts/deploy" ]]; then
    find "$app_root/scripts/deploy" -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true
    chmod +x "$app_root/scripts/deploy"/*.sh 2>/dev/null || true
  fi
}

deploy_load_gsms_env() {
  local gsms_dir="${GSMS_DIR:-/opt/gsms}"
  POSTGRES_USER="${POSTGRES_USER:-lms}"
  POSTGRES_DB="${POSTGRES_DB:-lms_app}"
  if [[ -f "$gsms_dir/.env" ]]; then
    local u db
    u=$(grep -E '^POSTGRES_USER=' "$gsms_dir/.env" | head -1 | cut -d= -f2- | tr -d '\r"' | xargs || true)
    db=$(grep -E '^POSTGRES_DB=' "$gsms_dir/.env" | head -1 | cut -d= -f2- | tr -d '\r"' | xargs || true)
    [[ -n "$u" ]] && POSTGRES_USER="$u"
    [[ -n "$db" ]] && POSTGRES_DB="$db"
  fi
  export POSTGRES_USER POSTGRES_DB
}

deploy_wait_postgres() {
  local max="${1:-60}"
  deploy_load_gsms_env
  local i
  for ((i = 1; i <= max; i++)); do
    if docker exec gsms-postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
      echo "==> Postgres pret (tentative $i)"
      return 0
    fi
    if (( i % 5 == 0 )); then
      echo "  ... attente Postgres ($i/${max}) — demarrage conteneur si besoin"
      docker compose up -d postgres 2>/dev/null || true
    fi
    sleep 2
  done
  echo "ERREUR: Postgres (gsms-postgres) non pret apres $((max * 2))s"
  echo "  Verifiez: docker ps -a | grep postgres"
  docker logs gsms-postgres --tail 50 2>/dev/null || true
  return 1
}

deploy_compose_up_infra() {
  local gsms_dir="${GSMS_DIR:-/opt/gsms}"
  local monitoring="${DEPLOY_MONITORING:-true}"
  cd "$gsms_dir"
  echo "==> Pull images infra..."
  docker compose pull
  echo "==> Demarrage infra..."
  if [[ "$monitoring" == "true" ]]; then
    docker compose up -d
  else
    docker compose up -d traefik maintenance postgres redis minio
  fi
}

deploy_ensure_compose_network() {
  docker network inspect gsms >/dev/null 2>&1 || docker compose up -d postgres 2>/dev/null || true
}
