#!/bin/bash
# Execute sur le VPS (appele par deploy-lms.ps1)
# DEPLOY_MODE: full | infra_only | apps_only | rebuild_only
set -euo pipefail

GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
DEPLOY_MODE="${DEPLOY_MODE:-full}"
DEPLOY_RUNTIME="${DEPLOY_RUNTIME:-docker-compose}"
DEPLOY_APPS="${DEPLOY_APPS:-false}"
DEPLOY_MIGRATE="${DEPLOY_MIGRATE:-false}"
DEPLOY_MONITORING="${DEPLOY_MONITORING:-true}"
DEPLOY_BOOTSTRAP_INFRA="${DEPLOY_BOOTSTRAP_INFRA:-false}"
INSTALL_DOCKER_SCRIPT="${INSTALL_DOCKER_SCRIPT:-/tmp/install-docker-vps.sh}"
PREPARE_VPS_SCRIPT="${PREPARE_VPS_SCRIPT:-/tmp/prepare-vps.sh}"
DEPLOY_LIB="${DEPLOY_LIB:-/tmp/_deploy-remote-lib.sh}"
SKIP_VPS_PREPARE="${SKIP_VPS_PREPARE:-false}"

# Lib partagee (scp par deploy-lms.ps1)
for lib in "$DEPLOY_LIB" "$APP_ROOT/scripts/deploy/_deploy-remote-lib.sh" "$APP_ROOT/scripts/_deploy-remote-lib.sh"; do
  if [[ -f "$lib" ]]; then
    # shellcheck source=/dev/null
    source "$lib"
    break
  fi
done

if declare -f deploy_normalize_scripts >/dev/null 2>&1; then
  export APP_ROOT INSTALL_DOCKER_SCRIPT PREPARE_VPS_SCRIPT DEPLOY_LIB
  deploy_normalize_scripts
else
  echo "AVERTISSEMENT: _deploy-remote-lib.sh introuvable — normalisation CRLF limitee"
  for f in "$INSTALL_DOCKER_SCRIPT" "$PREPARE_VPS_SCRIPT" /tmp/deploy-lms-remote.sh; do
    [[ -f "$f" ]] && sed -i 's/\r$//' "$f" 2>/dev/null || true
  done
fi

ensure_docker() {
  if [[ ! -f "$INSTALL_DOCKER_SCRIPT" ]]; then
    if docker info >/dev/null 2>&1; then
      echo "==> Docker OK : $(docker --version 2>/dev/null || echo '?')"
      return 0
    fi
    echo "ERREUR: Docker indisponible et $INSTALL_DOCKER_SCRIPT introuvable sur le VPS"
    exit 1
  fi

  if [[ "$DEPLOY_MODE" == "apps_only" ]]; then
    export DOCKER_UPGRADE="${DOCKER_UPGRADE:-skip}"
  else
    export DOCKER_UPGRADE="${DOCKER_UPGRADE:-auto}"
  fi

  echo "==> Verification / reparation Docker (install-docker-vps.sh)..."
  chmod +x "$INSTALL_DOCKER_SCRIPT" 2>/dev/null || true
  bash "$INSTALL_DOCKER_SCRIPT"

  if ! docker info >/dev/null 2>&1; then
    echo "ERREUR: daemon Docker indisponible apres install-docker-vps.sh"
    exit 1
  fi
  echo "==> Docker OK : $(docker --version 2>/dev/null || echo '?')"
  docker compose version 2>/dev/null | head -1 || true
}

run_pm2_apps() {
  local pm2_script="$APP_ROOT/scripts/deploy/deploy-pm2-apps.sh"
  if [[ ! -f "$pm2_script" ]]; then
    echo "ERREUR: script PM2 introuvable: $pm2_script"
    exit 1
  fi
  export APP_ROOT
  bash "$pm2_script"
}

run_systemd_apps() {
  local systemd_script="$APP_ROOT/scripts/deploy/deploy-systemd-apps.sh"
  if [[ ! -f "$systemd_script" ]]; then
    echo "ERREUR: script systemd introuvable: $systemd_script"
    exit 1
  fi
  export APP_ROOT
  bash "$systemd_script"
}

run_python_apps() {
  local py_script="$APP_ROOT/scripts/deploy/deploy-python-apps.sh"
  if [[ ! -f "$py_script" ]]; then
    echo "ERREUR: script python introuvable: $py_script"
    exit 1
  fi
  export APP_ROOT
  bash "$py_script"
}

run_php_fpm_apps() {
  local php_script="$APP_ROOT/scripts/deploy/deploy-php-fpm-apps.sh"
  if [[ ! -f "$php_script" ]]; then
    echo "ERREUR: script php-fpm introuvable: $php_script"
    exit 1
  fi
  export APP_ROOT
  bash "$php_script"
}

