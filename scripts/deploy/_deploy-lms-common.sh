# shellcheck shell=bash
# Fonctions partagées deploy-lms.sh (pilote bash — voie B)
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_ROOT="$(cd "${DEPLOY_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${SCRIPTS_ROOT}/.." && pwd)"
STACK_SRC="${REPO_ROOT}/deploy/gsms"
TEMPLATES="${STACK_SRC}/templates"
STAGING="${SCRIPTS_ROOT}/.deploy-staging"
DEFAULT_CONFIG="${SCRIPTS_ROOT}/deploy.config.json"
DEFAULT_SSH_KEY="${HOME}/.ssh/id_ed25519"

PTY_MODE="${LMS_DEPLOY_PTY:-0}"
UI_CONFIRM="${LMS_DEPLOY_UI_CONFIRM:-0}"

log() { printf '%s\n' "$*"; }
log_cyan() { printf '\033[36m%s\033[0m\n' "$*"; }
log_green() { printf '\033[32m%s\033[0m\n' "$*"; }
log_yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
log_red() { printf '\033[31m%s\033[0m\n' "$*" >&2; }

die() { log_red "ERREUR: $*"; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Commande requise introuvable: $1"
}

new_secret() {
  openssl rand -hex 24 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 64 | head -c 48
}

json_get() {
  local key="$1" default="${2:-}"
  [[ -f "${CONFIG_FILE:-}" ]] || { printf '%s' "$default"; return; }
  node -e "
    const fs=require('fs');
    const p=process.argv[1], k=process.argv[2], d=process.argv[3]||'';
    let j={};
    try { j=JSON.parse(fs.readFileSync(p,'utf8')); } catch { process.stdout.write(d); process.exit(0); }
    const v=j[k];
    process.stdout.write(v==null||v===''?d:String(v));
  " "${CONFIG_FILE}" "$key" "$default"
}

load_deploy_config() {
  CONFIG_FILE="${1:-$DEFAULT_CONFIG}"
  [[ -f "$CONFIG_FILE" ]] || return 1
  log "Config chargee: $CONFIG_FILE"
  SSH_HOST="$(json_get SshHost '')"
  SSH_USER="$(json_get SshUser 'root')"
  SSH_KEY="$(json_get SshKey "$DEFAULT_SSH_KEY")"
  GSMS_DIR="$(json_get GsmsDir '/opt/gsms')"
  APP_ROOT="$(json_get AppRoot '/opt/app-prisma')"
  PROJECT_NAME="$(json_get ProjectName 'GSMS')"
  DOMAIN="$(json_get Domain '')"
  CRM_HOST="$(json_get CrmHost '')"
  DOCS_HOST="$(json_get DocsHost '')"
  MONITORING_HOST="$(json_get MonitoringHost '')"
  PORTAINER_HOST="$(json_get PortainerHost '')"
  UPTIME_HOST="$(json_get UptimeHost '')"
  NETDATA_HOST="$(json_get NetdataHost '')"
  SMTP_HOST="$(json_get SmtpHost 'smtp.hostinger.com')"
  SMTP_PORT="$(json_get SmtpPort '465')"
  SMTP_SECURE="$(json_get SmtpSecure 'true')"
  SMTP_USER="$(json_get SmtpUser '')"
  SCHEME="$(json_get Scheme 'https')"
  SERVER_IP="$(json_get ServerIp '')"
  return 0
}

apply_ui_host_env_overrides() {
  if [[ -n "${LMS_DEPLOY_SSH_HOST:-}" ]]; then
    SSH_HOST="${LMS_DEPLOY_SSH_HOST}"
    [[ -n "${LMS_DEPLOY_SSH_USER:-}" ]] && SSH_USER="${LMS_DEPLOY_SSH_USER}"
    [[ -n "${LMS_DEPLOY_SSH_KEY:-}" ]] && SSH_KEY="${LMS_DEPLOY_SSH_KEY}"
    [[ -n "${LMS_DEPLOY_GSMS_DIR:-}" ]] && GSMS_DIR="${LMS_DEPLOY_GSMS_DIR}"
    [[ -n "${LMS_DEPLOY_APP_ROOT:-}" ]] && APP_ROOT="${LMS_DEPLOY_APP_ROOT}"
    log_cyan "[UI] Cible VPS (profil hote cockpit): ${SSH_USER}@${SSH_HOST} | ${GSMS_DIR}"
    return 0
  fi
  if [[ "$PTY_MODE" == "1" && -n "${LMS_DEPLOY_UI_WARN:-}" ]]; then
    log_yellow "[UI] ${LMS_DEPLOY_UI_WARN}"
  fi
}

save_deploy_config() {
  need_cmd node
  node -e "
    const fs=require('fs');
    const o={
      SshHost:process.env.SAVE_SshHost||'',
      SshUser:process.env.SAVE_SshUser||'',
      SshKey:process.env.SAVE_SshKey||'',
      GsmsDir:process.env.SAVE_GsmsDir||'',
      AppRoot:process.env.SAVE_AppRoot||'',
      ProjectName:process.env.SAVE_ProjectName||'',
      Domain:process.env.SAVE_Domain||'',
      ServerIp:process.env.SAVE_ServerIp||'',
      Scheme:process.env.SAVE_Scheme||'',
      CrmHost:process.env.SAVE_CrmHost||'',
      DocsHost:process.env.SAVE_DocsHost||'',
      MonitoringHost:process.env.SAVE_MonitoringHost||'',
      PortainerHost:process.env.SAVE_PortainerHost||'',
      UptimeHost:process.env.SAVE_UptimeHost||'',
      NetdataHost:process.env.SAVE_NetdataHost||'',
      SmtpHost:process.env.SAVE_SmtpHost||'',
      SmtpPort:process.env.SAVE_SmtpPort||'',
      SmtpSecure:process.env.SAVE_SmtpSecure||'',
      SmtpUser:process.env.SAVE_SmtpUser||'',
    };
    fs.writeFileSync(process.argv[1], JSON.stringify(o,null,2));
  " "$DEFAULT_CONFIG"
  log_green "  -> Config: $DEFAULT_CONFIG"
}

# Remplace {{KEY}} via node (mots de passe sans casser sed)
expand_template_vars() {
  local tpl="$1" out="$2" json="$3"
  need_cmd node
  node -e "
    const fs=require('fs');
    const tpl=fs.readFileSync(process.argv[1],'utf8');
    const vars=JSON.parse(process.argv[2]);
    let s=tpl;
    for (const [k,v] of Object.entries(vars)) {
      if (v===undefined||v===null) throw new Error('Variable template manquante: '+k);
      s=s.split('{{'+k+'}}').join(String(v));
    }
    fs.writeFileSync(process.argv[3], s);
  " "$tpl" "$json" "$out"
}

copy_stack_to_staging() {
  rm -rf "$STAGING"
  mkdir -p "$STAGING"
  shopt -s dotglob
  for item in "${STACK_SRC}"/*; do
    base="$(basename "$item")"
    [[ "$base" == "templates" || "$base" == ".deploy-staging" ]] && continue
    cp -a "$item" "${STAGING}/"
  done
  shopt -u dotglob
}

expand_stack_staging() {
  local use_https="${1:-1}" json="$2"
  mkdir -p "${STAGING}/traefik/dynamic" "${STAGING}/homepage/config"
  expand_template_vars "${TEMPLATES}/.env.tpl" "${STAGING}/.env" "$json"
  if [[ "$use_https" == "1" ]]; then
    expand_template_vars "${TEMPLATES}/traefik.yml.tpl" "${STAGING}/traefik/traefik.yml" "$json"
    expand_template_vars "${TEMPLATES}/traefik-dynamic.yaml.tpl" "${STAGING}/traefik/dynamic/routers.yaml" "$json"
  else
    cp "${STACK_SRC}/traefik/traefik.http.yml" "${STAGING}/traefik/traefik.yml"
    expand_template_vars "${TEMPLATES}/traefik-dynamic.http.yaml.tpl" "${STAGING}/traefik/dynamic/routers.yaml" "$json"
  fi
  expand_template_vars "${TEMPLATES}/homepage-services.yaml.tpl" "${STAGING}/homepage/config/services.yaml" "$json"
  expand_template_vars "${TEMPLATES}/SECRETS.txt.tpl" "${STAGING}/SECRETS.txt" "$json"
  printf '%s' "$json" > "${STAGING}/traefik/dynamic/_vars.json"
}

new_staging_from_deploy_config() {
  [[ -n "$DOMAIN" ]] || die "deploy.config.json : Domain manquant"
  CRM_HOST="${CRM_HOST:-crm.${DOMAIN}}"
  DOCS_HOST="${DOCS_HOST:-docs.${DOMAIN}}"
  MONITORING_HOST="${MONITORING_HOST:-monitoring.${DOMAIN}}"
  PORTAINER_HOST="${PORTAINER_HOST:-portainer.${DOMAIN}}"
  UPTIME_HOST="${UPTIME_HOST:-uptime.${DOMAIN}}"
  NETDATA_HOST="${NETDATA_HOST:-netdata.${DOMAIN}}"
  SERVER_IP="${SERVER_IP:-$SSH_HOST}"
  SMTP_USER="${SMTP_USER:-admin@${DOMAIN}}"
  local pg_pass minio_pass pg_pass_enc
  pg_pass="$(new_secret)"
  minio_pass="$(new_secret)"
  pg_pass_enc="$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$pg_pass")"
  local scheme="${SCHEME:-https}"
  local use_https=1
  [[ "$scheme" == "http" ]] && use_https=0
  PROJECT_NAME="${PROJECT_NAME:-GSMS}"
  local homepage_hosts="${MONITORING_HOST},${PORTAINER_HOST},${UPTIME_HOST},${SERVER_IP},localhost"
  local netdata_host
  netdata_host="$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')"
  local tpl_json
  tpl_json="$(node -e "
    console.log(JSON.stringify({
      GENERATED_AT: new Date().toISOString().slice(0,16).replace('T',' '),
      PROJECT_NAME: process.argv[1],
      POSTGRES_USER: 'lms',
      POSTGRES_PASSWORD: process.argv[2],
      POSTGRES_PASSWORD_ENCODED: process.argv[3],
      POSTGRES_DB: 'lms_app',
      MINIO_ROOT_USER: 'lms',
      MINIO_ROOT_PASSWORD: process.argv[4],
      S3_BUCKET: 'lms-uploads',
      SMTP_HOST: process.argv[5],
      SMTP_PORT: process.argv[6],
      SMTP_SECURE: process.argv[7],
      SMTP_USER: process.argv[8],
      SMTP_PASS_QUOTED: '\"\"',
      SMTP_FROM: process.argv[8],
      SMTP_SENDER_QUOTED: JSON.stringify(process.argv[1]),
      CONTACT_TO_EMAIL: process.argv[8],
      CONTACT_SEND_USER_CONFIRMATION: 'true',
      NEXTAUTH_URL: process.argv[9]+'://'+process.argv[10],
      NEXTAUTH_SECRET: process.argv[11],
      AUTH_SECRET: process.argv[12],
      NEXT_PUBLIC_CRM_URL: process.argv[9]+'://'+process.argv[10],
      NEXT_PUBLIC_LANDING_URL: process.argv[9]+'://'+process.argv[13],
      NEXT_PUBLIC_SITE_URL: process.argv[9]+'://'+process.argv[13],
      HOMEPAGE_ALLOWED_HOSTS: process.argv[14],
      NETDATA_HOSTNAME: process.argv[15],
      DOMAIN: process.argv[13],
      CRM_HOST: process.argv[10],
      DOCS_HOST: process.argv[16],
      MONITORING_HOST: process.argv[17],
      PORTAINER_HOST: process.argv[18],
      UPTIME_HOST: process.argv[19],
      NETDATA_HOST: process.argv[20],
      SERVER_IP: process.argv[21],
      TRAEFIK_EMAIL: 'admin@'+process.argv[13],
      SCHEME: process.argv[9],
    }));
  " "$PROJECT_NAME" "$pg_pass" "$pg_pass_enc" "$minio_pass" \
    "$SMTP_HOST" "$SMTP_PORT" "$SMTP_SECURE" "$SMTP_USER" \
    "$scheme" "$CRM_HOST" "$(new_secret)" "$(new_secret)" "$DOMAIN" \
    "$homepage_hosts" "$netdata_host" "$DOCS_HOST" "$MONITORING_HOST" \
    "$PORTAINER_HOST" "$UPTIME_HOST" "$NETDATA_HOST" "$SERVER_IP")"
  copy_stack_to_staging
  expand_stack_staging "$use_https" "$tpl_json"
  log_green "  -> Staging regenere: $STAGING"
}

SSH_BASE=()
ssh_init() {
  SSH_BASE=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new)
}

ssh_target() { printf '%s@%s' "$SSH_USER" "$SSH_HOST"; }

test_ssh_key() {
  [[ -f "$SSH_KEY" ]] || { log_red "[SSH] Cle introuvable: $SSH_KEY"; return 1; }
  ssh-keygen -y -f "$SSH_KEY" >/dev/null 2>&1 || {
    log_red "[SSH] Cle refusee: $SSH_KEY"
    return 1
  }
  return 0
}

remote_test_path() {
  local path="$1"
  local out
  ssh_init
  out=$(ssh "${SSH_BASE[@]}" "$(ssh_target)" "test -e ${path} && echo yes || echo no")
  [[ "$(echo "$out" | tr -d '\r\n')" == "yes" ]]
}

remote_test_gsms_env() {
  remote_test_path "${GSMS_DIR}/.env"
}

send_full_stack_to_vps() {
  local local_env="${STAGING}/.env"
  [[ -f "$local_env" ]] || die "Fichier local manquant: $local_env — lancez scripts/1-etape-preparer-fichiers.sh"
  ssh_init
  log_cyan "  -> Upload scripts/.deploy-staging vers ${GSMS_DIR}"
  scp "${SSH_BASE[@]}" -r "${STAGING}/." "$(ssh_target):${GSMS_DIR}/"
  scp "${SSH_BASE[@]}" "$local_env" "$(ssh_target):${GSMS_DIR}/.env"
  [[ -f "${STAGING}/SECRETS.txt" ]] && scp "${SSH_BASE[@]}" "${STAGING}/SECRETS.txt" "$(ssh_target):${GSMS_DIR}/SECRETS.txt"
  ssh "${SSH_BASE[@]}" "$(ssh_target)" "chmod 600 ${GSMS_DIR}/SECRETS.txt ${GSMS_DIR}/.env 2>/dev/null; true"
}

invoke_lms_deploy_execute() {
  need_cmd ssh
  need_cmd scp
  test_ssh_key || die "Cle SSH invalide"
  ssh_init
  local target shell_args remote_script
  target="$(ssh_target)"
  log ''
  log_cyan '--- Sync vers VPS ---'
  ssh "${SSH_BASE[@]}" "$target" "mkdir -p ${GSMS_DIR}"
  scp "${SSH_BASE[@]}" "${DEPLOY_DIR}/prepare-vps.sh" "${target}:/tmp/prepare-vps.sh"
  scp "${SSH_BASE[@]}" "${DEPLOY_DIR}/install-docker-vps.sh" "${target}:/tmp/install-docker-vps.sh"
  scp "${SSH_BASE[@]}" "${DEPLOY_DIR}/_deploy-remote-lib.sh" "${target}:/tmp/_deploy-remote-lib.sh"
  ssh "${SSH_BASE[@]}" "$target" "sed -i 's/\r$//' /tmp/prepare-vps.sh /tmp/install-docker-vps.sh /tmp/_deploy-remote-lib.sh 2>/dev/null; chmod +x /tmp/prepare-vps.sh /tmp/install-docker-vps.sh /tmp/_deploy-remote-lib.sh 2>/dev/null; true"

  if [[ "${SKIP_STACK_UPLOAD:-0}" != "1" ]]; then
    if remote_test_gsms_env && [[ "${DEPLOY_MODE:-}" == "infra_only" && "${OVERWRITE_ENV:-0}" != "1" ]]; then
      log_yellow 'ATTENTION: .env deja present — upload stack SANS .env (OVERWRITE_ENV=1 pour ecraser)'
      shopt -s dotglob
      for item in "${STAGING}"/*; do
        base="$(basename "$item")"
        [[ "$base" == ".env" || "$base" == "SECRETS.txt" ]] && continue
        scp "${SSH_BASE[@]}" -r "$item" "${target}:${GSMS_DIR}/"
      done
      shopt -u dotglob
    else
      send_full_stack_to_vps
    fi
  elif [[ "${APPS_ONLY_STACK_REPAIR:-0}" == "1" ]]; then
    log_cyan '--- AppsOnly : envoi stack (/.env manquant) ---'
    send_full_stack_to_vps
  else
    log '  -> Pas de sync stack (/.env deja sur VPS)'
  fi

  if ! remote_test_gsms_env; then
    if [[ -f "${STAGING}/.env" ]]; then
      log_yellow 'AVERTISSEMENT: .env absent sur VPS — nouvel envoi...'
      send_full_stack_to_vps
      DEPLOY_BOOTSTRAP_INFRA=1
    fi
    remote_test_gsms_env || die "Echec upload: ${GSMS_DIR}/.env introuvable sur le VPS"
  fi
  log_green "  OK: ${GSMS_DIR}/.env present sur le VPS"

  if [[ "${SYNC_MONOREPO:-0}" == "1" ]]; then
    log_cyan '--- Sync monorepo (archive) ---'
    need_cmd tar
    local tarf
    tarf="$(mktemp /tmp/lms-monorepo-XXXXXX.tar.gz)"
    tar -czf "$tarf" -C "$REPO_ROOT" \
      --exclude=node_modules --exclude=.next --exclude=.git --exclude=.turbo \
      --exclude=scripts/.deploy-staging --exclude='*.tar.gz' .
    scp "${SSH_BASE[@]}" "$tarf" "${target}:/tmp/lms-monorepo.tar.gz"
    local ar="$APP_ROOT"
    ssh "${SSH_BASE[@]}" "$target" "set -e; mkdir -p ${ar}; tar -xzf /tmp/lms-monorepo.tar.gz -C ${ar}; rm -f /tmp/lms-monorepo.tar.gz; cp -f /tmp/_deploy-remote-lib.sh ${ar}/scripts/deploy/_deploy-remote-lib.sh 2>/dev/null || true; find ${ar}/scripts -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null; chmod +x ${ar}/scripts/deploy/*.sh 2>/dev/null; true"
    rm -f "$tarf"
  fi

  log_cyan '--- Execution sur le VPS (deploy-lms-remote.sh) ---'
  remote_script="${DEPLOY_DIR}/deploy-lms-remote.sh"
  scp "${SSH_BASE[@]}" "$remote_script" "${target}:/tmp/deploy-lms-remote.sh"
  local ar="$APP_ROOT"
  shell_args="sed -i 's/\\r$//' /tmp/deploy-lms-remote.sh /tmp/_deploy-remote-lib.sh /tmp/install-docker-vps.sh 2>/dev/null; true"
  shell_args+="; find ${ar}/scripts -name '*.sh' -exec sed -i 's/\\r$//' {} + 2>/dev/null; true"
  shell_args+="; chmod +x /tmp/deploy-lms-remote.sh /tmp/install-docker-vps.sh /tmp/_deploy-remote-lib.sh 2>/dev/null; true"
  shell_args+="; export GSMS_DIR=${GSMS_DIR}"
  shell_args+="; export DEPLOY_LIB=/tmp/_deploy-remote-lib.sh"
  shell_args+="; export APP_ROOT=${ar}"
  shell_args+="; export DEPLOY_MODE=${DEPLOY_MODE:-full}"
  shell_args+="; export DEPLOY_RUNTIME=${DEPLOY_RUNTIME:-docker-compose}"
  shell_args+="; export DEPLOY_APPS=${DEPLOY_APPS:-false}"
  shell_args+="; export DEPLOY_MIGRATE=${DEPLOY_MIGRATE:-false}"
  shell_args+="; export DEPLOY_MONITORING=${DEPLOY_MONITORING:-true}"
  shell_args+="; export DEPLOY_BOOTSTRAP_INFRA=${DEPLOY_BOOTSTRAP_INFRA:-false}"
  shell_args+="; export DOCKER_BUILD_NO_CACHE=${DOCKER_BUILD_NO_CACHE:-0}"
  shell_args+="; export REBUILD_DOCS=${REBUILD_DOCS:-0}"
  shell_args+="; bash /tmp/deploy-lms-remote.sh"

  set +e
  ssh -tt "${SSH_BASE[@]}" "$target" "$shell_args"
  local rc=$?
  set -e
  [[ "$rc" -eq 0 ]] || die "Echec script distant (code $rc)"

  log ''
  log_green '=== Deploiement termine ==='
  log "  Stack : ${GSMS_DIR}"
  log "  Landing : ${SCHEME:-https}://${DOMAIN}"
  log "  CRM     : ${SCHEME:-https}://${CRM_HOST}"
  if [[ "${DEPLOY_MODE:-}" != "apps_only" ]]; then
    log ''
    log_cyan 'Mots de passe Postgres / MinIO :'
    log "  ssh ${target} \"cat ${GSMS_DIR}/SECRETS.txt\""
  fi
  if [[ "${DEPLOY_MODE:-}" == "infra_only" ]]; then
    log ''
    log_green 'Etape 3 : scripts/3-etape-apps-vps.sh'
  fi
  log ''
  log_yellow "DNS : A records -> ${SERVER_IP:-$SSH_HOST}"
}
