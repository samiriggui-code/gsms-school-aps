#!/bin/bash
# Runtime static generique multi-VPS (sans Docker)
# Variables optionnelles:
# - STATIC_SOURCE_DIR (defaut: $APP_ROOT)
# - STATIC_TARGET_DIR (defaut: /var/www/gsms-static)
# - STATIC_BUILD_COMMAND (optionnel; ex: "pnpm build")
# - STATIC_BUILD_OUTPUT_DIR (defaut: dist)
# - STATIC_OWNER (defaut: www-data:www-data)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
STATIC_SOURCE_DIR="${STATIC_SOURCE_DIR:-$APP_ROOT}"
STATIC_TARGET_DIR="${STATIC_TARGET_DIR:-/var/www/gsms-static}"
STATIC_BUILD_COMMAND="${STATIC_BUILD_COMMAND:-}"
STATIC_BUILD_OUTPUT_DIR="${STATIC_BUILD_OUTPUT_DIR:-dist}"
STATIC_OWNER="${STATIC_OWNER:-www-data:www-data}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERREUR: commande introuvable: $1"
    exit 1
  }
}

if [[ ! -d "$STATIC_SOURCE_DIR" ]]; then
  echo "ERREUR: source static introuvable: $STATIC_SOURCE_DIR"
  exit 1
fi

need_cmd rsync

if [[ -n "$STATIC_BUILD_COMMAND" ]]; then
  echo "==> Build static: $STATIC_BUILD_COMMAND"
  bash -lc "cd \"$STATIC_SOURCE_DIR\" && $STATIC_BUILD_COMMAND"
fi

src="$STATIC_SOURCE_DIR/$STATIC_BUILD_OUTPUT_DIR"
if [[ ! -d "$src" ]]; then
  if [[ -f "$STATIC_SOURCE_DIR/index.html" ]]; then
    src="$STATIC_SOURCE_DIR"
  else
    echo "ERREUR: output static introuvable: $src (ni index.html a la racine)."
    exit 1
  fi
fi

echo "==> Sync static files"
mkdir -p "$STATIC_TARGET_DIR"
rsync -a --delete "$src/" "$STATIC_TARGET_DIR/"
chown -R "$STATIC_OWNER" "$STATIC_TARGET_DIR" 2>/dev/null || true

echo "OK runtime static -> $STATIC_TARGET_DIR"