run_go_apps() {
  local go_script="$APP_ROOT/scripts/deploy/deploy-go-apps.sh"
  if [[ ! -f "$go_script" ]]; then
    echo "ERREUR: script go introuvable: $go_script"
    exit 1
  fi
  export APP_ROOT
  bash "$go_script"
}

run_static_apps() {
  local static_script="$APP_ROOT/scripts/deploy/deploy-static-apps.sh"
  if [[ ! -f "$static_script" ]]; then
    echo "ERREUR: script static introuvable: $static_script"
    exit 1
  fi
  export APP_ROOT
  bash "$static_script"
}

if [[ "$SKIP_VPS_PREPARE" != "true" && "$DEPLOY_MODE" != "apps_only" ]]; then
  if [[ -f "$PREPARE_VPS_SCRIPT" ]]; then
    echo "==> Preparation VPS (apt upgrade, UFW 22/80/443, fail2ban)..."
    GSMS_DIR="$GSMS_DIR" bash "$PREPARE_VPS_SCRIPT"
  else
    echo "AVERTISSEMENT: $PREPARE_VPS_SCRIPT introuvable — skip preparation OS/firewall"
  fi
elif [[ "$DEPLOY_MODE" == "apps_only" ]]; then
  echo "==> AppsOnly : pas de preparation OS (deja fait au pass 1)"
fi

if [[ "$DEPLOY_RUNTIME" == "docker-compose" || "$DEPLOY_RUNTIME" == "docker" ]]; then
  ensure_docker

  if [[ ! -f "$GSMS_DIR/.env" ]]; then
    echo "ERREUR: $GSMS_DIR/.env introuvable sur le VPS."
    echo "  PC : lancez d abord .\\scripts\\2-etape-infra-vps.ps1 (apres 1-etape-preparer-fichiers.ps1)"
    echo "  Ou etape 3 seule : le PC doit envoyer scripts/.deploy-staging avant ce script."
    exit 1
  fi

  if [[ ! -f "$GSMS_DIR/docker-compose.yml" ]]; then
    echo "ERREUR: $GSMS_DIR/docker-compose.yml introuvable — uploadez la stack (InfraOnly ou AppsOnly avec reparation)."
    exit 1
  fi

  cd "$GSMS_DIR"
fi

run_apps() {
  if [[ ! -d "$APP_ROOT/packages/database" ]]; then
    echo "Monorepo introuvable: $APP_ROOT — activez la sync monorepo"
    exit 1
  fi
  local apps_script="$APP_ROOT/scripts/deploy/deploy-gsms-apps.sh"
  local db_init_script="$APP_ROOT/scripts/deploy/gsms-db-init.sh"
  if [[ ! -f "$apps_script" ]]; then
    echo "ERREUR: script apps generique introuvable: $apps_script"
    exit 1
  fi
  if [[ "$DEPLOY_MIGRATE" == "true" && ! -f "$db_init_script" ]]; then
    echo "ERREUR: script db init generique introuvable: $db_init_script"
    exit 1
  fi
  export APP_ROOT GSMS_DIR
  if declare -f deploy_ensure_compose_network >/dev/null 2>&1; then
    deploy_ensure_compose_network
  fi
  bash "$apps_script"
  if [[ "$DEPLOY_MIGRATE" == "true" ]]; then
    bash "$db_init_script"
  fi
}

if [[ "$DEPLOY_MODE" == "rebuild_only" ]]; then
  if [[ "$DEPLOY_RUNTIME" == "pm2" || "$DEPLOY_RUNTIME" == "systemd" || "$DEPLOY_RUNTIME" == "python" || "$DEPLOY_RUNTIME" == "php-fpm" || "$DEPLOY_RUNTIME" == "go" || "$DEPLOY_RUNTIME" == "static" ]]; then
    echo "ERREUR: rebuild_only non supporte pour runtime $DEPLOY_RUNTIME."
    exit 1
  fi
  echo "==> Mode RebuildOnly (images Docker)"
  echo "==> Verification services donnees..."
  docker compose up -d postgres redis 2>/dev/null || docker compose up -d postgres || true
  if [[ ! -d "$APP_ROOT/packages/database" ]]; then
    echo "ERREUR: monorepo introuvable: $APP_ROOT — activez la sync monorepo"
    exit 1
  fi
  rebuild_script="$APP_ROOT/scripts/deploy/deploy-rebuild-images.sh"
  db_init_script="$APP_ROOT/scripts/deploy/gsms-db-init.sh"
  if [[ ! -f "$rebuild_script" ]]; then
    echo "ERREUR: script rebuild generique introuvable: $rebuild_script"
    exit 1
  fi
  if [[ "$DEPLOY_MIGRATE" == "true" && ! -f "$db_init_script" ]]; then
    echo "ERREUR: script db init generique introuvable: $db_init_script"
    exit 1
  fi
  export APP_ROOT GSMS_DIR
  export REBUILD_DOCS="${REBUILD_DOCS:-0}"
  bash "$rebuild_script"
  if [[ "$DEPLOY_MIGRATE" == "true" ]]; then
    bash "$db_init_script"
  fi
  echo "==> Etat final"
  docker ps --format 'table {{.Names}}\t{{.Status}}' | head -20
  echo "=== Deploiement termine ==="
  exit 0
