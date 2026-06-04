#!/bin/bash
# Runtime PM2 generique multi-VPS
# Variables optionnelles:
# - PM2_APP_NAME (defaut: gsms-app)
# - PM2_APP_DIR (defaut: $APP_ROOT)
# - PM2_START_COMMAND (ex: "pnpm -C apps/api start")
# - PM2_ECOSYSTEM_FILE (ex: "$APP_ROOT/ecosystem.config.cjs")
# - PM2_INSTALL_CMD (defaut: "pnpm install --frozen-lockfile")
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
PM2_APP_NAME="${PM2_APP_NAME:-gsms-app}"
PM2_APP_DIR="${PM2_APP_DIR:-$APP_ROOT}"
PM2_START_COMMAND="${PM2_START_COMMAND:-}"
PM2_ECOSYSTEM_FILE="${PM2_ECOSYSTEM_FILE:-}"
PM2_INSTALL_CMD="${PM2_INSTALL_CMD:-pnpm install --frozen-lockfile}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERREUR: commande introuvable: $1"
    exit 1
  }
}

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    return 0
  fi
  echo "==> PM2 absent, installation globale npm..."
  need_cmd npm
  npm install -g pm2
}

ensure_node_toolchain() {
  need_cmd node
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "==> pnpm absent, activation corepack..."
    need_cmd corepack
    corepack enable
    corepack prepare pnpm@latest --activate
  fi
}

if [[ ! -d "$PM2_APP_DIR" ]]; then
  echo "ERREUR: repertoire app introuvable: $PM2_APP_DIR"
  exit 1
fi

ensure_node_toolchain
ensure_pm2

echo "==> Runtime PM2"
echo "  app_name : $PM2_APP_NAME"
echo "  app_dir  : $PM2_APP_DIR"

if [[ -n "$PM2_INSTALL_CMD" ]]; then
  echo "==> Install deps: $PM2_INSTALL_CMD"
  bash -lc "cd \"$PM2_APP_DIR\" && $PM2_INSTALL_CMD"
fi

if [[ -n "$PM2_ECOSYSTEM_FILE" ]]; then
  echo "==> PM2 start via ecosystem: $PM2_ECOSYSTEM_FILE"
  pm2 start "$PM2_ECOSYSTEM_FILE" --only "$PM2_APP_NAME" || pm2 start "$PM2_ECOSYSTEM_FILE"
else
  if [[ -z "$PM2_START_COMMAND" ]]; then
    echo "ERREUR: PM2_START_COMMAND requis si PM2_ECOSYSTEM_FILE n'est pas fourni."
    exit 1
  fi
  echo "==> PM2 start command: $PM2_START_COMMAND"
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    pm2 delete "$PM2_APP_NAME" >/dev/null 2>&1 || true
  fi
  pm2 start bash --name "$PM2_APP_NAME" -- -lc "cd \"$PM2_APP_DIR\" && $PM2_START_COMMAND"
fi

pm2 save
pm2 status "$PM2_APP_NAME" || pm2 status

echo "OK runtime PM2."
