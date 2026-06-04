#!/bin/bash
# Runtime PHP-FPM generique multi-VPS (sans Docker)
# Variables optionnelles:
# - PHP_APP_DIR (defaut: $APP_ROOT)
# - PHP_FPM_SERVICE (defaut: php8.3-fpm, fallback auto)
# - PHPFPM_POOL_NAME (defaut: gsms-app)
# - PHPFPM_LISTEN (defaut: /run/php/${PHPFPM_POOL_NAME}.sock)
# - PHPFPM_PM_MAX_CHILDREN (defaut: 10)
# - PHPFPM_PM_START_SERVERS (defaut: 2)
# - PHPFPM_PM_MIN_SPARE_SERVERS (defaut: 1)
# - PHPFPM_PM_MAX_SPARE_SERVERS (defaut: 3)
# - PHP_COMPOSER_INSTALL (defaut: 1)
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/app-prisma}"
PHP_APP_DIR="${PHP_APP_DIR:-$APP_ROOT}"
PHP_FPM_SERVICE="${PHP_FPM_SERVICE:-php8.3-fpm}"
PHPFPM_POOL_NAME="${PHPFPM_POOL_NAME:-gsms-app}"
PHPFPM_LISTEN="${PHPFPM_LISTEN:-/run/php/${PHPFPM_POOL_NAME}.sock}"
PHPFPM_PM_MAX_CHILDREN="${PHPFPM_PM_MAX_CHILDREN:-10}"
PHPFPM_PM_START_SERVERS="${PHPFPM_PM_START_SERVERS:-2}"
PHPFPM_PM_MIN_SPARE_SERVERS="${PHPFPM_PM_MIN_SPARE_SERVERS:-1}"
PHPFPM_PM_MAX_SPARE_SERVERS="${PHPFPM_PM_MAX_SPARE_SERVERS:-3}"
PHP_COMPOSER_INSTALL="${PHP_COMPOSER_INSTALL:-1}"
PHPFPM_POOL_FILE="/etc/php/8.3/fpm/pool.d/${PHPFPM_POOL_NAME}.conf"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERREUR: commande introuvable: $1"
    exit 1
  }
}

detect_php_fpm_service() {
  if systemctl list-unit-files | awk '/^php[0-9]+\.[0-9]+-fpm\.service/ { found=1; print $1; exit } END { exit(found?0:1) }' >/tmp/php-fpm-service-name.txt; then
    sed 's/\.service$//' /tmp/php-fpm-service-name.txt
    rm -f /tmp/php-fpm-service-name.txt
    return 0
  fi
  echo "php-fpm"
}

if [[ ! -d "$PHP_APP_DIR" ]]; then
  echo "ERREUR: repertoire app introuvable: $PHP_APP_DIR"
  exit 1
fi

need_cmd systemctl
need_cmd php

if [[ "$PHP_COMPOSER_INSTALL" == "1" && -f "$PHP_APP_DIR/composer.json" ]]; then
  if command -v composer >/dev/null 2>&1; then
    echo "==> Composer install"
    composer install --no-interaction --prefer-dist --working-dir "$PHP_APP_DIR"
  else
    echo "AVERTISSEMENT: composer absent, skip install dependencies PHP."
  fi
fi

if [[ ! -d "/etc/php/8.3/fpm/pool.d" ]]; then
  echo "AVERTISSEMENT: /etc/php/8.3/fpm/pool.d absent, tentative avec service auto."
fi

if [[ -d "/etc/php/8.3/fpm/pool.d" ]]; then
  echo "==> Ecriture pool PHP-FPM: $PHPFPM_POOL_FILE"
  cat >"$PHPFPM_POOL_FILE" <<EOF
[$PHPFPM_POOL_NAME]
user = www-data
group = www-data
listen = $PHPFPM_LISTEN
listen.owner = www-data
listen.group = www-data
pm = dynamic
pm.max_children = $PHPFPM_PM_MAX_CHILDREN
pm.start_servers = $PHPFPM_PM_START_SERVERS
pm.min_spare_servers = $PHPFPM_PM_MIN_SPARE_SERVERS
pm.max_spare_servers = $PHPFPM_PM_MAX_SPARE_SERVERS
chdir = $PHP_APP_DIR
clear_env = no
EOF
fi

if ! systemctl list-unit-files | awk -v svc="${PHP_FPM_SERVICE}.service" '$1==svc{found=1} END{exit(found?0:1)}'; then
  PHP_FPM_SERVICE="$(detect_php_fpm_service)"
fi

echo "==> Reload/restart service PHP-FPM: $PHP_FPM_SERVICE"
systemctl daemon-reload || true
systemctl enable "$PHP_FPM_SERVICE" || true
systemctl restart "$PHP_FPM_SERVICE"
systemctl --no-pager --full status "$PHP_FPM_SERVICE" || true

if [[ -S "$PHPFPM_LISTEN" ]]; then
  echo "==> Socket pool OK: $PHPFPM_LISTEN"
else
  echo "AVERTISSEMENT: socket pool introuvable ($PHPFPM_LISTEN). Verifiez la config nginx/caddy."
fi

echo "OK runtime php-fpm."
