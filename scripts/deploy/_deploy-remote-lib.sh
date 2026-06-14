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

deploy_is_external_traefik() {
  local gsms_dir="${GSMS_DIR:-/opt/gsms}"
  if [[ "${DEPLOY_EXTERNAL_TRAEFIK:-}" == "true" || "${DEPLOY_EXTERNAL_TRAEFIK:-}" == "1" ]]; then
    return 0
  fi
  if [[ -f "$gsms_dir/.env" ]]; then
    grep -qE '^EXTERNAL_TRAEFIK=(true|1)' "$gsms_dir/.env" 2>/dev/null && return 0
  fi
  return 1
}

deploy_install_external_traefik_routes() {
  if ! deploy_is_external_traefik; then
    return 0
  fi
  local script="${APP_ROOT:-/opt/app-prisma}/scripts/deploy/install-external-traefik-routes.sh"
  if [[ ! -f "$script" ]]; then
    script="/tmp/install-external-traefik-routes.sh"
  fi
  if [[ -f "$script" ]]; then
    chmod +x "$script" 2>/dev/null || true
    GSMS_DIR="${GSMS_DIR:-/opt/gsms}" APP_ROOT="${APP_ROOT:-/opt/app-prisma}" bash "$script"
  else
    echo "AVERTISSEMENT: install-external-traefik-routes.sh introuvable"
  fi
}

deploy_gsms_infra_services() {
  local monitoring="${1:-true}"
  # Liste explicite — ne jamais lancer gsms-traefik meme si l ancien compose le contient encore
  local -a svcs=(maintenance postgres redis minio)
  if [[ "$monitoring" == "true" ]]; then
    svcs+=(homepage portainer uptime-kuma netdata)
  fi
  docker compose up -d "${svcs[@]}"
}

deploy_purge_gsms_traefik() {
  local gsms_dir="${GSMS_DIR:-/opt/gsms}"
  docker rm -f gsms-traefik 2>/dev/null || true
  local compose="$gsms_dir/docker-compose.yml"
  local fresh="${APP_ROOT:-}/deploy/gsms/docker-compose.yml"
  if [[ -f "$fresh" ]] && grep -qE 'gsms-traefik|container_name:\s*gsms-traefik' "$compose" 2>/dev/null; then
    echo "==> Remplacement docker-compose.yml (suppression Traefik integre)"
    cp -f "$fresh" "$compose"
  elif grep -qE 'gsms-traefik|container_name:\s*gsms-traefik' "$compose" 2>/dev/null; then
    echo "AVERTISSEMENT: compose VPS contient encore Traefik — relancez etape 2 depuis le PC (compose a jour)"
  fi
}

deploy_compose_up_infra() {
  local gsms_dir="${GSMS_DIR:-/opt/gsms}"
  local monitoring="${DEPLOY_MONITORING:-true}"
  cd "$gsms_dir"
  deploy_purge_gsms_traefik
  echo "==> Pull images infra..."
  docker compose pull maintenance postgres redis minio homepage portainer uptime-kuma netdata 2>/dev/null \
    || docker compose pull maintenance postgres redis minio
  echo "==> Demarrage infra (sans Traefik GSMS — hPanel / reverse proxy existant)..."
  deploy_gsms_infra_services "$monitoring"
  deploy_install_external_traefik_routes
}

deploy_ensure_compose_network() {
  docker network inspect gsms >/dev/null 2>&1 || docker compose up -d postgres 2>/dev/null || true
}
