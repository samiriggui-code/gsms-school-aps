#!/bin/bash
# Page statique Traefik pendant rebuild / build apps (fichier $GSMS_DIR/maintenance/ON)
set -euo pipefail

GSMS_DIR="${GSMS_DIR:-/opt/gsms}"
MAINT_DIR="$GSMS_DIR/maintenance"
MAINT_FLAG="$MAINT_DIR/ON"
MAINT_OVERLAY="$GSMS_DIR/traefik/dynamic/maintenance.yaml"
TEMPLATES="${APP_ROOT:-}/deploy/gsms/templates"

write_maintenance_overlay() {
  local use_https="${1:-1}"
  local vars_file="$GSMS_DIR/traefik/dynamic/_vars.json"
  [[ -f "$vars_file" ]] || {
    echo "AVERTISSEMENT: _vars.json absent — regenerez Traefik (etape 2 infra) puis rebuild."
    return 0
  }
  local tpl="${TEMPLATES}/traefik-maintenance.yaml.tpl"
  [[ "$use_https" == "0" ]] && tpl="${TEMPLATES}/traefik-maintenance.http.yaml.tpl"
  [[ -f "$tpl" ]] || return 0
  command -v node >/dev/null 2>&1 || return 0
  node -e "
    const fs=require('fs');
    const vars=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
    const tpl=fs.readFileSync(process.argv[2],'utf8');
    let s=tpl;
    for (const [k,v] of Object.entries(vars)) {
      if (v===undefined||v===null) continue;
      s=s.split('{{'+k+'}}').join(String(v));
    }
    fs.writeFileSync(process.argv[3], s);
  " "$vars_file" "$tpl" "$MAINT_OVERLAY"
}

remove_maintenance_overlay() {
  rm -f "$MAINT_OVERLAY"
}

detect_traefik_http_only() {
  [[ -f "$GSMS_DIR/traefik/traefik.yml" ]] || return 1
  grep -q 'websecure' "$GSMS_DIR/traefik/traefik.yml" 2>/dev/null && return 1
  return 0
}

enable_deploy_maintenance() {
  mkdir -p "$MAINT_DIR"
  local src="${APP_ROOT:-}/deploy/gsms/maintenance/index.html"
  if [[ -f "$src" && ! -f "$MAINT_DIR/index.html" ]]; then
    cp "$src" "$MAINT_DIR/index.html"
  fi
  if [[ ! -f "$MAINT_DIR/index.html" ]]; then
    echo "AVERTISSEMENT: $MAINT_DIR/index.html absent — relancez etape 2 (infra) pour copier la stack GSMS."
  fi
  local use_https=1
  detect_traefik_http_only && use_https=0
  touch "$MAINT_FLAG"
  write_maintenance_overlay "$use_https"
  echo "==> Maintenance active (landing + CRM + docs via Traefik dynamic/maintenance.yaml)"
}

disable_deploy_maintenance() {
  rm -f "$MAINT_FLAG"
  remove_maintenance_overlay
  echo "==> Maintenance desactivee"
}
