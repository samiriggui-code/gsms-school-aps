#!/usr/bin/env bash
# Pilote bash deploy LMS (voie B) — modes non-wizard via deploy.config.json
#   ./scripts/deploy/deploy-lms.sh --prepare-only
#   ./scripts/deploy/deploy-lms.sh --infra-only [--deploy-now]
#   ./scripts/deploy/deploy-lms.sh --apps-only
#   ./scripts/deploy/deploy-lms.sh --rebuild-only [--no-cache] [--rebuild-docs]
#   ./scripts/deploy/deploy-lms.sh --apps-only --runtime pm2
#   ./scripts/deploy/deploy-lms.sh --apps-only --runtime systemd
#   ./scripts/deploy/deploy-lms.sh --apps-only --runtime python
#   ./scripts/deploy/deploy-lms.sh --apps-only --runtime php-fpm
#   ./scripts/deploy/deploy-lms.sh --apps-only --runtime go
#   ./scripts/deploy/deploy-lms.sh --apps-only --runtime static
set -euo pipefail

DEPLOY_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_deploy-lms-common.sh
source "${DEPLOY_SCRIPT_DIR}/_deploy-lms-common.sh"

CONFIG_FILE="${DEFAULT_CONFIG}"
PREPARE_ONLY=0
INFRA_ONLY=0
APPS_ONLY=0
REBUILD_ONLY=0
NO_CACHE=0
REBUILD_DOCS=0
DEPLOY_NOW=0
SKIP_STACK_UPLOAD=0
APPS_ONLY_STACK_REPAIR=0
DEPLOY_BOOTSTRAP_INFRA=0
DEPLOY_MODE=full
SYNC_MONOREPO=0
DEPLOY_APPS=false
DEPLOY_MIGRATE=false
DEPLOY_MONITORING=true
DOCKER_BUILD_NO_CACHE=0
REBUILD_DOCS_FLAG=0
OVERWRITE_ENV=0
DEPLOY_RUNTIME="${DEPLOY_RUNTIME:-docker-compose}"

usage() {
  cat <<'EOF'
Usage: deploy-lms.sh [un seul mode]
  --prepare-only          Etape 1 (PC, pas de SSH)
  --infra-only            Etape 2 infra VPS
  --apps-only             Etape 3 apps + migrations
  --rebuild-only          Rebuild images Docker
  --config-file PATH      deploy.config.json (defaut: scripts/deploy.config.json)
  --deploy-now            Infra : lancer sans confirmation
  --no-cache              Rebuild : docker build --no-cache
  --rebuild-docs          Rebuild : inclure docs
  --overwrite-env         Infra : ecraser .env distant
  --runtime VALUE         Runtime distant: docker-compose (defaut) | pm2 | systemd | python | php-fpm | go | static
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prepare-only) PREPARE_ONLY=1 ;;
    --infra-only) INFRA_ONLY=1 ;;
    --apps-only) APPS_ONLY=1 ;;
    --rebuild-only) REBUILD_ONLY=1 ;;
    --config-file) CONFIG_FILE="$2"; shift ;;
    --deploy-now) DEPLOY_NOW=1 ;;
    --no-cache) NO_CACHE=1; DOCKER_BUILD_NO_CACHE=1 ;;
    --rebuild-docs) REBUILD_DOCS=1; REBUILD_DOCS_FLAG=1 ;;
    --overwrite-env) OVERWRITE_ENV=1 ;;
    --runtime) DEPLOY_RUNTIME="$2"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Option inconnue: $1" ;;
  esac
  shift
done

mode_count=$((PREPARE_ONLY + INFRA_ONLY + APPS_ONLY + REBUILD_ONLY))
[[ "$mode_count" -le 1 ]] || die 'Un seul mode : --prepare-only OU --infra-only OU --apps-only OU --rebuild-only.'

if [[ "$PTY_MODE" == "1" ]]; then
  export LANG="${LANG:-en_US.UTF-8}"
fi
if [[ "$UI_CONFIRM" == "1" ]]; then
  log '[UI] Mode non interactif — valeurs par defaut (confirmation cockpit).'
