# Deploy interactif GSMS -> VPS (ASCII only — compatible Windows PowerShell 5.1)
param(
  [switch]$NonInteractive
)

$ErrorActionPreference = 'Stop'
$GsmsDeployRoot = $PSScriptRoot
$RepoRoot = (Resolve-Path (Join-Path $GsmsDeployRoot '..\..')).Path
$ConfigPath = Join-Path $GsmsDeployRoot 'config\deploy.local.json'
$EnvLocalPath = Join-Path $GsmsDeployRoot '.env'
$EnvExamplePath = Join-Path $GsmsDeployRoot '.env.example'

. (Join-Path $GsmsDeployRoot 'lib\ui.ps1')
. (Join-Path $GsmsDeployRoot 'lib\env.ps1')

function Load-Config {
  if (Test-Path $ConfigPath) {
    return Get-Content $ConfigPath -Raw | ConvertFrom-Json
  }
  return $null
}

function Save-Config([hashtable]$Cfg) {
  $dir = Split-Path $ConfigPath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $Cfg | ConvertTo-Json -Depth 4 | Set-Content $ConfigPath -Encoding UTF8
  Write-Ok ('Config sauvegardee: {0}' -f $ConfigPath)
}

function Test-Prerequisites {
  Write-Step 'Verification des outils'
  foreach ($cmd in @('ssh', 'scp', 'tar')) {
    if (-not (Test-CommandExists $cmd)) {
      throw ('Commande manquante: {0} (installer OpenSSH + tar Windows)' -f $cmd)
    }
  }
  Write-Ok 'ssh, scp, tar disponibles'
}

function Read-DeployConfig {
  $saved = Load-Config
  $defaults = @{
    SshHost       = '187.77.166.124'
    SshUser       = 'root'
    SshKey        = Join-Path $env:USERPROFILE '.ssh\id_ed25519'
    AppRoot       = '/opt/gsms-school'
    GsmsDir       = '/opt/gsms'
    RemoteArchive = '/tmp/gsms-school.tar.gz'
    Domain        = 'hosting-global-it-ss.com'
    ServerIp      = '187.77.166.124'
    RebuildWorker = $true
    SkipDbInit    = $false
    ResetDb       = $false
  }

  if ($saved) {
    Write-Warn ('Config trouvee: {0}' -f $ConfigPath)
    if (Read-YesNo 'Charger ces valeurs par defaut ?' $true) {
      foreach ($prop in $saved.PSObject.Properties) {
        $defaults[$prop.Name] = $prop.Value
      }
    }
  }

  if ($NonInteractive) { return $defaults }

  Write-Title 'Connexion VPS'
  $defaults.SshHost = Read-InputDefault 'IP ou hostname du VPS' $defaults.SshHost
  $defaults.SshUser = Read-InputDefault 'Utilisateur SSH' $defaults.SshUser
  $defaults.SshKey = Read-InputDefault 'Chemin cle SSH privee' $defaults.SshKey
  $defaults.AppRoot = Read-InputDefault 'Dossier code sur le VPS' $defaults.AppRoot
  $defaults.GsmsDir = Read-InputDefault 'Dossier stack Docker (.env)' $defaults.GsmsDir
  $defaults.ServerIp = Read-InputDefault 'IP publique du serveur' $defaults.ServerIp

  if (-not (Test-Path $defaults.SshKey)) {
    Write-Warn ('Cle SSH introuvable: {0}' -f $defaults.SshKey)
    if (-not (Read-YesNo 'Continuer quand meme ?' $false)) { throw 'Cle SSH requise.' }
  }

  return $defaults
}

