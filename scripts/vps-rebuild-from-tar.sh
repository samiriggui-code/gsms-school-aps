#!/bin/bash
# Alias — préférer deploy/gsms/vps-rebuild-complete.sh (copié sur le VPS avec le code).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/../deploy/gsms/vps-rebuild-complete.sh" "$@"
