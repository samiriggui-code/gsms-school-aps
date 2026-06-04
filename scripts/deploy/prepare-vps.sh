#!/bin/bash
# Preparation VPS vierge : mises a jour OS + pare-feu (UFW) + fail2ban SSH.
# Idempotent : ne refait pas upgrade si /opt/gsms/.vps-prepared existe (sauf PREPARE_VPS_FORCE=1).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

MARKER="${VPS_PREPARED_MARKER:-/opt/gsms/.vps-prepared}"
GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
mkdir -p "$GSMS_DIR"

if [[ -f "$MARKER" && "${PREPARE_VPS_FORCE:-0}" != "1" ]]; then
  echo "==> VPS deja prepare ($MARKER) — skip (PREPARE_VPS_FORCE=1 pour forcer)"
  exit 0
fi

if [[ $EUID -ne 0 ]]; then
  echo "prepare-vps.sh doit etre execute en root (ou sudo)."
  exit 1
fi

echo "=============================================="
echo " Preparation VPS — apt, UFW, fail2ban"
echo "=============================================="

echo "==> [1/4] Mise a jour systeme (apt update + upgrade)..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get autoremove -y -qq

echo "==> [2/4] Paquets utiles (ufw, fail2ban, curl)..."
apt-get install -y -qq ufw fail2ban curl ca-certificates

echo "==> [3/4] Pare-feu UFW (SSH + HTTP + HTTPS)..."
# Ne pas couper SSH : autoriser 22 avant enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP Caddy'
ufw allow 443/tcp comment 'HTTPS Caddy'
ufw --force enable
ufw status verbose | head -20

echo "==> [4/4] fail2ban (protection SSH)..."
systemctl enable fail2ban 2>/dev/null || true
systemctl restart fail2ban 2>/dev/null || true
fail2ban-client status sshd 2>/dev/null | head -5 || fail2ban-client status 2>/dev/null | head -8 || true

date -Is > "$MARKER"
echo "==> Preparation terminee. Marqueur: $MARKER"