elif [[ "$PTY_MODE" == "1" ]]; then
  log_cyan '[COCKPIT] Repondez dans le terminal du navigateur.'
fi

read_default() {
  local prompt="$1" default="${2:-}"
  if [[ "$UI_CONFIRM" == "1" ]]; then
    log "[UI] ${prompt} -> ${default:-(vide)}"
    printf '%s' "$default"
    return
  fi
  read -r -p "${prompt} [${default}]: " line || true
  if [[ -z "${line// }" ]]; then printf '%s' "$default"; else printf '%s' "$line"; fi
}

read_yesno() {
  local prompt="$1" default_yes="${2:-1}"
  if [[ "$UI_CONFIRM" == "1" ]]; then
    if [[ "$default_yes" == "1" ]]; then log "[UI] ${prompt} -> oui (defaut)"; return 0; fi
    log "[UI] ${prompt} -> non (defaut)"; return 1
  fi
  local hint="O/n"
  [[ "$default_yes" != "1" ]] && hint="o/N"
  read -r -p "${prompt} (${hint}): " v || true
  v="$(echo "$v" | tr '[:upper:]' '[:lower:]')"
  if [[ -z "$v" ]]; then [[ "$default_yes" == "1" ]]; return; fi
  [[ "$v" =~ ^(o|oui|y|yes)$ ]]
}

persist_config() {
  export SAVE_SshHost="$SSH_HOST" SAVE_SshUser="$SSH_USER" SAVE_SshKey="$SSH_KEY"
  export SAVE_GsmsDir="$GSMS_DIR" SAVE_AppRoot="$APP_ROOT" SAVE_ProjectName="$PROJECT_NAME"
  export SAVE_Domain="$DOMAIN" SAVE_ServerIp="$SERVER_IP" SAVE_Scheme="${SCHEME:-https}"
  export SAVE_CrmHost="$CRM_HOST" SAVE_DocsHost="$DOCS_HOST" SAVE_MonitoringHost="$MONITORING_HOST"
  export SAVE_PortainerHost="$PORTAINER_HOST" SAVE_UptimeHost="$UPTIME_HOST" SAVE_NetdataHost="$NETDATA_HOST"
  export SAVE_SmtpHost="$SMTP_HOST" SAVE_SmtpPort="$SMTP_PORT" SAVE_SmtpSecure="$SMTP_SECURE" SAVE_SmtpUser="$SMTP_USER"
  save_deploy_config
}

load_saved_config() {
  load_deploy_config "$CONFIG_FILE" || return 1
  apply_ui_host_env_overrides
  return 0
}

# --- Banniere ---
log ''
if [[ "$PREPARE_ONLY" == "1" ]]; then
  log_cyan '=== Preparation fichiers (PC uniquement, pas de SSH) ==='
elif [[ "$APPS_ONLY" == "1" ]]; then
  log_cyan '=== Deploiement LMS - mode AppsOnly (etape 3) ==='
elif [[ "$REBUILD_ONLY" == "1" ]]; then
  log_cyan '=== Rebuild images Docker sur le VPS (etape 4) ==='
elif [[ "$INFRA_ONLY" == "1" ]]; then
  log_cyan '=== Deploiement LMS - mode InfraOnly (etape 2 VPS) ==='
else
  log_cyan '=== Deploiement LMS (complet) ==='
fi
log ''

if [[ "$APPS_ONLY" == "1" || "$REBUILD_ONLY" == "1" ]]; then
  [[ -f "$CONFIG_FILE" ]] || die "Config introuvable: $CONFIG_FILE — faites etapes 1 et 2 d abord."
fi

load_saved_config || true
if [[ "$PTY_MODE" == "1" && -z "${LMS_DEPLOY_SSH_HOST:-}" && -f "$CONFIG_FILE" ]]; then
  log_yellow "[UI] Cible depuis deploy.config.json : ${SSH_USER}@${SSH_HOST} | ${GSMS_DIR}"
fi

