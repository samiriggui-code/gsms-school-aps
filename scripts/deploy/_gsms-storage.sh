#!/bin/bash
# Stockage GSMS sur le VPS — archives Postgres + config (sourcé par deploy / cockpit).
set -euo pipefail

_gsms_storage_root() {
  echo "${GSMS_DIR:-/opt/gsms}/storage"
}

_gsms_storage_archives() {
  echo "$(_gsms_storage_root)/archives"
}

# kind: rebuild | manual | periodic | scheduled
capture_gsms_storage_backup() {
  local kind="${1:-manual}"
  local label="${2:-$kind}"
  local GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
  local ARCHIVES="$(_gsms_storage_archives)"
  local LEGACY="$GSMS_DIR/.gsms-cockpit/backups"
  local KEEP="${VPS_BACKUP_KEEP:-14}"
  local STAMP
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  local DEST="$ARCHIVES/${STAMP}_${kind}"

  if [[ "${DEPLOY_SKIP_VPS_BACKUP:-0}" == "1" ]]; then
    echo "==> Storage: sauvegarde ignoree"
    return 0
  fi

  mkdir -p "$ARCHIVES" "$(_gsms_storage_root)/compose-snapshots" "$DEST"

  copy_if_exists() {
    local rel="$1"
    if [[ -f "$GSMS_DIR/$rel" ]]; then
      cp -a "$GSMS_DIR/$rel" "$DEST/$(basename "$rel")"
      echo "  + $rel"
    fi
  }

  echo "==> GSMS Storage [$kind] -> $DEST"
  copy_if_exists ".env"
  copy_if_exists "SECRETS.txt"
  copy_if_exists "docker-compose.yml"

  local POSTGRES_USER="${POSTGRES_USER:-lms}"
  local POSTGRES_DB="${POSTGRES_DB:-lms_app}"
  local pg_ok=0

  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'gsms-postgres'; then
    echo "==> Dump PostgreSQL ($POSTGRES_DB)..."
    docker exec gsms-postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --format=custom -f /tmp/gsms-storage.dump
    docker cp gsms-postgres:/tmp/gsms-storage.dump "$DEST/postgres.dump"
    docker exec gsms-postgres rm -f /tmp/gsms-storage.dump 2>/dev/null || true
    pg_ok=1
    echo "  + postgres.dump"
  fi

  cat >"$DEST/manifest.json" <<EOF
{
  "version": 1,
  "kind": "$kind",
  "label": "$label",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gsmsDir": "$GSMS_DIR",
  "components": {
    "postgres": $pg_ok,
    "env": $(test -f "$DEST/.env" && echo true || echo false),
    "compose": $(test -f "$DEST/docker-compose.yml" && echo true || echo false)
  }
}
EOF

  # Rétention archives/
  if [[ -d "$ARCHIVES" ]]; then
    local n=0
    local d
    for d in $(ls -dt "$ARCHIVES"/* 2>/dev/null || true); do
      n=$((n + 1))
      if [[ "$n" -gt "$KEEP" ]]; then
        rm -rf "$d"
        echo "  (prune) $d"
      fi
    done
  fi

  # Legacy pre-* (migration douce)
  if [[ -d "$LEGACY" ]]; then
    for d in $(ls -dt "$LEGACY"/pre-* 2>/dev/null || true); do
      n=$((n + 1))
      if [[ "$n" -gt "$KEEP" ]]; then
        rm -rf "$d"
      fi
    done
  fi

  echo "OK storage:$DEST"
}

# Liste JSON une ligne par archive (cockpit)
list_gsms_storage_archives() {
  local ARCHIVES="$(_gsms_storage_archives)"
  local LEGACY="${GSMS_DIR:-/opt/gsms}/.gsms-cockpit/backups"
  emit_one() {
    local dir="$1"
    local kind="$2"
    local label="$3"
    local created="$4"
    local pg=0 envf=0 comp=0
    [ -f "$dir/postgres.dump" ] && pg=1
    [ -f "$dir/.env" ] && envf=1
    [ -f "$dir/docker-compose.yml" ] && comp=1
    if [ -f "$dir/manifest.json" ]; then
      kind=$(sed -n 's/.*"kind"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$dir/manifest.json" | head -1)
      label=$(sed -n 's/.*"label"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$dir/manifest.json" | head -1)
      created=$(sed -n 's/.*"createdAt"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$dir/manifest.json" | head -1)
    fi
    echo "$dir|archive|$kind|${label:-$kind}|${created:-}|$pg|$envf|$comp"
  }
  if [ -d "$ARCHIVES" ]; then
    for d in $(ls -dt "$ARCHIVES"/* 2>/dev/null | head -40); do
      emit_one "$d" "manual" "$(basename "$d")" ""
    done
  fi
  if [ -d "$LEGACY" ]; then
    for d in $(ls -dt "$LEGACY"/pre-* 2>/dev/null | head -20); do
      emit_one "$d" "rebuild" "legacy-pre" ""
    done
  fi
}

delete_gsms_storage_archive() {
  local target="$1"
  local root="$(_gsms_storage_root)"
  case "$target" in
    */storage/archives/*|*/.gsms-cockpit/backups/pre-*)
      rm -rf "$target"
      echo "OK deleted:$target"
      ;;
    *)
      echo "ERREUR: chemin non autorise"
      return 1
      ;;
  esac
}

# Compat ancien nom
capture_vps_pre_deploy_backup() {
  capture_gsms_storage_backup rebuild "${1:-rebuild}"
}