function Ensure-EnvFile {
  if (Test-Path $EnvLocalPath) {
    $pg = Read-EnvValue $EnvLocalPath 'POSTGRES_PASSWORD'
    if ($pg -and $pg -ne 'change_me') {
      Write-Ok ('.env local trouve: {0}' -f $EnvLocalPath)
      if (Read-YesNo 'Garder ce .env tel quel ?' $true) {
        return $EnvLocalPath
      }
    } else {
      Write-Warn '.env local incomplet (change_me detecte)'
    }
  }

  $choice = Read-Choice 'Fichier .env production :' @(
    'Assistant guide (questions secrets + domaine)',
    'Ouvrir .env.example dans Notepad puis continuer',
    'Chemin vers un .env existant'
  ) 1

  switch ($choice) {
    1 { return Invoke-EnvWizard -ExamplePath $EnvExamplePath -OutputPath $EnvLocalPath }
    2 {
      if (-not (Test-Path $EnvLocalPath)) { Copy-Item $EnvExamplePath $EnvLocalPath }
      notepad $EnvLocalPath
      Read-Host 'Appuyez sur Entree quand le .env est pret'
      return $EnvLocalPath
    }
    3 {
      $custom = Read-InputDefault 'Chemin du fichier .env' $EnvLocalPath
      if (-not (Test-Path $custom)) { throw ('Fichier introuvable: {0}' -f $custom) }
      return $custom
    }
  }
}

function Invoke-PackArchive {
  param([string]$Output = '')
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  if (-not $Output) { $Output = Join-Path $RepoRoot ('gsms-school-{0}.tar.gz' -f $stamp) }
  $ignore = Join-Path $RepoRoot '.deploy-scp.ignore'
  if (-not (Test-Path $ignore)) { throw ('Exclusions introuvables: {0}' -f $ignore) }

  Write-Step ('Archive: {0}' -f $Output)
  Push-Location $RepoRoot
  try {
    if (Test-Path $Output) { Remove-Item $Output -Force }
    & tar -czf $Output --exclude-from=.deploy-scp.ignore .
    if ($LASTEXITCODE -ne 0) { throw ('tar a echoue (code {0})' -f $LASTEXITCODE) }
    $sizeMb = [math]::Round((Get-Item $Output).Length / 1MB, 2)
    Write-Ok ('{0} Mo' -f $sizeMb)
    return $Output
  } finally {
    Pop-Location
  }
}

function Send-EnvFile {
  param([hashtable]$Cfg, [string]$EnvPath)
  Write-Step ('Envoi .env -> {0}/.env' -f $Cfg.GsmsDir)
  Invoke-Ssh $Cfg ('mkdir -p {0}' -f $Cfg.GsmsDir)
  Invoke-Scp $Cfg $EnvPath ('{0}/.env' -f $Cfg.GsmsDir)
  Invoke-Ssh $Cfg ('chmod 600 {0}/.env' -f $Cfg.GsmsDir)
  Write-Ok 'Secrets envoyes'
}

function Send-CodeArchive {
  param([hashtable]$Cfg, [string]$ArchivePath)
  Write-Step ('Envoi code -> {0}' -f $Cfg.RemoteArchive)
  Invoke-Scp $Cfg $ArchivePath $Cfg.RemoteArchive

  $appRoot = $Cfg.AppRoot
  $remoteArchive = $Cfg.RemoteArchive
  $remote = @(
    'set -e'
    ('mkdir -p {0}' -f $appRoot)
    ('tar -xzf {0} -C {1}' -f $remoteArchive, $appRoot)
    ('rm -f {0}' -f $remoteArchive)
    ('find {0}/deploy/gsms -name ''*.sh'' -exec sed -i ''s/\r$//'' {{}} + 2>/dev/null || true' -f $appRoot)
    ('chmod +x {0}/deploy/gsms/*.sh 2>/dev/null || true' -f $appRoot)
    'echo OK extracted'
  ) -join '; '
  Invoke-Ssh $Cfg $remote
  Write-Ok 'Code deploye sur le VPS'
}

function Invoke-RemoteDeploy {
  param([hashtable]$Cfg)
  $flags = @('SKIP_GIT=1')
  if ($Cfg.RebuildWorker) { $flags += 'REBUILD_WORKER=1' }
  if ($Cfg.SkipDbInit) { $flags += 'SKIP_DB_INIT=1' }
  if ($Cfg.ResetDb) { $flags += 'RESET_DB=1' }
  $envPrefix = $flags -join ' '
  $script = '{0}/deploy/gsms/deploy.sh' -f $Cfg.AppRoot
  Write-Step 'Build Docker + demarrage stack (plusieurs minutes)...'
  Write-Warn 'Ne fermez pas cette fenetre.'
  Invoke-Ssh $Cfg ('{0} bash {1}' -f $envPrefix, $script)
  Write-Ok 'deploy.sh termine'
}

