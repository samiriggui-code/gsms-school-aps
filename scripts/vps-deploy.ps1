# Deploy rapide : tar app (standalone only) + scp + rebuild image runtime sur VPS
param(
  [switch]$NoCache,
  [switch]$SkipSync,
  [switch]$ResetDb,
  [switch]$RebuildWorker
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$standalone = Join-Path $RepoRoot 'apps\lms-crm\.next\standalone\apps\lms-crm\server.js'
if (-not (Test-Path $standalone)) {
  Write-Host '>> pnpm build...' -ForegroundColor Yellow
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
$sshArgs = @('-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'Compression=yes')
if ($cfg.SshKey -and (Test-Path $cfg.SshKey)) { $sshArgs += @('-i', $cfg.SshKey) }

Write-Host '========== DEPLOY APP (tar + scp) ==========' -ForegroundColor Cyan

if (-not $SkipSync) {
  Write-Host '>> tar standalone (~10-30 Mo)...' -ForegroundColor Yellow
  $tar = Join-Path $env:TEMP ("gsms-app-{0}.tar.gz" -f (Get-Date -Format 'HHmmss'))
  & tar -czf $tar -C $RepoRoot `
    apps/lms-crm/.next/standalone `
    apps/lms-crm/.next/static `
    apps/lms-crm/public `
    deploy/gsms/Dockerfile.app `
    .dockerignore
  $mb = [math]::Round((Get-Item $tar).Length / 1MB, 1)
  Write-Host ">> scp $mb MB..." -ForegroundColor Yellow
  & scp @sshArgs $tar ('{0}:/tmp/gsms-app.tar.gz' -f $sshTarget)
  Remove-Item $tar -Force

  Write-Host '>> scp config...' -ForegroundColor Yellow
  & scp @sshArgs `
    (Join-Path $RepoRoot 'deploy\gsms\docker-compose.yml') `
    (Join-Path $RepoRoot 'deploy\gsms\.env') `
    (Join-Path $RepoRoot 'deploy\gsms\deploy.sh') `
    (Join-Path $RepoRoot 'deploy\gsms\db-init.sh') `
    ('{0}:{1}/' -f $sshTarget, $gsmsDir)
  & scp @sshArgs -r `
    (Join-Path $RepoRoot 'deploy\gsms\traefik') `
    (Join-Path $RepoRoot 'deploy\gsms\homepage') `
    ('{0}:{1}/' -f $sshTarget, $gsmsDir)

  $extract = "set -e; mkdir -p $appRoot/apps/lms-crm/.next $appRoot/deploy/gsms; tar -xzf /tmp/gsms-app.tar.gz -C $appRoot; rm -f /tmp/gsms-app.tar.gz; sed -i 's/\r$//' $gsmsDir/deploy.sh $gsmsDir/db-init.sh; chmod +x $gsmsDir/deploy.sh $gsmsDir/db-init.sh"
  & ssh @sshArgs $sshTarget $extract
}

$remote = "export APP_ROOT=$appRoot; export GSMS_DIR=$gsmsDir; export REBUILD_WORKER=0; export SKIP_DB_INIT=1"
if ($ResetDb) { $remote += '; export RESET_DB=1; export SKIP_DB_INIT=0' }
if ($RebuildWorker) { $remote += '; export REBUILD_WORKER=1' }
if ($NoCache) { $remote += '; export DOCKER_BUILD_NO_CACHE=1' }
$remote += "; bash $gsmsDir/deploy.sh"
& ssh @sshArgs $sshTarget $remote
if ($LASTEXITCODE -ne 0) { throw "deploy.sh a echoue (exit $LASTEXITCODE)" }

Write-Host ''
Write-Host 'OK' -ForegroundColor Green
Write-Host "  https://$($cfg.Domain)"