fi

if [[ "$DEPLOY_MODE" == "apps_only" ]]; then
  echo "==> Mode AppsOnly"
  if [[ "$DEPLOY_RUNTIME" == "pm2" ]]; then
    run_pm2_apps
    echo "=== Deploiement PM2 termine ==="
    exit 0
  fi
  if [[ "$DEPLOY_RUNTIME" == "systemd" ]]; then
    run_systemd_apps
    echo "=== Deploiement systemd termine ==="
    exit 0
  fi
  if [[ "$DEPLOY_RUNTIME" == "python" ]]; then
    run_python_apps
    echo "=== Deploiement python termine ==="
    exit 0
  fi
  if [[ "$DEPLOY_RUNTIME" == "php-fpm" ]]; then
    run_php_fpm_apps
    echo "=== Deploiement php-fpm termine ==="
    exit 0
  fi
  if [[ "$DEPLOY_RUNTIME" == "go" ]]; then
    run_go_apps
    echo "=== Deploiement go termine ==="
    exit 0
  fi
  if [[ "$DEPLOY_RUNTIME" == "static" ]]; then
    run_static_apps
    echo "=== Deploiement static termine ==="
    exit 0
  fi
  if [[ "$DEPLOY_BOOTSTRAP_INFRA" == "true" ]]; then
    echo "==> Demarrage infra (stack vient d etre envoyee depuis le PC)..."
    if declare -f deploy_compose_up_infra >/dev/null 2>&1; then
      DEPLOY_MONITORING=false deploy_compose_up_infra
    else
      docker compose pull
      docker compose up -d caddy postgres redis minio
    fi
  else
    echo "==> Verification services donnees..."
    docker compose up -d postgres redis 2>/dev/null || docker compose up -d postgres || true
  fi
  if declare -f deploy_wait_postgres >/dev/null 2>&1; then
    deploy_wait_postgres 45
  else
    for i in $(seq 1 45); do
      if docker exec gsms-postgres pg_isready -U lms >/dev/null 2>&1; then break; fi
      sleep 2
    done
  fi
  run_apps
  echo "==> Etat final"
  docker ps --format 'table {{.Names}}\t{{.Status}}'
  exit 0
fi

if [[ "$DEPLOY_RUNTIME" == "pm2" ]]; then
  echo "==> Runtime PM2 (full): skip infra compose, run apps runtime"
  run_pm2_apps
  echo "=== Deploiement PM2 termine ==="
  exit 0
fi

if [[ "$DEPLOY_RUNTIME" == "systemd" ]]; then
  echo "==> Runtime systemd (full): skip infra compose, run apps runtime"
  run_systemd_apps
  echo "=== Deploiement systemd termine ==="
  exit 0
fi

if [[ "$DEPLOY_RUNTIME" == "python" ]]; then
  echo "==> Runtime python (full): skip infra compose, run apps runtime"
  run_python_apps
  echo "=== Deploiement python termine ==="
  exit 0
fi

if [[ "$DEPLOY_RUNTIME" == "php-fpm" ]]; then
  echo "==> Runtime php-fpm (full): skip infra compose, run apps runtime"
  run_php_fpm_apps
  echo "=== Deploiement php-fpm termine ==="
  exit 0
fi

if [[ "$DEPLOY_RUNTIME" == "go" ]]; then
  echo "==> Runtime go (full): skip infra compose, run apps runtime"
  run_go_apps
  echo "=== Deploiement go termine ==="
  exit 0
fi

if [[ "$DEPLOY_RUNTIME" == "static" ]]; then
  echo "==> Runtime static (full): skip infra compose, run apps runtime"
  run_static_apps
  echo "=== Deploiement static termine ==="
  exit 0
fi

if declare -f deploy_compose_up_infra >/dev/null 2>&1; then
  deploy_compose_up_infra
else
  docker compose pull
  if [[ "$DEPLOY_MONITORING" == "true" ]]; then
    docker compose up -d
  else
    docker compose up -d caddy postgres redis minio
  fi
fi

if declare -f deploy_wait_postgres >/dev/null 2>&1; then
  deploy_wait_postgres 45
else
  echo "==> Attente Postgres..."
  for i in $(seq 1 45); do
    if docker exec gsms-postgres pg_isready -U lms >/dev/null 2>&1; then break; fi
    sleep 2
  done
fi

if [[ "$DEPLOY_MODE" == "infra_only" ]] || [[ "$DEPLOY_APPS" != "true" ]]; then
  echo "Infra OK (apps non deployees)."
  docker ps --format 'table {{.Names}}\t{{.Status}}'
  exit 0
fi

run_apps
echo "==> Etat final"
docker ps --format 'table {{.Names}}\t{{.Status}}'
