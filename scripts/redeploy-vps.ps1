# Deploiement VPS — app unique lms-crm (pas de pnpm dev)
param(
  [switch]$NoCache,
  [switch]$SkipSync,
  [switch]$Migrate
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$standalone = Join-Path $RepoRoot 'apps\lms-crm\.next\standalone\apps\lms-crm\server.js'
if (-not (Test-Path $standalone)) {
  Write-Host '>> pnpm build (obligatoire)...' -ForegroundColor Yellow
  & pnpm build
  if (-not (Test-Path $standalone)) { throw 'Build echoue' }
}

$configPath = Join-Path $PSScriptRoot 'deploy.config.json'
if (-not (Test-Path $configPath)) {
  Copy-Item (Join-Path $PSScriptRoot 'deploy.config.json.example') $configPath
}

$cfg = Get-Content $configPath -Raw | ConvertFrom-Json
$sshTarget = '{0}@{1}' -f $cfg.SshUser, $cfg.SshHost
$appRoot = $cfg.AppRoot
$gsmsDir = $cfg.GsmsDir
$sshArgs = @('-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
if ($cfg.SshKey -and (Test-Path $cfg.SshKey)) { $sshArgs += @('-i', $cfg.SshKey) }

Write-Host '========== DEPLOY lms-crm (app unique) ==========' -ForegroundColor Cyan

if (-not $SkipSync) {
  Write-Host '>> Sync artefact build (leger)...' -ForegroundColor Yellow
  $tar = Join-Path $env:TEMP ('lms-app-{0}.tar.gz' -f (Get-Date -Format 'yyyyMMddHHmmss'))
  & tar -czf $tar `
    package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc patches `
    apps/lms-crm/.next apps/lms-crm/public `
    deploy/gsms/Dockerfile.app deploy/gsms/Dockerfile.worker `
    packages scripts/deploy
  & scp @sshArgs $tar ('{0}:/tmp/lms-app.tar.gz' -f $sshTarget)
  $extract = 'set -e; mkdir -p ' + $appRoot + '; tar -xzf /tmp/lms-app.tar.gz -C ' + $appRoot + '; rm -f /tmp/lms-app.tar.gz; find ' + $appRoot + '/scripts/deploy -name ''*.sh'' -exec sed -i ''s/\r$//'' {} +; chmod +x ' + $appRoot + '/scripts/deploy/*.sh'
  & ssh @sshArgs $sshTarget $extract
  Remove-Item $tar -Force -ErrorAction SilentlyContinue
}

& scp @sshArgs (Join-Path $RepoRoot 'deploy\gsms\.env') ('{0}:{1}/.env' -f $sshTarget, $gsmsDir)
& scp @sshArgs (Join-Path $RepoRoot 'deploy\gsms\docker-compose.yml') ('{0}:{1}/docker-compose.yml' -f $sshTarget, $gsmsDir)

$remote = 'export APP_ROOT=' + $appRoot + '; export GSMS_DIR=' + $gsmsDir + '; export REBUILD_WORKER=1'
if ($NoCache) { $remote += '; export DOCKER_BUILD_NO_CACHE=1' }
$remote += '; bash ' + $appRoot + '/scripts/deploy/deploy-monorepo-app.sh'
& ssh @sshArgs $sshTarget $remote

Write-Host 'OK — https://' -NoNewline; Write-Host $cfg.Domain -ForegroundColor Green
