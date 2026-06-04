#!/usr/bin/env bash
# =============================================================================
# RESET - repartir de zero (PC + VPS)
# =============================================================================
# Usage :
#   cd /path/to/app-prisma
#   ./scripts/0-reset-tout.sh
#   ./scripts/0-reset-tout.sh --force   # apres confirmation UI lms-deploy
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_KEY="${HOME}/.ssh/id_ed25519"
CONFIG_PATH="$SCRIPT_DIR/deploy.config.json"
STAGING_PATH="$SCRIPT_DIR/.deploy-staging"

FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force|-Force) FORCE=1 ;;
  esac
done

UI_CONFIRM=0
if [[ "$FORCE" == "1" || "${LMS_DEPLOY_UI_CONFIRM:-}" == "1" ]]; then
  UI_CONFIRM=1
fi

read_yesno() {
  local prompt="$1" default_yes="${2:-0}"
  local hint v
  if [[ "$default_yes" == "1" ]]; then hint='O/n'; else hint='o/N'; fi
  read -r -p "$prompt ($hint) " v || true
  v="${v,,}"
  if [[ -z "$v" ]]; then
    [[ "$default_yes" == "1" ]] && return 0 || return 1
  fi
  case "$v" in
    o|oui|y|yes) return 0 ;;
    *) return 1 ;;
  esac
}

echo ''
echo '========== RESET DEPLOIEMENT (PC + VPS) =========='
echo ''
echo 'Cela va SUPPRIMER :'
echo '  Sur ce PC     : .deploy-staging, deploy.config.json'
echo '  Sur le VPS    : /opt/gsms, /opt/app-prisma, stack Docker GSMS'
echo '  Donnees       : Postgres, MinIO, certificats Caddy (volumes Docker)'
echo ''
echo '  Docker CE     : selon reference VPS (vps-baseline.json)'
echo ''

if [[ "$UI_CONFIRM" == "1" ]]; then
  echo '[UI] Confirmation deja validee dans l interface deploy.'
elif ! read_yesno 'Confirmer la suppression complete' 0; then
  echo 'Annule.'
  exit 0
fi

ssh_host=''
ssh_user='root'
ssh_key="$DEFAULT_KEY"
gsms_dir='/opt/gsms'
app_root='/opt/app-prisma'

load_config_from_json() {
  local cfg_path="$1"
  if command -v node >/dev/null 2>&1; then
    eval "$(node - "$cfg_path" <<'NODE'
const fs = require('fs');
const sh = (v) => `'${String(v).replace(/'/g, "'\\''")}'`;
const c = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const map = [
  ['SshHost', 'ssh_host'],
  ['SshUser', 'ssh_user'],
  ['SshKey', 'ssh_key'],
  ['GsmsDir', 'gsms_dir'],
  ['AppRoot', 'app_root'],
];
for (const [k, envk] of map) {
  const v = c[k];
  if (v != null && String(v).trim() !== '') {
    console.log(`export ${envk}=${sh(v)}`);
  }
}
NODE
)"
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    eval "$(python3 - "$cfg_path" <<'PY'
import json, sys, shlex
p = sys.argv[1]
with open(p, encoding="utf-8") as f:
    c = json.load(f)
for k, envk in [("SshHost","ssh_host"),("SshUser","ssh_user"),("SshKey","ssh_key"),("GsmsDir","gsms_dir"),("AppRoot","app_root")]:
    v = c.get(k)
    if v:
        print(f"export {envk}={shlex.quote(str(v))}")
PY
)"
    return 0
  fi
  if command -v python >/dev/null 2>&1; then
    eval "$(python - "$cfg_path" <<'PY'
import json, sys, shlex
p = sys.argv[1]
with open(p, encoding="utf-8") as f:
    c = json.load(f)
for k, envk in [("SshHost","ssh_host"),("SshUser","ssh_user"),("SshKey","ssh_key"),("GsmsDir","gsms_dir"),("AppRoot","app_root")]:
    v = c.get(k)
    if v:
        print(f"export {envk}={shlex.quote(str(v))}")
PY
)"
    return 0
  fi
  echo "AVERTISSEMENT: node/python indisponible — impossible de lire deploy.config.json." >&2
  return 1
}

if [[ -f "$CONFIG_PATH" ]]; then
  load_config_from_json "$CONFIG_PATH" || true
  echo "Config lue : ${ssh_user}@${ssh_host}"
elif [[ "$UI_CONFIRM" == "1" ]]; then
  echo '[UI] Pas de deploy.config.json — attente de la cible envoyee par le cockpit.'
