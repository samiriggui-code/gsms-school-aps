# =============================================================================
# RESET - repartir de zero (PC + VPS)
# =============================================================================
# Usage :
#   cd c:\laragon\www\app-prisma
#   .\scripts\0-reset-tout.ps1
#   .\scripts\0-reset-tout.ps1 -Force   # apres confirmation UI lms-deploy
# =============================================================================

param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$UiConfirm = $Force -or $env:LMS_DEPLOY_UI_CONFIRM -eq '1'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$DefaultKey = Join-Path $env:USERPROFILE '.ssh\id_ed25519'
$ConfigPath = Join-Path $PSScriptRoot 'deploy.config.json'
$StagingPath = Join-Path $PSScriptRoot '.deploy-staging'

function Read-YesNo {
  param([string]$Prompt, [bool]$DefaultYes = $false)
  $hint = if ($DefaultYes) { 'O/n' } else { 'o/N' }
  $v = (Read-Host "$Prompt ($hint)").Trim().ToLower()
  if (-not $v) { return $DefaultYes }
  return $v -in @('o', 'oui', 'y', 'yes')
}

Write-Host ''
Write-Host '========== RESET DEPLOIEMENT (PC + VPS) ==========' -ForegroundColor Red
Write-Host ''
Write-Host 'Cela va SUPPRIMER :' -ForegroundColor Yellow
Write-Host '  Sur ce PC     : .deploy-staging, deploy.config.json'
Write-Host '  Sur le VPS    : /opt/gsms, /opt/app-prisma, stack Docker GSMS (conteneurs, volumes)'
Write-Host '  Donnees       : Postgres, MinIO, certificats Caddy (volumes Docker)'
Write-Host ''
Write-Host '  Docker CE     : selon reference VPS (/var/lib/gsms-cockpit/vps-baseline.json)' -ForegroundColor DarkGray
Write-Host '                  absent a la 1ere analyse -> desinstalle ; deja present -> conserve'
Write-Host ''

if ($UiConfirm) {
  Write-Host '[UI] Confirmation deja validee dans l interface deploy.' -ForegroundColor DarkGray
}
elseif (-not (Read-YesNo 'Confirmer la suppression complete' $false)) {
  Write-Host 'Annule.'
  exit 0
}

$sshHost = '192.168.1.37'
$sshUser = 'root'
$sshKey = $DefaultKey
$gsmsDir = '/opt/gsms'
$appRoot = '/opt/app-prisma'

if (Test-Path $ConfigPath) {
  $cfg = Get-Content $ConfigPath -Raw | ConvertFrom-Json
  if ($cfg.SshHost) { $sshHost = [string]$cfg.SshHost }
  if ($cfg.SshUser) { $sshUser = [string]$cfg.SshUser }
  if ($cfg.SshKey) { $sshKey = [string]$cfg.SshKey }
  if ($cfg.GsmsDir) { $gsmsDir = [string]$cfg.GsmsDir }
  if ($cfg.AppRoot) { $appRoot = [string]$cfg.AppRoot }
  Write-Host ('Config lue : ' + $sshUser + '@' + $sshHost) -ForegroundColor DarkGray
} elseif ($UiConfirm) {
  Write-Host ('[UI] Pas de deploy.config.json — cible profil hote : ' + $sshUser + '@' + $sshHost) -ForegroundColor DarkGray
} else {
  Write-Host 'Pas de deploy.config.json - valeurs par defaut (192.168.1.37).' -ForegroundColor DarkGray
  $inputHost = Read-Host ('IP du VPS [' + $sshHost + ']')
  if ($inputHost) { $sshHost = $inputHost.Trim() }
}

if ($env:LMS_DEPLOY_SSH_HOST) { $sshHost = $env:LMS_DEPLOY_SSH_HOST.Trim() }
if ($env:LMS_DEPLOY_SSH_USER) { $sshUser = $env:LMS_DEPLOY_SSH_USER.Trim() }
if ($env:LMS_DEPLOY_SSH_KEY) { $sshKey = $env:LMS_DEPLOY_SSH_KEY.Trim() }
if ($env:LMS_DEPLOY_GSMS_DIR) { $gsmsDir = $env:LMS_DEPLOY_GSMS_DIR.Trim() }
if ($env:LMS_DEPLOY_APP_ROOT) { $appRoot = $env:LMS_DEPLOY_APP_ROOT.Trim() }

