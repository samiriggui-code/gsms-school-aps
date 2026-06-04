#!/usr/bin/env bash
# REBUILD — images Docker sur le VPS
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
cfg="${ROOT}/scripts/deploy.config.json"
if [[ ! -f "$cfg" ]]; then
  echo ''
  echo 'ERREUR : deploy.config.json introuvable.'
  echo ''
  exit 1
fi
extra=()
[[ " $* " == *" -NoCache "* || " $* " == *" --no-cache "* ]] && extra+=(--no-cache)
echo ''
echo '========== REBUILD IMAGES VPS =========='
echo ''
exec bash "$(dirname "$0")/deploy/deploy-lms.sh" --rebuild-only "${extra[@]}" "$@"
