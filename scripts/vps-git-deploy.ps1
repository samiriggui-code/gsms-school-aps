# Deploy VPS via Git uniquement — repo gsms-school-final (PAS gsms-school)
param(
  [switch]$ResetDb,
  [switch]$SkipPush
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$configPath = Join-Path $PSScriptRoot 'deploy.config.json'
if (-not (Test-Path $configPath)) {
  Copy-Item (Join-Path $PSScriptRoot 'deploy.config.json.example') $configPath
}
$cfg = Get-Content $configPath -Raw | ConvertFrom-Json
$sshTarget = '{0}@{1}' -f $cfg.SshUser, $cfg.SshHost
$sshArgs = @('-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
if ($cfg.SshKey -and (Test-Path $cfg.SshKey)) { $sshArgs += @('-i', $cfg.SshKey) }

Write-Host '========== DEPLOY via Git (gsms-school-final) ==========' -ForegroundColor Cyan

if (-not $SkipPush) {
  Write-Host '>> git push final main...' -ForegroundColor Yellow
  git push final main
}

$remote = 'export APP_ROOT=/opt/gsms-school GSMS_DIR=/opt/gsms'
if ($ResetDb) { $remote += ' RESET_DB=1' }
$remote += '; bash /opt/gsms-school/deploy/gsms/deploy.sh 2>/dev/null || (test -f /opt/gsms/deploy.sh && bash /opt/gsms/deploy.sh) || bash /opt/gsms-school/deploy/gsms/install.sh'
& ssh @sshArgs $sshTarget $remote

Write-Host 'OK' -ForegroundColor Green