# --- Prepare only ---
if [[ "$PREPARE_ONLY" == "1" ]]; then
  if [[ "$UI_CONFIRM" == "1" ]]; then
    load_saved_config || die "deploy.config.json requis en mode cockpit (--prepare-only)."
    new_staging_from_deploy_config
    persist_config
    log ''
    log_green '=== Preparation terminee (rien envoye au VPS) ==='
    log '  Etape suivante : scripts/2-etape-infra-vps.sh'
    exit 0
  fi
  die "Mode interactif prepare : utilisez deploy.config.json + LMS_DEPLOY_UI_CONFIRM=1 ou deploy-lms.ps1 -PrepareOnly"
fi

# --- Apps only ---
if [[ "$APPS_ONLY" == "1" ]]; then
  DEPLOY_MODE=apps_only
  SKIP_STACK_UPLOAD=1
  load_saved_config
  log "  VPS: ${SSH_USER}@${SSH_HOST}  |  ${SCHEME:-https}://${DOMAIN}"
  ssh_init
  test_ssh_key || die 'Cle SSH invalide'
  local_env="${STAGING}/.env"
  if [[ "$DEPLOY_RUNTIME" == "docker-compose" || "$DEPLOY_RUNTIME" == "docker" ]]; then
    if ! remote_test_path "${GSMS_DIR}/.env" || ! remote_test_path "${GSMS_DIR}/docker-compose.yml"; then
      log_yellow '--- Infra absente ou incomplete sur le VPS ---'
      if [[ -f "$local_env" ]]; then
        log_green "  Copie locale OK : $local_env"
        APPS_ONLY_STACK_REPAIR=1
        DEPLOY_BOOTSTRAP_INFRA=1
      elif read_yesno 'Regenerer .env depuis deploy.config.json (NOUVEAUX mots de passe)' 0; then
        new_staging_from_deploy_config
        APPS_ONLY_STACK_REPAIR=1
        DEPLOY_BOOTSTRAP_INFRA=1
      else
        die 'AppsOnly impossible sans .env sur le VPS. Lancez etape 2 ou etape 1.'
      fi
    else
      log 'Infra presente sur le VPS (.env OK).'
    fi
  else
    log "Runtime ${DEPLOY_RUNTIME}: pas de prerequis compose (.env/docker-compose)."
  fi
  read_yesno 'Synchroniser le monorepo depuis ce PC' 1 && SYNC_MONOREPO=1 || SYNC_MONOREPO=0
  DEPLOY_APPS=true
  read_yesno 'Executer migrations Prisma + seed' 1 && DEPLOY_MIGRATE=true || DEPLOY_MIGRATE=false
  DEPLOY_MONITORING=false
  read_yesno 'Lancer le deploiement apps maintenant' 1 || exit 0
  export SKIP_STACK_UPLOAD APPS_ONLY_STACK_REPAIR DEPLOY_BOOTSTRAP_INFRA DEPLOY_MODE SYNC_MONOREPO DEPLOY_APPS DEPLOY_MIGRATE DEPLOY_MONITORING DEPLOY_RUNTIME
  invoke_lms_deploy_execute
  exit 0
fi

# --- Rebuild only ---
if [[ "$REBUILD_ONLY" == "1" ]]; then
  DEPLOY_MODE=rebuild_only
  SKIP_STACK_UPLOAD=1
  load_saved_config
  log "  VPS: ${SSH_USER}@${SSH_HOST}"
  log '  Rebuild : images CRM + landing + worker'
  ssh_init
  test_ssh_key || die 'Cle SSH invalide'
  if ! remote_test_path "${GSMS_DIR}/.env" || ! remote_test_path "${GSMS_DIR}/docker-compose.yml"; then
    log_yellow '--- Infra absente sur le VPS ---'
    if [[ -f "${STAGING}/.env" ]]; then
      APPS_ONLY_STACK_REPAIR=1
      DEPLOY_BOOTSTRAP_INFRA=1
      SKIP_STACK_UPLOAD=0
    else
      die "Rebuild impossible sans stack sur ${SSH_USER}@${SSH_HOST}. Lancez etape 2."
    fi
  fi
  read_yesno 'Synchroniser le monorepo depuis ce PC' 1 && SYNC_MONOREPO=1 || SYNC_MONOREPO=0
  DEPLOY_APPS=true
  read_yesno 'Executer aussi migrations Prisma + seed (RISQUE prod)' 0 && DEPLOY_MIGRATE=true || DEPLOY_MIGRATE=false
  DEPLOY_MONITORING=false
  export REBUILD_DOCS="${REBUILD_DOCS_FLAG}"
  read_yesno 'Lancer le rebuild maintenant' 1 || exit 0
  export SKIP_STACK_UPLOAD APPS_ONLY_STACK_REPAIR DEPLOY_BOOTSTRAP_INFRA DEPLOY_MODE SYNC_MONOREPO DEPLOY_APPS DEPLOY_MIGRATE DEPLOY_MONITORING DOCKER_BUILD_NO_CACHE REBUILD_DOCS OVERWRITE_ENV DEPLOY_RUNTIME
  invoke_lms_deploy_execute
  exit 0