function Invoke-RemoteInstall {
  param([hashtable]$Cfg)
  $script = '{0}/deploy/gsms/install.sh' -f $Cfg.AppRoot
  Write-Step 'install.sh (premiere install)'
  Invoke-Ssh $Cfg ('SKIP_GIT=1 bash {0}' -f $script)
}

function Invoke-RemoteVerify {
  param([hashtable]$Cfg)
  Write-Step 'Verification post-deploy'
  $verify = '{0}/verify.sh' -f $Cfg.GsmsDir
  $fallback = '{0}/deploy/gsms/verify.sh' -f $Cfg.AppRoot
  try {
    Invoke-Ssh $Cfg ('bash {0} 2>/dev/null || bash {1}' -f $verify, $fallback)
  } catch {
    Write-Warn 'Verify a signale un probleme (deploiement peut etre OK) — voir logs gsms-app'
  }
}

function Show-Summary {
  param([hashtable]$Cfg, [string]$EnvPath)
  $domain = Read-EnvValue $EnvPath 'DOMAIN'
  if (-not $domain) { $domain = $Cfg.Domain }
  $monitoring = Read-EnvValue $EnvPath 'MONITORING_HOST'
  if (-not $monitoring) { $monitoring = 'monitoring.{0}' -f $domain }
  Write-Title 'Deploiement termine'
  Write-Host ('  App        : https://{0}' -f $domain)
  Write-Host ('  Connexion  : https://{0}/signin' -f $domain)
  Write-Host ('  Monitoring : https://{0}' -f $monitoring)
  Write-Host ''
}

Write-Title 'Deploiement GSMS -> VPS'
Test-Prerequisites

$cfg = Read-DeployConfig
$envFile = Ensure-EnvFile

if (-not $NonInteractive) {
  Write-Title 'Options de deploiement'
  $action = Read-Choice 'Que voulez-vous faire ?' @(
    'Deploiement COMPLET (env + code + build Docker + verify)',
    'Envoyer seulement le .env',
    'Envoyer seulement le code (archive)',
    'Lancer deploy.sh sur le VPS (code deja present)',
    'Verification seule (verify.sh)',
    'Premiere installation (install.sh + reset DB)'
  ) 1

  if ($action -in 1, 3, 4, 6) {
    $cfg.RebuildWorker = Read-YesNo 'Rebuild image worker Playwright ?' $true
    $cfg.SkipDbInit = Read-YesNo 'Ignorer migrate/seed (SKIP_DB_INIT) ?' $false
    if ($action -eq 6) {
      $cfg.ResetDb = $true
      Write-Warn 'RESET_DB=1 - la base PostgreSQL sera recreee.'
      if (-not (Read-YesNo 'Confirmer la reinitialisation DB ?' $false)) {
        $cfg.ResetDb = $false
      }
    } else {
      $cfg.ResetDb = Read-YesNo 'Reinitialiser la base (RESET_DB destructif) ?' $false
    }
  }

  if (Read-YesNo 'Sauvegarder la config pour les prochains deploiements ?' $true) {
    Save-Config $cfg
  }

  if (-not (Read-YesNo 'Lancer maintenant ?' $true)) {
    Write-Warn 'Annule.'
    exit 0
  }
} else {
  $action = 1
}

switch ($action) {
  1 {
    Send-EnvFile $cfg $envFile
    $archive = Invoke-PackArchive
    Send-CodeArchive $cfg $archive
    Invoke-RemoteDeploy $cfg
    Invoke-RemoteVerify $cfg
    Show-Summary $cfg $envFile
  }
  2 { Send-EnvFile $cfg $envFile }
  3 {
    $archive = Invoke-PackArchive
    Send-CodeArchive $cfg $archive
  }
  4 {
    Invoke-RemoteDeploy $cfg
    Invoke-RemoteVerify $cfg
    Show-Summary $cfg $envFile
  }
  5 { Invoke-RemoteVerify $cfg }
  6 {
    Send-EnvFile $cfg $envFile
    $archive = Invoke-PackArchive
    Send-CodeArchive $cfg $archive
    $cfg.ResetDb = $true
    $cfg.RebuildWorker = $true
    Invoke-RemoteInstall $cfg
    Invoke-RemoteVerify $cfg
    Show-Summary $cfg $envFile
  }
}

Write-Ok 'Termine.'
