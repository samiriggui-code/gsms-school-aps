#!/usr/bin/env bash
# Affiche le guide de déploiement (aucune modification sur le VPS)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
README="$SCRIPT_DIR/README.md"

echo ''
echo '============================================================'
echo '  DEPLOIEMENT LMS - 3 ETAPES'
echo '============================================================'
echo ''
echo "Projet : $REPO_ROOT"
echo "Detail : $README"
echo ''
echo '  cd '"$REPO_ROOT"
echo '  ./scripts/0-reset-tout.sh              # repartir de zero'
echo '  ./scripts/1-etape-preparer-fichiers.sh # PC : .env, secrets'
echo '  ./scripts/2-etape-infra-vps.sh         # VPS : Docker, Postgres'
echo '  ./scripts/3-etape-apps-vps.sh          # VPS : CRM, landing'
echo '  ./scripts/4-etape-rebuild-images.sh    # VPS : rebuild Docker'
echo ''
echo "Detail : $SCRIPT_DIR/DEPLOIEMENT.md"
echo ''

CONFIG="$SCRIPT_DIR/deploy.config.json"
STAGING="$SCRIPT_DIR/.deploy-staging/.env"
if [[ -f "$STAGING" ]]; then
  echo 'Etat : .deploy-staging OK - vous pouvez lancer etape 2'
else
  echo 'Etat : commencez par etape 1 (preparer-fichiers)'
fi
if [[ -f "$CONFIG" ]]; then
  echo 'Etat : deploy.config.json present'
fi
echo ''
