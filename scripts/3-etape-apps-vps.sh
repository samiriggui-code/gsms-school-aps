#!/usr/bin/env bash
# ETAPE 3 — Applications (CRM, landing, migrations)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
cfg="${ROOT}/scripts/deploy.config.json"
if [[ ! -f "$cfg" ]]; then
  echo ''
  echo 'ERREUR : deploy.config.json introuvable.'
  echo '  Etapes 1 et 2 requises.'
  echo ''
  exit 1
fi
echo ''
echo '========== ETAPE 3 / 3 : APPS (CRM + landing) =========='
echo ''
exec bash "$(dirname "$0")/deploy/deploy-lms.sh" --apps-only "$@"
