#!/bin/bash
# Runtime systemd generique multi-VPS
# Variables optionnelles:
# - SYSTEMD_SERVICE_NAME (defaut: gsms-app)
# - SYSTEMD_APP_DIR (defaut: $APP_ROOT)
# - SYSTEMD_START_COMMAND (requis si pas de unit template)
# - SYSTEMD_UNIT_PATH (defaut: /etc/systemd/system/${SYSTEMD_SERVICE_NAME}.service)
# - SYSTEMD_USER (defaut: root)
# - SYSTEMD_ENV_FILE (optionnel)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
SYSTEMD_SERVICE_NAME="${SYSTEMD_SERVICE_NAME:-gsms-app}"
SYSTEMD_APP_DIR="${SYSTEMD_APP_DIR:-$APP_ROOT}"
SYSTEMD_START_COMMAND="${SYSTEMD_START_COMMAND:-}"
SYSTEMD_UNIT_PATH="${SYSTEMD_UNIT_PATH:-/etc/systemd/system/${SYSTEMD_SERVICE_NAME}.service}"
SYSTEMD_USER="${SYSTEMD_USER:-root}"
SYSTEMD_ENV_FILE="${SYSTEMD_ENV_FILE:-}"
SYSTEMD_INSTALL_CMD="${SYSTEMD_INSTALL_CMD:-pnpm install --frozen-lockfile}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERREUR: commande introuvable: $1"
    exit 1
  }
}

ensure_node_toolchain() {
  need_cmd node
  if ! command -v pnpm >/dev/null 2>&1; then
    need_cmd corepack
    corepack enable
    corepack prepare pnpm@latest --activate
  fi
}

if [[ ! -d "$SYSTEMD_APP_DIR" ]]; then
  echo "ERREUR: repertoire app introuvable: $SYSTEMD_APP_DIR"
  exit 1
fi

if [[ -z "$SYSTEMD_START_COMMAND" ]]; then
  echo "ERREUR: SYSTEMD_START_COMMAND requis pour runtime systemd."
  exit 1
fi

ensure_node_toolchain

if [[ -n "$SYSTEMD_INSTALL_CMD" ]]; then
  echo "==> Install deps: $SYSTEMD_INSTALL_CMD"
  bash -lc "cd \"$SYSTEMD_APP_DIR\" && $SYSTEMD_INSTALL_CMD"
fi

env_file_line=""
if [[ -n "$SYSTEMD_ENV_FILE" ]]; then
  env_file_line="EnvironmentFile=$SYSTEMD_ENV_FILE"
fi

echo "==> Ecriture unit systemd: $SYSTEMD_UNIT_PATH"
cat >"$SYSTEMD_UNIT_PATH" <<EOF
[Unit]
Description=GSMS Deploy service ($SYSTEMD_SERVICE_NAME)
After=network.target

[Service]
Type=simple
User=$SYSTEMD_USER
WorkingDirectory=$SYSTEMD_APP_DIR
$env_file_line
ExecStart=/bin/bash -lc 'cd "$SYSTEMD_APP_DIR" && $SYSTEMD_START_COMMAND'
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$SYSTEMD_UNIT_PATH"

systemctl daemon-reload
systemctl enable "$SYSTEMD_SERVICE_NAME"
systemctl restart "$SYSTEMD_SERVICE_NAME"
systemctl --no-pager --full status "$SYSTEMD_SERVICE_NAME" || true

echo "OK runtime systemd."
