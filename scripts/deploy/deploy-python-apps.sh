#!/bin/bash
# Runtime Python generique multi-VPS (sans Docker)
# Variables optionnelles:
# - PY_APP_DIR (defaut: $APP_ROOT)
# - PY_VENV_DIR (defaut: $PY_APP_DIR/.venv)
# - PY_REQUIREMENTS_FILE (defaut: $PY_APP_DIR/requirements.txt)
# - PY_START_COMMAND (requis, ex: "gunicorn app:app -b 0.0.0.0:8000")
# - PY_PID_FILE (defaut: $PY_APP_DIR/.deploy-python.pid)
# - PY_LOG_FILE (defaut: $PY_APP_DIR/.deploy-python.log)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
PY_APP_DIR="${PY_APP_DIR:-$APP_ROOT}"
PY_VENV_DIR="${PY_VENV_DIR:-$PY_APP_DIR/.venv}"
PY_REQUIREMENTS_FILE="${PY_REQUIREMENTS_FILE:-$PY_APP_DIR/requirements.txt}"
PY_START_COMMAND="${PY_START_COMMAND:-}"
PY_PID_FILE="${PY_PID_FILE:-$PY_APP_DIR/.deploy-python.pid}"
PY_LOG_FILE="${PY_LOG_FILE:-$PY_APP_DIR/.deploy-python.log}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERREUR: commande introuvable: $1"
    exit 1
  }
}

if [[ ! -d "$PY_APP_DIR" ]]; then
  echo "ERREUR: repertoire app introuvable: $PY_APP_DIR"
  exit 1
fi

if [[ -z "$PY_START_COMMAND" ]]; then
  echo "ERREUR: PY_START_COMMAND requis pour runtime python."
  exit 1
fi

need_cmd python3

if [[ ! -d "$PY_VENV_DIR" ]]; then
  echo "==> Creation venv: $PY_VENV_DIR"
  python3 -m venv "$PY_VENV_DIR"
fi

# shellcheck disable=SC1091
source "$PY_VENV_DIR/bin/activate"

echo "==> Upgrade pip"
python -m pip install --upgrade pip

if [[ -f "$PY_REQUIREMENTS_FILE" ]]; then
  echo "==> Install deps: $PY_REQUIREMENTS_FILE"
  pip install -r "$PY_REQUIREMENTS_FILE"
else
  echo "AVERTISSEMENT: requirements introuvable ($PY_REQUIREMENTS_FILE), skip install deps"
fi

if [[ -f "$PY_PID_FILE" ]]; then
  old_pid="$(cat "$PY_PID_FILE" 2>/dev/null || true)"
  if [[ -n "${old_pid:-}" ]] && kill -0 "$old_pid" >/dev/null 2>&1; then
    echo "==> Stop ancien process Python (pid=$old_pid)"
    kill "$old_pid" >/dev/null 2>&1 || true
    sleep 1
  fi
fi

echo "==> Start app Python"
echo "  dir  : $PY_APP_DIR"
echo "  log  : $PY_LOG_FILE"
echo "  cmd  : $PY_START_COMMAND"

nohup bash -lc "cd \"$PY_APP_DIR\" && source \"$PY_VENV_DIR/bin/activate\" && $PY_START_COMMAND" \
  >>"$PY_LOG_FILE" 2>&1 &
new_pid=$!
echo "$new_pid" >"$PY_PID_FILE"

sleep 1
if ! kill -0 "$new_pid" >/dev/null 2>&1; then
  echo "ERREUR: process Python non demarre. Consultez: $PY_LOG_FILE"
  exit 1
fi

echo "OK runtime python (pid=$new_pid)."