fi

# --- Infra only (et defaut) ---
if [[ "$INFRA_ONLY" == "1" ]]; then
  DEPLOY_MODE=infra_only
fi

staging_env="${STAGING}/.env"
skip_wizard=0

if [[ "$INFRA_ONLY" == "1" && -f "$staging_env" && -f "$CONFIG_FILE" ]]; then
  log_green 'Fichiers prepares trouves : scripts/.deploy-staging/'
  if read_yesno 'Utiliser ces fichiers (recommande)' 1; then
    skip_wizard=1
    load_saved_config
    SYNC_MONOREPO=0
    DEPLOY_APPS=false
    DEPLOY_MIGRATE=false
    read_yesno 'Deployer monitoring (Portainer, Netdata, Homepage, Uptime)' 1 && DEPLOY_MONITORING=true || DEPLOY_MONITORING=false
  fi
fi

if [[ "$INFRA_ONLY" == "1" && "$skip_wizard" == "0" && ! -f "$staging_env" ]]; then
  log_yellow 'Aucun staging (.deploy-staging/.env absent). Lancez etape 1.'
  read_yesno 'Continuer quand meme (regenerer ici)' 0 || exit 0
fi

if [[ "$skip_wizard" == "0" ]]; then
  if [[ "$UI_CONFIRM" == "1" ]]; then
    load_saved_config || die 'deploy.config.json + staging requis pour infra en mode cockpit.'
    if [[ ! -f "$staging_env" ]]; then
      new_staging_from_deploy_config
    fi
    SYNC_MONOREPO=0
    DEPLOY_APPS=false
    DEPLOY_MIGRATE=false
    DEPLOY_MONITORING=true
  else
    die 'Wizard interactif non porte en bash — utilisez deploy-lms.ps1 ou LMS_DEPLOY_UI_CONFIRM=1 + deploy.config.json'
  fi
fi

persist_config

log ''
log_green '--- Fichiers prepares (PC) ---'
log "  Dossier : $STAGING"

if [[ "$INFRA_ONLY" == "1" ]]; then
  log ''
  log_green '--- Recapitulatif envoi VPS ---'
  log "  VPS      : ${SSH_USER}@${SSH_HOST}"
  log "  Landing  : ${SCHEME:-https}://${DOMAIN}"
  log "  CRM      : ${SCHEME:-https}://${CRM_HOST}"
  if [[ "$DEPLOY_NOW" != "1" ]]; then
    read_yesno 'Envoyer au VPS et lancer l infra maintenant' 1 || {
      log "Fichiers prets dans : $STAGING"
      log '  Relancez : scripts/2-etape-infra-vps.sh'
      exit 0
    }
  fi
  export SKIP_STACK_UPLOAD DEPLOY_MODE SYNC_MONOREPO DEPLOY_APPS DEPLOY_MIGRATE DEPLOY_MONITORING DEPLOY_BOOTSTRAP_INFRA DOCKER_BUILD_NO_CACHE REBUILD_DOCS OVERWRITE_ENV DEPLOY_RUNTIME
  invoke_lms_deploy_execute
  exit 0
fi

die 'Mode complet non support en bash — utilisez etapes 1-3 ou deploy-lms.ps1'
