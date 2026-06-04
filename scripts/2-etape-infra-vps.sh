#!/usr/bin/env bash
# ETAPE 2 — Infra VPS (Docker, Postgres, Caddy…)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
staging="${ROOT}/scripts/.deploy-staging/.env"
if [[ ! -f "$staging" ]]; then
  echo ''
  echo 'ERREUR : fichiers non prepares.'
  echo '  Lancez : scripts/1-etape-preparer-fichiers.sh'
  echo ''
  exit 1
fi
echo ''
echo '========== ETAPE 2 / 3 : ENVOI INFRA VPS =========='
echo "  Dossier projet : $ROOT"
echo '  Etape suivante : scripts/3-etape-apps-vps.sh'
echo ''
exec bash "$(dirname "$0")/deploy/deploy-lms.sh" --infra-only --deploy-now "$@"
