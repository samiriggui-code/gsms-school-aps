#!/bin/bash
# Nettoyage complet deploiement GSMS sur le VPS (idempotent).
# Appele par 0-reset-tout.ps1 — ne pas lancer a la main sauf debug SSH.
#
# Variables :
#   GSMS_DIR, APP_ROOT     — dossiers deploy (defaut /opt/gsms, /opt/app-prisma)
#   PURGE_DOCKER=1|0       — 1 : desinstalle docker-ce installe par nos scripts
#   PURGE_DOCKER_DATA=1|0  — 1 (defaut) : supprime /var/lib/docker et /var/lib/containerd
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/os-detect.sh
source "${SCRIPT_DIR}/lib/os-detect.sh"

GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
COCKPIT_LIB="${COCKPIT_LIB:-/var/lib/gsms-cockpit}"
BASELINE_FILE="${BASELINE_FILE:-$COCKPIT_LIB/vps-baseline.json}"
RESET_ENV_FILE="${RESET_ENV_FILE:-$COCKPIT_LIB/reset.env}"
PURGE_DOCKER="${PURGE_DOCKER:-}"
PURGE_DOCKER_DATA="${PURGE_DOCKER_DATA:-1}"

load_reset_env() {
  if [[ ! -f "$RESET_ENV_FILE" ]]; then
    return
  fi
  # shellcheck disable=SC1090
  set -a
  source "$RESET_ENV_FILE"
  set +a
  rm -f "$RESET_ENV_FILE"
  echo "==> Politique reset (cockpit) : PURGE_DOCKER=${PURGE_DOCKER:-?} GSMS_DIR=$GSMS_DIR APP_ROOT=$APP_ROOT"
}

apply_baseline_reset_policy() {
  if [[ -n "${PURGE_DOCKER}" ]]; then
    echo "==> Politique reset : PURGE_DOCKER=$PURGE_DOCKER (cockpit ou appelant)"
    return
  fi
  if [[ ! -f "$BASELINE_FILE" ]]; then
    if [[ -d "$GSMS_DIR" ]] || [[ -d "$APP_ROOT" ]] || [[ -f /etc/apt/sources.list.d/docker.list ]]; then
      PURGE_DOCKER=1
      echo "==> Pas de reference VPS mais traces GSMS/Docker detectees — nettoyage complet."
    else
      PURGE_DOCKER=0
      echo "==> Aucune reference VPS ni trace GSMS — retrait conservateur uniquement."
    fi
    return
  fi
  local had_docker=0
  if command -v jq >/dev/null 2>&1; then
    had_docker=$(jq -r 'if .docker.installed == true then 1 else 0 end' "$BASELINE_FILE" 2>/dev/null || echo 0)
  elif grep -qE '"installed"[[:space:]]*:[[:space:]]*true' "$BASELINE_FILE" 2>/dev/null; then
    had_docker=1
  fi
  if [[ "$had_docker" == "1" ]]; then
    PURGE_DOCKER=0
    echo "==> Reference VPS : Docker etait deja present — conservation du moteur."
  else
    PURGE_DOCKER=1
    echo "==> Reference VPS : Docker etait absent — desinstallation docker-ce apres stack GSMS."
  fi
}

load_reset_env
apply_baseline_reset_policy

echo "=============================================="
echo " Reset deploiement GSMS sur ce serveur"
echo "   GSMS_DIR=$GSMS_DIR"
echo "   APP_ROOT=$APP_ROOT"
echo "   PURGE_DOCKER=$PURGE_DOCKER"
echo "=============================================="

if [[ $EUID -ne 0 ]]; then
  echo "ERREUR: executer en root (sudo bash $0)"
  exit 1
fi

echo "==> Arret stack Docker GSMS..."
if [[ -f "$GSMS_DIR/docker-compose.yml" ]]; then
  cd "$GSMS_DIR"
  docker compose --profile apps down -v --remove-orphans 2>/dev/null || true
  docker compose down -v --remove-orphans 2>/dev/null || true
fi

