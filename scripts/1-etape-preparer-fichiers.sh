#!/usr/bin/env bash
# ETAPE 1 — Preparation fichiers (PC, pas de SSH)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo ''
echo '========== ETAPE 1 / 3 : PREPARER LES FICHIERS (PC) =========='
echo "  Dossier projet : $ROOT"
echo '  Sortie         : scripts/.deploy-staging/'
echo '  Etape suivante : scripts/2-etape-infra-vps.sh'
echo ''
exec bash "$(dirname "$0")/deploy/deploy-lms.sh" --prepare-only "$@"
