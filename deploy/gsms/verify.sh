#!/bin/bash
# Verification rapide post-deploiement (sur le VPS)
set -euo pipefail

GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
FAIL=0

read_env() {
  local key="$1"
  grep -E "^${key}=" "$GSMS_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//'
}

DOMAIN="$(read_env DOMAIN)"
DOMAIN="${DOMAIN:-hosting-global-it-ss.com}"

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  OK  $name"
  else
    echo "  FAIL $name"
    FAIL=1
  fi
}

echo "==> Conteneurs"
docker ps --format '  {{.Names}} — {{.Status}}' | grep gsms- || { echo "  FAIL aucun conteneur gsms"; FAIL=1; }

echo "==> Health"
check "postgres" "docker exec gsms-postgres pg_isready -U lms -d lms_app"
check "api /api/common/health" "curl -sf --max-time 8 http://127.0.0.1:3001/api/common/health"
check "landing /api/landing/config" "curl -sf --max-time 8 http://127.0.0.1:3001/api/landing/config"
check "html / (Host: ${DOMAIN})" "test \$(curl -s --max-time 30 -H 'Host: ${DOMAIN}' http://127.0.0.1:3001/ | wc -c) -gt 5000"
check "html /signin (Host: ${DOMAIN})" "test \$(curl -s --max-time 30 -H 'Host: ${DOMAIN}' http://127.0.0.1:3001/signin | wc -c) -gt 1000"

N8N_URL="$(read_env N8N_PUBLIC_URL)"
N8N_WH="$(read_env N8N_WEBHOOK_STANDARD_URL)"
N8N_SECRET="$(read_env N8N_WEBHOOK_SECRET)"
if [[ -n "$N8N_URL" && -n "$N8N_SECRET" ]]; then
  check "n8n reachable" "curl -sf --max-time 12 -o /dev/null ${N8N_URL}/healthz || curl -sf --max-time 12 -o /dev/null ${N8N_URL}"
fi
if [[ -n "$N8N_WH" && -n "$N8N_SECRET" ]]; then
  echo "  INFO n8n webhook: $N8N_WH"
fi

BYTES="$(curl -s --max-time 30 -H "Host: ${DOMAIN}" http://127.0.0.1:3001/ 2>/dev/null | wc -c | tr -d ' ')"
echo "  INFO html bytes: ${BYTES:-0} (0 = timeout, 400 = domaine absent du build Docker)"

if [[ "$FAIL" -eq 0 ]]; then
  echo "OK verify"
else
  echo "ERREUR verify — voir docker logs gsms-app --tail 50"
  exit 1
fi
