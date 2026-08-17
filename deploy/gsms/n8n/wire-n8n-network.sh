#!/bin/bash
# Branche le conteneur n8n sur le réseau Docker `gsms` (accès à gsms-app:3001).
# Rend le branchement persistant dans /docker/n8n-*/docker-compose.yml si présent.
set -euo pipefail

GSMS_NET="${GSMS_NET:-gsms}"
N8N_CONTAINER="${N8N_CONTAINER:-}"
N8N_COMPOSE_DIR="${N8N_COMPOSE_DIR:-}"

if [[ -z "$N8N_CONTAINER" ]]; then
  N8N_CONTAINER="$(docker ps --format '{{.Names}}' | grep -E 'n8n' | head -1 || true)"
fi

if [[ -z "$N8N_CONTAINER" ]]; then
  echo "ERREUR: conteneur n8n introuvable"
  exit 1
fi

if ! docker network inspect "$GSMS_NET" >/dev/null 2>&1; then
  echo "ERREUR: réseau Docker '$GSMS_NET' introuvable"
  exit 1
fi

echo "==> Connect $N8N_CONTAINER → réseau $GSMS_NET"
docker network connect "$GSMS_NET" "$N8N_CONTAINER" 2>/dev/null || \
  echo "    (déjà connecté ou connect en cours)"

echo "==> Test HTTP interne http://gsms-app:3001/api/common/health"
if docker exec "$N8N_CONTAINER" wget -qO- --timeout=8 http://gsms-app:3001/api/common/health 2>/dev/null | grep -q healthy; then
  echo "    OK gsms-app joignable depuis n8n"
else
  # busybox wget peut échouer sur JSON ; essayer curl ou code HTTP
  if docker exec "$N8N_CONTAINER" sh -c 'wget -qO- --timeout=8 http://gsms-app:3001/api/common/health' 2>&1 | grep -q status; then
    echo "    OK gsms-app joignable depuis n8n"
  else
    echo "AVERTISSEMENT: health check interne échoué — vérifier alias gsms-app"
    docker exec "$N8N_CONTAINER" sh -c 'wget -qO- --timeout=8 http://gsms-app:3001/api/common/health' 2>&1 || true
  fi
fi

# Persistance compose Hostinger (/docker/n8n-*)
if [[ -z "$N8N_COMPOSE_DIR" ]]; then
  for d in /docker/n8n-*; do
    if [[ -f "$d/docker-compose.yml" ]]; then
      N8N_COMPOSE_DIR="$d"
      break
    fi
  done
fi

if [[ -n "$N8N_COMPOSE_DIR" && -f "$N8N_COMPOSE_DIR/docker-compose.yml" ]]; then
  COMPOSE="$N8N_COMPOSE_DIR/docker-compose.yml"
  if ! grep -qE 'external:\s*true' "$COMPOSE" || ! grep -q "$GSMS_NET" "$COMPOSE"; then
    echo "==> Persistance réseau dans $COMPOSE"
    cp -a "$COMPOSE" "$COMPOSE.bak.$(date +%Y%m%d-%H%M%S)"
    # Réécrit un compose minimal compatible Hostinger + réseau gsms
    python3 - <<'PY' "$COMPOSE" "$GSMS_NET"
import sys, re
path, net = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()
if f"name: {net}" in text or f"name: '{net}'" in text:
    print("    déjà configuré")
    sys.exit(0)
# Ajoute networks au service n8n et bloc networks racine
if re.search(r"(?m)^  n8n:\s*$", text) and "networks:" not in text.split("n8n:", 1)[1].split("\n\n", 1)[0]:
    text = re.sub(
        r"(?m)^(  n8n:\n(?:    .*\n)*)",
        rf"\1    networks:\n      - default\n      - {net}\n",
        text,
        count=1,
    )
if not re.search(r"(?m)^networks:\s*$", text):
    text = text.rstrip() + f"\n\nnetworks:\n  default:\n  {net}:\n    external: true\n    name: {net}\n"
elif net not in text:
    text = text.rstrip() + f"\n  {net}:\n    external: true\n    name: {net}\n"
open(path, "w", encoding="utf-8").write(text)
print("    compose mis à jour")
PY
  else
    echo "==> Compose déjà branché sur $GSMS_NET"
  fi
fi

echo "OK wire n8n ↔ $GSMS_NET"
