#!/bin/bash
# Restaure .env / compose / dump Postgres depuis un dossier pre-* (SSH ou cockpit API).
# Modes : files (config seule) | postgres (BDD seule) | full (config + BDD)
set -euo pipefail

restore_vps_backup() {
  local DEST="$1"
  local MODE="${2:-files}"
  local GSMS_DIR="${GSMS_DIR:-/opt/gsms}"

  if [[ ! -d "$DEST" ]]; then
    echo "ERREUR: dossier introuvable: $DEST"
    return 1
  fi

  local root="${GSMS_DIR}/storage"
  case "$DEST" in
    "$root/archives"/*|"$root"/../.gsms-cockpit/backups/pre-*|$GSMS_DIR/.gsms-cockpit/backups/pre-*) ;;
    *)
      echo "ERREUR: chemin hors storage autorise"
      return 1
      ;;
  esac

  if [[ "${RESTORE_CONFIRM:-0}" != "1" ]]; then
    echo "ATTENTION: restauration ($MODE) vers $GSMS_DIR depuis $DEST"
    read -r -p "Continuer ? [o/N] " ans
    if [[ ! "$ans" =~ ^[oOyY] ]]; then
      echo "Annule."
      return 0
    fi
  fi

  restore_files() {
    for f in .env SECRETS.txt docker-compose.yml; do
      if [[ -f "$DEST/$f" ]]; then
        cp -a "$DEST/$f" "$GSMS_DIR/$f"
        echo "  + $f"
      fi
    done
  }

  restore_postgres() {
    if [[ ! -f "$DEST/postgres.dump" ]]; then
      echo "AVERTISSEMENT: pas de postgres.dump dans $DEST"
      return 0
    fi
    if ! docker ps --format '{{.Names}}' | grep -qx 'gsms-postgres'; then
      echo "ERREUR: gsms-postgres absent"
      return 1
    fi
    echo "==> Restauration PostgreSQL (pg_restore --clean)..."
    docker cp "$DEST/postgres.dump" gsms-postgres:/tmp/gsms-restore.dump
    docker exec gsms-postgres pg_restore -U "${POSTGRES_USER:-lms}" -d "${POSTGRES_DB:-lms_app}" --clean --if-exists /tmp/gsms-restore.dump 2>&1 || true
    docker exec gsms-postgres rm -f /tmp/gsms-restore.dump 2>/dev/null || true
    echo "  BDD restauree — pas de prisma db push necessaire (les donnees sont dans Postgres)."
  }

  case "$MODE" in
    files)
      restore_files
      ;;
    postgres)
      restore_postgres
      ;;
    full)
      restore_files
      restore_postgres
      ;;
    *)
      echo "ERREUR: mode inconnu ($MODE) — files | postgres | full"
      return 1
      ;;
  esac

  if [[ -f "$GSMS_DIR/docker-compose.yml" ]]; then
    echo "==> Redemarrage conteneurs apps..."
    cd "$GSMS_DIR"
    docker compose --profile apps up -d crm landing worker 2>/dev/null || docker compose --profile apps up -d
    docker compose up -d caddy 2>/dev/null || true
  fi

  echo "OK restauration ($MODE) terminee"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <chemin-pre-backup> [files|postgres|full]"
    exit 1
  fi
  restore_vps_backup "$1" "${2:-files}"
fi
