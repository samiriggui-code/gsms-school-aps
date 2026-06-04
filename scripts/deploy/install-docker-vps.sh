#!/bin/bash
# Docker sur VPS : conflits snap, socket masque, daemon inactif, install apt.
# Variables :
#   DOCKER_UPGRADE=auto|force|skip  (defaut auto si binaire absent, skip si daemon OK)
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Sur le VPS les libs sont dans /tmp ou APP_ROOT/scripts
for lib in "${SCRIPT_DIR}/_deploy-remote-lib.sh" /tmp/_deploy-remote-lib.sh "${SCRIPT_DIR}/../deploy/_deploy-remote-lib.sh"; do
  if [[ -f "$lib" ]]; then
    # shellcheck source=/dev/null
    source "$lib"
    break
  fi
done

DOCKER_UPGRADE="${DOCKER_UPGRADE:-auto}"
DOCKER_MAX_RETRIES="${DOCKER_MAX_RETRIES:-4}"

docker_remove_snap_conflict() {
  if ! command -v snap >/dev/null 2>&1; then
    return 0
  fi
  if snap list 2>/dev/null | grep -qE '^docker\s'; then
    echo "==> Conflit: snap docker detecte — suppression (docker-ce requis)..."
    snap stop docker 2>/dev/null || true
    snap remove docker 2>/dev/null || true
  fi
}

docker_systemd_fixup() {
  echo "==> Correction systemd (unmask + enable + start)..."
  systemctl unmask docker.socket docker.service containerd.service 2>/dev/null || true
  systemctl daemon-reload
  systemctl enable containerd.service 2>/dev/null || true
  systemctl enable docker.socket docker.service 2>/dev/null || true
  systemctl start containerd.service 2>/dev/null || true
  systemctl start docker.socket 2>/dev/null || true
  systemctl start docker.service 2>/dev/null || true
}

docker_report() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "  docker binaire : ABSENT"
    return 1
  fi
  echo "  docker         : $(docker --version 2>/dev/null || echo '?')"
  if docker compose version >/dev/null 2>&1; then
    echo "  compose        : $(docker compose version 2>/dev/null | head -1)"
  else
    echo "  compose        : ABSENT (plugin docker-compose-v2)"
  fi
  if systemctl is-active docker >/dev/null 2>&1; then
    echo "  service docker : actif"
  else
    echo "  service docker : inactif"
    systemctl status docker --no-pager -l 2>/dev/null | tail -5 || true
  fi
  if docker info >/dev/null 2>&1; then
    echo "  docker info    : OK (daemon repond)"
    return 0
  fi
  echo "  docker info    : ERREUR (daemon ne repond pas)"
  if systemctl is-enabled docker.socket 2>&1 | grep -qi masked; then
    echo "  diagnostic     : docker.socket est masque (systemctl unmask docker.socket)"
  fi
  return 1
}

setup_docker_apt_repo() {
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
}

install_docker_fresh() {
  echo "==> Installation paquets docker-ce..."
  docker_remove_snap_conflict
  setup_docker_apt_repo
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  docker_systemd_fixup
}

upgrade_docker_packages() {
  local reason="$1"
  echo "==> Mise a jour Docker ($reason)..."
  if [[ ! -f /etc/apt/sources.list.d/docker.list ]]; then
    setup_docker_apt_repo
  else
    apt-get update -qq
  fi
  apt-get install -y -qq --only-upgrade \
    docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null \
    || apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  docker_systemd_fixup
}

apt_has_docker_upgrade() {
  apt-get install -s --only-upgrade docker-ce 2>/dev/null | grep -q '^Inst ' && return 0
  return 1
}

docker_try_start_daemon() {
  local attempt
  docker_remove_snap_conflict
  for ((attempt = 1; attempt <= DOCKER_MAX_RETRIES; attempt++)); do
    echo "==> Verification daemon (tentative $attempt/$DOCKER_MAX_RETRIES)..."
    docker_systemd_fixup
    sleep "$((attempt > 1 ? 2 : 1))"
    if docker_report; then
      return 0
    fi
  done
  return 1
}

docker_ensure_ready() {
  echo "=============================================="
  echo " Verification / installation Docker"
  echo "   DOCKER_UPGRADE=$DOCKER_UPGRADE"
  echo "=============================================="

  docker_remove_snap_conflict

  if ! command -v docker >/dev/null 2>&1; then
    echo "==> Docker absent — installation..."
    install_docker_fresh
  else
    echo "==> Docker present :"
    docker_report || true

    case "$DOCKER_UPGRADE" in
      skip)
        echo "==> Pas de mise a jour apt (DOCKER_UPGRADE=skip)."
        ;;
      force)
        upgrade_docker_packages "force"
        ;;
      auto)
        if apt_has_docker_upgrade; then
          upgrade_docker_packages "version apt disponible"
        else
          echo "==> Paquets docker-ce deja a jour (apt)."
        fi
        ;;
      *)
        echo "DOCKER_UPGRADE inconnu: $DOCKER_UPGRADE (auto|force|skip)"
        exit 1
        ;;
    esac
  fi

  echo "==> Etat final :"
  if docker_try_start_daemon; then
    echo "==> Docker operationnel."
    return 0
  fi

  echo ""
  echo "ERREUR: impossible de demarrer le daemon Docker."
  echo "  Commandes manuelles (root) :"
  echo "    systemctl unmask docker.socket docker.service"
  echo "    systemctl daemon-reload && systemctl start docker"
  echo "    docker info"
  systemctl status docker.socket docker.service --no-pager 2>/dev/null | tail -20 || true
  return 1
}

docker_ensure_ready
