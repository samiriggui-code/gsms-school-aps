#!/bin/bash
# Libère les ports apps (3000, 3001, 3004) avant docker compose — évite conflit PM2 / next-server legacy.
set -euo pipefail

APP_PORTS=(3000 3001 3004)

port_pids() {
  local port="$1"
  ss -tlnp 2>/dev/null | grep -E ":${port}\b" | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u
}

is_docker_proxy_pid() {
  local pid="$1"
  local comm
  comm="$(ps -p "$pid" -o comm= 2>/dev/null | tr -d ' ')"
  [[ "$comm" == "docker-proxy" ]]
}

free_app_ports() {
  local port pid
  for port in "${APP_PORTS[@]}"; do
    for pid in $(port_pids "$port"); do
      [[ -n "$pid" ]] || continue
      if is_docker_proxy_pid "$pid"; then
        continue
      fi
      local cmd
      cmd="$(ps -p "$pid" -o args= 2>/dev/null || true)"
      echo "==> Port ${port} occupé par PID ${pid} — arrêt (${cmd:-?})"
      kill "$pid" 2>/dev/null || true
    done
  done

  # Ancien cockpit gsms-deploy (PM2) — ports 3004 / apps LMS en conflit fréquent
  if command -v pm2 >/dev/null 2>&1; then
    for name in gsms-web gsms-docs; do
      if pm2 describe "$name" >/dev/null 2>&1; then
        echo "==> PM2 stop ${name} (stack legacy gsms-deploy)"
        pm2 stop "$name" >/dev/null 2>&1 || true
      fi
    done
  fi

  sleep 1
}
