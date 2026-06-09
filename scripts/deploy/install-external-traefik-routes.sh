#!/bin/bash
# Publie les routes LMS vers le Traefik deja present sur le VPS (file provider).
set -euo pipefail

GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
ROUTES_SRC="${GSMS_DIR}/traefik/dynamic/routers.yaml"
ENV_FILE="${GSMS_DIR}/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source <(grep -E '^(EXTERNAL_TRAEFIK|TRAEFIK_DYNAMIC_DIR|TRAEFIK_CONTAINER_NAME)=' "$ENV_FILE" | tr -d '\r' || true)
  set +a
fi

if [[ "${EXTERNAL_TRAEFIK:-false}" != "true" && "${EXTERNAL_TRAEFIK:-0}" != "1" ]]; then
  echo "==> Traefik externe desactive (EXTERNAL_TRAEFIK) — rien a faire"
  exit 0
fi

TRAEFIK_DYNAMIC_DIR="${TRAEFIK_DYNAMIC_DIR:-/opt/traefik/dynamic}"
TRAEFIK_CONTAINER_NAME="${TRAEFIK_CONTAINER_NAME:-traefik}"
ROUTES_DEST="${TRAEFIK_DYNAMIC_DIR}/gsms-lms-routes.yaml"

if [[ ! -f "$ROUTES_SRC" ]]; then
  echo "ERREUR: routes introuvables: $ROUTES_SRC"
  echo "  Relancez l etape 1 (preparer-fichiers) puis etape 2."
  exit 1
fi

echo "==> Traefik externe : suppression gsms-traefik si present..."
docker rm -f gsms-traefik 2>/dev/null || true

echo "==> Publication routes LMS -> $ROUTES_DEST"
mkdir -p "$TRAEFIK_DYNAMIC_DIR"
cp -f "$ROUTES_SRC" "$ROUTES_DEST"
chmod 644 "$ROUTES_DEST"

resolve_traefik_container() {
  local name="$1"
  if docker inspect "$name" >/dev/null 2>&1; then
    echo "$name"
    return 0
  fi
  local candidate
  for candidate in traefik root-traefik-1 traefik-traefik-1; do
    if docker inspect "$candidate" >/dev/null 2>&1; then
      echo "$candidate"
      return 0
    fi
  done
  docker ps --format '{{.Names}}' | grep -i traefik | head -1 || true
}

TRAEFIK_CTR="$(resolve_traefik_container "$TRAEFIK_CONTAINER_NAME")"
if [[ -z "$TRAEFIK_CTR" ]]; then
  echo "AVERTISSEMENT: conteneur Traefik introuvable (nom attendu: $TRAEFIK_CONTAINER_NAME)"
  echo "  Routes copiees. Connectez manuellement le reseau gsms :"
  echo "    docker network connect gsms <nom-conteneur-traefik>"
  exit 0
fi

echo "==> Connexion $TRAEFIK_CTR au reseau Docker gsms..."
_traefik_on_gsms=0
if docker network inspect gsms >/dev/null 2>&1; then
  if docker network connect gsms "$TRAEFIK_CTR" 2>/dev/null; then
    _traefik_on_gsms=1
  fi
else
  echo "AVERTISSEMENT: reseau gsms absent — demarrez d abord la stack GSMS (postgres, apps...)"
fi

# Traefik hPanel (host network) : ne peut pas rejoindre gsms -> loopback 127.0.0.1
if [[ "$_traefik_on_gsms" -eq 0 ]]; then
  echo "==> Traefik hors reseau gsms (host network hPanel) — routes via 127.0.0.1"
  sed -i \
    -e 's|http://gsms-landing:3000|http://127.0.0.1:3000|g' \
    -e 's|http://gsms-crm:3001|http://127.0.0.1:3001|g' \
    -e 's|http://gsms-docs:3004|http://127.0.0.1:3004|g' \
    -e 's|http://gsms-homepage:3000|http://127.0.0.1:3005|g' \
    -e 's|http://gsms-portainer:9000|http://127.0.0.1:9000|g' \
    -e 's|http://gsms-uptime-kuma:3001|http://127.0.0.1:3006|g' \
    -e 's|http://gsms-netdata:19999|http://127.0.0.1:19999|g' \
    "$ROUTES_DEST"
fi

echo "OK Traefik externe : $ROUTES_DEST (conteneur: $TRAEFIK_CTR, reseau_gsms=$_traefik_on_gsms)"
