# Archive tar.gz — préférer deploy.ps1 (interactif)
# Usage direct :#   .\deploy\gsms\pack.ps1
#   .\deploy\gsms\pack.ps1 -Scp
#   .\deploy\gsms\pack.ps1 -Scp -Extract
#   .\deploy\gsms\pack.ps1 -Scp -Extract -Deploy   # pack + extract + deploy.sh
param(
  [switch]$Scp,
  [switch]$Extract,
  [switch]$Deploy,
  [string]$Output = '',
  [string]$SshHost = '187.77.166.124',
  [string]$SshUser = 'root',
  [string]$SshKey = "$env:USERPROFILE\.ssh\id_ed25519",
  [string]$AppRoot = '/opt/gsms-school',
  [string]$GsmsDir = '/opt/gsms',
  [string]$RemoteArchive = '/tmp/gsms-school.tar.gz'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$IgnoreFile = Join-Path $RepoRoot '.deploy-scp.ignore'

if (-not (Test-Path $IgnoreFile)) {
  throw "Exclusions introuvables : $IgnoreFile"
}

if (-not $Output) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $Output = Join-Path $RepoRoot "gsms-school-$stamp.tar.gz"
} else {
  $Output = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Output)
}

Write-Host ">> Archive : $Output" -ForegroundColor Cyan

Push-Location $RepoRoot
try {
  if (Test-Path $Output) { Remove-Item $Output -Force }
  & tar -czf $Output --exclude-from=.deploy-scp.ignore .
  if ($LASTEXITCODE -ne 0) { throw "tar a échoué (code $LASTEXITCODE)" }
  $sizeMb = [math]::Round((Get-Item $Output).Length / 1MB, 2)
  Write-Host "OK — $sizeMb Mo" -ForegroundColor Green
} finally {
  Pop-Location
}

if (-not $Scp) {
  Write-Host ''
  Write-Host 'Étapes manuelles :' -ForegroundColor Yellow
  Write-Host "  scp -i `"$SshKey`" `"$Output`" ${SshUser}@${SshHost}:${RemoteArchive}"
  Write-Host "  scp -i `"$SshKey`" deploy/gsms/.env ${SshUser}@${SshHost}:${GsmsDir}/.env"
  Write-Host "  ssh -i `"$SshKey`" ${SshUser}@${SshHost} `"mkdir -p $AppRoot && tar -xzf $RemoteArchive -C $AppRoot`""
  Write-Host "  ssh -i `"$SshKey`" ${SshUser}@${SshHost} `"SKIP_GIT=1 REBUILD_WORKER=1 bash $AppRoot/deploy/gsms/deploy.sh`""
  exit 0
}

$sshTarget = "${SshUser}@${SshHost}"
$sshArgs = @('-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
if ($SshKey -and (Test-Path $SshKey)) { $sshArgs += @('-i', $SshKey) }

Write-Host ">> SCP archive → $sshTarget`:$RemoteArchive" -ForegroundColor Yellow
& scp @sshArgs $Output "${sshTarget}:${RemoteArchive}"

if ($Extract) {
  $remote = @(
    'set -e'
    "mkdir -p $AppRoot"
    "tar -xzf $RemoteArchive -C $AppRoot"
    "rm -f $RemoteArchive"
    "find $AppRoot/deploy/gsms -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true"
    "chmod +x $AppRoot/deploy/gsms/*.sh 2>/dev/null || true"
    "echo OK extracted to $AppRoot"
  ) -join '; '
  & ssh @sshArgs $sshTarget $remote
  Write-Host "OK — extrait dans $AppRoot" -ForegroundColor Green
}

if ($Deploy) {
  if (-not $Extract) {
    throw '-Deploy nécessite -Extract'
  }
  Write-Host '>> deploy.sh sur le VPS ...' -ForegroundColor Yellow
  $deployCmd = "SKIP_GIT=1 REBUILD_WORKER=1 bash $AppRoot/deploy/gsms/deploy.sh"
  & ssh @sshArgs $sshTarget $deployCmd
  Write-Host 'OK — déploiement lancé' -ForegroundColor Green
}

if (-not $Extract) {
  Write-Host "Archive sur le VPS : $RemoteArchive" -ForegroundColor Green
}