$sshTarget = $sshUser + '@' + $sshHost
$sshArgs = @('-i', $sshKey, '-o', 'StrictHostKeyChecking=accept-new')
$sshStreamArgs = @('-t') + $sshArgs

Write-Host ''
Write-Host '--- Reset VPS (SSH) ---' -ForegroundColor Cyan
$deployDir = Join-Path $PSScriptRoot 'deploy'
$remoteSh = Join-Path $deployDir 'reset-deploiement-vps.sh'
$remoteLibDir = Join-Path $deployDir 'lib'
$remoteOnHost = '/tmp/reset-deploiement-vps.sh'
$remoteLibOnHost = '/tmp/lib'

$skipRemote = $false
& ssh @sshArgs $sshTarget 'echo OK' 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host ('AVERTISSEMENT: VPS inaccessible (' + $sshTarget + ') - nettoyage local seulement.') -ForegroundColor Yellow
  $skipRemote = $true
}

if (-not $skipRemote) {
  if (-not (Test-Path $remoteLibDir)) {
    Write-Host ('ERREUR: dossier lib manquant : ' + $remoteLibDir) -ForegroundColor Red
    exit 1
  }
  & ssh @sshArgs $sshTarget ('mkdir -p ' + $remoteLibOnHost)
  Get-ChildItem $remoteLibDir -File | ForEach-Object {
    & scp @sshArgs $_.FullName ($sshTarget + ':' + $remoteLibOnHost + '/' + $_.Name)
    if ($LASTEXITCODE -ne 0) {
      Write-Host ('ERREUR SCP lib : ' + $_.Name) -ForegroundColor Red
      exit 1
    }
  }
  & scp @sshArgs $remoteSh ($sshTarget + ':' + $remoteOnHost)
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'ERREUR SCP reset-deploiement-vps.sh' -ForegroundColor Red
    exit 1
  }
  $sedCr = 'sed -i ''s/\r$//'' ' + $remoteOnHost + ' ' + $remoteLibOnHost + '/*.sh 2>/dev/null; true'
  $cmd = $sedCr + '; chmod +x ' + $remoteOnHost + ' ' + $remoteLibOnHost + '/*.sh 2>/dev/null; true; export GSMS_DIR=' + $gsmsDir + ' APP_ROOT=' + $appRoot + '; bash ' + $remoteOnHost
  # ssh -t : « Connection to … closed » sur stderr = fin normale, pas une erreur script ($ErrorActionPreference Stop)
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & ssh @sshStreamArgs $sshTarget $cmd
  $sshExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($sshExit -ne 0) {
    Write-Host ('ERREUR SSH (code ' + $sshExit + '). Verifiez la sortie ci-dessus.') -ForegroundColor Red
    if ($UiConfirm) {
      Write-Host '[UI] VPS inaccessible — nettoyage local seulement.' -ForegroundColor Yellow
    }
    elseif (-not (Read-YesNo 'Continuer le nettoyage local quand meme' $true)) { exit 1 }
  } else {
    Write-Host 'VPS nettoye.' -ForegroundColor Green
  }
}

Write-Host ''
Write-Host '--- Reset PC (fichiers locaux) ---' -ForegroundColor Cyan

if (Test-Path $StagingPath) {
  Remove-Item -Recurse -Force $StagingPath
  Write-Host ('  Supprime : ' + $StagingPath)
}
if (Test-Path $ConfigPath) {
  Remove-Item -Force $ConfigPath
  Write-Host ('  Supprime : ' + $ConfigPath)
}

Write-Host ''
Write-Host '========== RESET TERMINE ==========' -ForegroundColor Green
Write-Host ''
Write-Host 'Recommencer dans l ordre :' -ForegroundColor Cyan
Write-Host ('  cd ' + $RepoRoot)
Write-Host '  .\scripts\1-etape-preparer-fichiers.ps1'
Write-Host '  .\scripts\2-etape-infra-vps.ps1'
Write-Host '  .\scripts\3-etape-apps-vps.ps1'
Write-Host ''