if command -v docker >/dev/null 2>&1; then
  echo "==> Suppression conteneurs gsms-*..."
  mapfile -t _containers < <(docker ps -aq --filter 'name=gsms-' 2>/dev/null || true)
  if ((${#_containers[@]})); then
    docker rm -f "${_containers[@]}" 2>/dev/null || true
  fi

  if [[ "$PURGE_DOCKER" == "1" ]]; then
    echo "==> Arret de tous les conteneurs (purge moteur)..."
    mapfile -t _all < <(docker ps -aq 2>/dev/null || true)
    if ((${#_all[@]})); then
      docker rm -f "${_all[@]}" 2>/dev/null || true
    fi
  fi

  echo "==> Suppression reseau gsms..."
  docker network rm gsms 2>/dev/null || true

  echo "==> Suppression volumes Docker du projet gsms..."
  mapfile -t _vols < <(docker volume ls -q 2>/dev/null | grep -E '^gsms_' || true)
  if ((${#_vols[@]})); then
    docker volume rm "${_vols[@]}" 2>/dev/null || true
  fi
  for v in caddy_data caddy_config postgres_data redis_data minio_data \
    netdata_config netdata_lib netdata_cache uptime_kuma_data portainer_data; do
    docker volume rm "gsms_${v}" 2>/dev/null || docker volume rm "$v" 2>/dev/null || true
  done

  echo "==> Suppression images build locales GSMS..."
  docker rmi gsms-crm:latest gsms-landing:latest gsms-docs:latest gsms-worker:latest 2>/dev/null || true
  mapfile -t _images < <(docker images -q 'gsms-*' 2>/dev/null || true)
  if ((${#_images[@]})); then
    docker rmi -f "${_images[@]}" 2>/dev/null || true
  fi

  echo "==> Nettoyage ressources Docker orphelines (projet GSMS)..."
  docker network prune -f 2>/dev/null || true
  docker volume prune -f 2>/dev/null || true
fi

echo "==> Marqueur preparation VPS..."
rm -f "$GSMS_DIR/.vps-prepared" /opt/gsms/.vps-prepared 2>/dev/null || true

echo "==> Suppression dossiers deploiement..."
for _dir in "$GSMS_DIR" "$APP_ROOT" /opt/gsms /opt/app-prisma; do
  [[ -z "$_dir" || "$_dir" == "/" ]] && continue
  [[ -d "$_dir" ]] && rm -rf "$_dir"
done

echo "==> Nettoyage scripts temporaires..."
rm -f /tmp/deploy-lms-remote.sh /tmp/install-docker-vps.sh /tmp/prepare-vps.sh \
  /tmp/_deploy-remote-lib.sh /tmp/lms-monorepo.tar.gz /tmp/reset-deploiement-vps.sh 2>/dev/null || true
rm -rf /tmp/lib 2>/dev/null || true

purge_docker_engine() {
  echo "==> Arret services Docker..."
  systemctl stop docker.service docker.socket containerd.service 2>/dev/null || true
  systemctl disable docker.service docker.socket containerd.service 2>/dev/null || true

  echo "==> Desinstallation paquets docker-ce (apt)..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get purge -y -qq \
    docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin \
    docker-ce-rootless-extras docker-compose 2>/dev/null || true
  apt-get autoremove -y -qq 2>/dev/null || true

  echo "==> Suppression depot APT Docker (ajoute par install-docker-vps.sh)..."
  rm -f /etc/apt/sources.list.d/docker.list /etc/apt/keyrings/docker.asc 2>/dev/null || true

  if [[ "$PURGE_DOCKER_DATA" == "1" ]]; then
    echo "==> Suppression donnees Docker (/var/lib/docker, containerd)..."
    rm -rf /var/lib/docker /var/lib/containerd /etc/docker 2>/dev/null || true
  fi

  if command -v snap >/dev/null 2>&1 && snap list 2>/dev/null | grep -qE '^docker\s'; then
    echo "==> Suppression snap docker (conflit installe par nos scripts)..."
    snap stop docker 2>/dev/null || true
    snap remove docker 2>/dev/null || true
  fi
}

if [[ "$PURGE_DOCKER" == "1" ]]; then
  if command -v docker >/dev/null 2>&1 || [[ -f /etc/apt/sources.list.d/docker.list ]]; then
    purge_docker_engine
  else
    echo "==> Docker deja absent — rien a desinstaller."
  fi
else
  echo "==> PURGE_DOCKER=0 — moteur Docker conserve."
fi

echo "==> Suppression donnees cockpit GSMS sur le VPS..."
rm -rf "$COCKPIT_LIB" 2>/dev/null || true

echo "==> Rafraichissement cache paquets (post-reset)..."
_os_id="$(gsms_os_id)"
_os_family="$(gsms_os_family)"
if gsms_pkg_refresh_cache 2>/dev/null; then
  echo "    OK ($_os_id / $_os_family)"
else
  echo "    Skip (OS=$_os_id — adapter manuellement yum/dnf si RHEL)"
fi

echo ""
echo "Reset VPS termine."
if [[ "$PURGE_DOCKER" == "1" ]]; then
  echo "  Stack GSMS, dossiers /opt et Docker (docker-ce) : retires."
else
  echo "  Stack GSMS et dossiers /opt : retires. Docker d origine conserve."
fi
echo "  UFW / fail2ban (prepare-vps) : non modifies."
echo ""
if command -v docker >/dev/null 2>&1; then
  echo "  docker encore present : $(docker --version 2>/dev/null || true)"
else
  echo "  docker : non installe (OK pour livraison VPS propre)"
fi
