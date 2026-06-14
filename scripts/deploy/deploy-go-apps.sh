#!/bin/bash
# Runtime Go generique multi-VPS (sans Docker)
# Variables optionnelles:
# - GO_APP_DIR (defaut: $APP_ROOT)
# - GO_BUILD_COMMAND (defaut: "go build -o app")
# - GO_BINARY_PATH (defaut: "$GO_APP_DIR/app")
# - GO_RUN_ARGS (optionnel)
# - GO_SERVICE_NAME (defaut: gsms-go-app)
# - GO_SERVICE_USER (defaut: root)
# - GO_INSTALL_DEPS (defaut: 1)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
GO_APP_DIR="${GO_APP_DIR:-$APP_ROOT}"
GO_BUILD_COMMAND="${GO_BUILD_COMMAND:-go build -o app}"
GO_BINARY_PATH="${GO_BINARY_PATH:-$GO_APP_DIR/app}"
GO_RUN_ARGS="${GO_RUN_ARGS:-}"
GO_SERVICE_NAME="${GO_SERVICE_NAME:-gsms-go-app}"
GO_SERVICE_USER="${GO_SERVICE_USER:-root}"
GO_INSTALL_DEPS="${GO_INSTALL_DEPS:-1}"
GO_SERVICE_FILE="/etc/systemd/system/${GO_SERVICE_NAME}.service"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERREUR: commande introuvable: $1"
    exit 1
  }
}

if [[ ! -d "$GO_APP_DIR" ]]; then
  echo "ERREUR: repertoire app introuvable: $GO_APP_DIR"
  exit 1
fi

need_cmd go
need_cmd systemctl

if [[ "$GO_INSTALL_DEPS" == "1" ]]; then
  echo "==> go mod tidy"
  bash -lc "cd \"$GO_APP_DIR\" && go mod tidy"
fi

echo "==> Build Go: $GO_BUILD_COMMAND"
bash -lc "cd \"$GO_APP_DIR\" && $GO_BUILD_COMMAND"

if [[ ! -x "$GO_BINARY_PATH" ]]; then
  chmod +x "$GO_BINARY_PATH" 2>/dev/null || true
fi

if [[ ! -f "$GO_BINARY_PATH" ]]; then
  echo "ERREUR: binaire Go introuvable: $GO_BINARY_PATH"
  exit 1
fi

echo "==> Ecriture service systemd: $GO_SERVICE_FILE"
cat >"$GO_SERVICE_FILE" <<EOF
[Unit]
Description=GSMS Go Service ($GO_SERVICE_NAME)
After=network.target

[Service]
Type=simple
User=$GO_SERVICE_USER
WorkingDirectory=$GO_APP_DIR
ExecStart=$GO_BINARY_PATH $GO_RUN_ARGS
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$GO_SERVICE_FILE"
systemctl daemon-reload
systemctl enable "$GO_SERVICE_NAME"
systemctl restart "$GO_SERVICE_NAME"
systemctl --no-pager --full status "$GO_SERVICE_NAME" || true

echo "OK runtime go."
