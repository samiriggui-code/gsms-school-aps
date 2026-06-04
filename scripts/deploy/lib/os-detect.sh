#!/bin/bash
# Détection OS + commandes paquets — à sourcer : source "$(dirname "$0")/lib/os-detect.sh"
# Familles supportées aujourd'hui : debian (Ubuntu, Debian). RHEL en lecture seule.

gsms_os_id() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    echo "${ID:-unknown}"
  else
    echo "unknown"
  fi
}

gsms_os_family() {
  local id
  id="$(gsms_os_id)"
  case "$id" in
    ubuntu | debian | raspbian | linuxmint)
      echo "debian"
      ;;
    centos | rhel | rocky | almalinux | ol | fedora)
      echo "rhel"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

gsms_pkg_refresh_cache() {
  local family
  family="$(gsms_os_family)"
  case "$family" in
    debian)
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -qq
      ;;
    rhel)
      if command -v dnf >/dev/null 2>&1; then
        dnf makecache -q 2>/dev/null || true
      elif command -v yum >/dev/null 2>&1; then
        yum makecache -q 2>/dev/null || true
      fi
      ;;
    *)
      return 1
      ;;
  esac
}

gsms_pkg_install() {
  local family pkgs
  family="$(gsms_os_family)"
  pkgs="$*"
  case "$family" in
    debian)
      export DEBIAN_FRONTEND=noninteractive
      apt-get install -y -qq $pkgs
      ;;
    rhel)
      if command -v dnf >/dev/null 2>&1; then
        dnf install -y -q $pkgs
      else
        yum install -y -q $pkgs
      fi
      ;;
    *)
      echo "ERREUR: gsms_pkg_install non supporte pour OS=$(gsms_os_id)" >&2
      return 1
      ;;
  esac
}

gsms_docker_supported() {
  [[ "$(gsms_os_family)" == "debian" ]]
}
