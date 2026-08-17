# Rebuild complet VPS Hostinger : tar (sans node_modules) + Docker app/worker + Prisma (migrate, pas de seed par défaut).
#
# Usage :
#   .\scripts\vps-rebuild-complete.ps1
#   .\scripts\vps-rebuild-complete.ps1 -WithSeed          # migrate + seed complet
#   .\scripts\vps-rebuild-complete.ps1 -SkipTar           # rebuild Docker + DB seulement (code déjà sur VPS)
#   .\scripts\vps-rebuild-complete.ps1 -DbOnly            # db-init seulement
#
param(
  [switch]$WithSeed,
  [switch]$SkipTar,
  [switch]$DbOnly,
  [switch]$SkipDeploy
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$configPath = Join-Path $PSScriptRoot 'deploy.config.json'
if (-not (Test-Path $configPath)) {
  $local = Join-Path $RepoRoot 'deploy\gsms\config\deploy.local.json'
  if (Test-Path $local) {
    $dl = Get-Content $local -Raw | ConvertFrom-Json
    @{
      SshUser  = $dl.SshUser
      SshHost  = $dl.SshHost
      SshKey   = $dl.SshKey
      AppRoot  = $dl.AppRoot
      GsmsDir  = $dl.GsmsDir
    } | ConvertTo-Json | Set-Content $configPath -Encoding UTF8
  } else {
    Copy-Item (Join-Path $PSScriptRoot 'deploy.config.json.example') $configPath
  }
}
$cfg = Get-Content $configPath -Raw | ConvertFrom-Json
$sshTarget = '{0}@{1}' -f $cfg.SshUser, $cfg.SshHost
$sshArgs = @('-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
if ($cfg.SshKey -and (Test-Path $cfg.SshKey)) { $sshArgs += @('-i', $cfg.SshKey) }

$tarName = 'gsms-school-deploy.tar.gz'
$tarPath = Join-Path $RepoRoot $tarName
$remoteTar = '/tmp/gsms-school-deploy.tar.gz'
$rebuildScript = '/tmp/vps-rebuild-complete.sh'

Write-Host '========== Rebuild complet VPS (tar + Docker + Prisma) ==========' -ForegroundColor Cyan

if (-not $SkipTar -and -not $DbOnly) {
  Write-Host ">> Archive ($tarName) avec .deploy-scp.ignore..." -ForegroundColor Yellow
  if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
  tar --exclude-from=.deploy-scp.ignore -czf $tarName .
  $sizeMb = [math]::Round((Get-Item $tarPath).Length / 1MB, 1)
  Write-Host "   Taille: ${sizeMb} Mo" -ForegroundColor DarkGray
  & scp @sshArgs $tarPath "${sshTarget}:${remoteTar}"
}

& scp @sshArgs (Join-Path $RepoRoot 'deploy\gsms\vps-rebuild-complete.sh') "${sshTarget}:${rebuildScript}"

$envFlags = @(
  'APP_ROOT=/opt/gsms-school',
  'GSMS_DIR=/opt/gsms',
  'RUN_DB_INIT=1',
  "SKIP_SEED=$(if ($WithSeed) { '0' } else { '1' })",
  'REBUILD_WORKER=1'
)
if ($SkipTar -or $DbOnly) { $envFlags += 'SKIP_TAR_EXTRACT=1' }
if ($DbOnly) { $envFlags += 'SKIP_DEPLOY=1' }
if ($SkipDeploy) { $envFlags += 'SKIP_DEPLOY=1' }

$tarArg = if ($SkipTar -or $DbOnly) { '' } else { $remoteTar }
$remoteCmd = ($envFlags -join ' ') + "; sed -i 's/\r$//' $rebuildScript; chmod +x $rebuildScript; bash $rebuildScript $tarArg"

Write-Host '>> Rebuild sur VPS...' -ForegroundColor Yellow
& ssh @sshArgs $sshTarget $remoteCmd

if (Test-Path $tarPath) { Remove-Item $tarPath -Force -ErrorAction SilentlyContinue }
Write-Host 'OK' -ForegroundColor Green