else
  echo 'Pas de deploy.config.json — entrez la cible VPS.'
  read -r -p "IP ou hostname du VPS: " input_host || true
  if [[ -n "${input_host// }" ]]; then ssh_host="${input_host// /}"; fi
fi

[[ -n "${LMS_DEPLOY_SSH_HOST:-}" ]] && ssh_host="${LMS_DEPLOY_SSH_HOST// /}"
[[ -n "${LMS_DEPLOY_SSH_USER:-}" ]] && ssh_user="${LMS_DEPLOY_SSH_USER// /}"
[[ -n "${LMS_DEPLOY_SSH_KEY:-}" ]] && ssh_key="${LMS_DEPLOY_SSH_KEY// /}"
[[ -n "${LMS_DEPLOY_GSMS_DIR:-}" ]] && gsms_dir="${LMS_DEPLOY_GSMS_DIR// /}"
[[ -n "${LMS_DEPLOY_APP_ROOT:-}" ]] && app_root="${LMS_DEPLOY_APP_ROOT// /}"

if [[ -z "${ssh_host}" ]]; then
  echo 'ERREUR: cible SSH introuvable (SshHost absent).'
  echo 'Utilisez le reset depuis le cockpit (sync cible auto) ou renseignez scripts/deploy.config.json.'
  exit 1
fi

ssh_target="${ssh_user}@${ssh_host}"
ssh_args=(-i "$ssh_key" -o StrictHostKeyChecking=accept-new)
ssh_stream_args=(-t "${ssh_args[@]}")

echo ''
echo '--- Reset VPS (SSH) ---'
deploy_dir="$SCRIPT_DIR/deploy"
remote_sh="$deploy_dir/reset-deploiement-vps.sh"
remote_lib_dir="$deploy_dir/lib"
remote_on_host='/tmp/reset-deploiement-vps.sh'
remote_lib_on_host='/tmp/lib'

skip_remote=0
if ! ssh "${ssh_args[@]}" "$ssh_target" 'echo OK' >/dev/null 2>&1; then
  echo "AVERTISSEMENT: VPS inaccessible ($ssh_target) - nettoyage local seulement."
  skip_remote=1
fi

if [[ "$skip_remote" == "0" ]]; then
  if [[ ! -d "$remote_lib_dir" ]]; then
    echo "ERREUR: dossier lib manquant : $remote_lib_dir"
    exit 1
  fi
  ssh "${ssh_args[@]}" "$ssh_target" "mkdir -p $remote_lib_on_host"
  for f in "$remote_lib_dir"/*; do
    [[ -f "$f" ]] || continue
    scp "${ssh_args[@]}" "$f" "${ssh_target}:${remote_lib_on_host}/$(basename "$f")"
  done
  scp "${ssh_args[@]}" "$remote_sh" "${ssh_target}:${remote_on_host}"
  sed_cr="sed -i 's/\r$//' $remote_on_host $remote_lib_on_host/*.sh 2>/dev/null; true"
  remote_cmd="${sed_cr}; chmod +x $remote_on_host $remote_lib_on_host/*.sh 2>/dev/null; true; export GSMS_DIR=$gsms_dir APP_ROOT=$app_root; bash $remote_on_host"
  set +e
  ssh "${ssh_stream_args[@]}" "$ssh_target" "$remote_cmd"
  ssh_exit=$?
  set -e
  if [[ "$ssh_exit" -ne 0 ]]; then
    echo "ERREUR SSH (code $ssh_exit). Verifiez la sortie ci-dessus."
    if [[ "$UI_CONFIRM" == "1" ]]; then
      echo '[UI] VPS inaccessible — nettoyage local seulement.'
    elif ! read_yesno 'Continuer le nettoyage local quand meme' 1; then
      exit 1
    fi
  else
    echo 'VPS nettoye.'
  fi
fi

echo ''
echo '--- Reset PC (fichiers locaux) ---'
if [[ -d "$STAGING_PATH" ]]; then
  rm -rf "$STAGING_PATH"
  echo "  Supprime : $STAGING_PATH"
fi
if [[ -f "$CONFIG_PATH" ]]; then
  rm -f "$CONFIG_PATH"
  echo "  Supprime : $CONFIG_PATH"
fi

echo ''
echo '========== RESET TERMINE =========='
echo ''
echo 'Recommencer dans l ordre :'
echo "  cd $REPO_ROOT"
echo '  ./scripts/1-etape-preparer-fichiers.sh'
echo '  ./scripts/2-etape-infra-vps.sh'
echo '  ./scripts/3-etape-apps-vps.sh'
echo ''
