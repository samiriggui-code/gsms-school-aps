# Verifie si le monorepo est deja sur le VPS (sans deploy)
$ErrorActionPreference = 'Stop'
$ScriptsRoot = $PSScriptRoot
$RepoRoot = (Resolve-Path (Join-Path $ScriptsRoot '..')).Path
$configPath = Join-Path $ScriptsRoot 'deploy.config.json'
if (-not (Test-Path $configPath)) {
  Write-Host 'ERREUR: scripts/deploy.config.json introuvable' -ForegroundColor Red
  exit 1
}
$cfg = Get-Content $configPath -Raw | ConvertFrom-Json
$sshHost = $cfg.SshHost
$sshUser = if ($cfg.SshUser) { $cfg.SshUser } else { 'root' }
$sshKey = if ($cfg.SshKey) { $cfg.SshKey } else { Join-Path $env:USERPROFILE '.ssh\id_ed25519' }
$appRoot = if ($cfg.AppRoot -and "$($cfg.AppRoot)".StartsWith('/')) { $cfg.AppRoot } else { "/opt/$($cfg.AppRoot)" }

Write-Host ''
Write-Host "=== Verification monorepo VPS ===" -ForegroundColor Cyan
Write-Host "  Cible : ${sshUser}@${sshHost}"
Write-Host "  Attendu : $appRoot/packages/database"
Write-Host ''

$remoteScript = @'
set -e
echo "--- Chemins connus ---"
for d in /opt/gsms-school /root/gsms-school /opt/app-prisma /root/app-prisma; do
  if [ -d "$d/packages/database" ]; then
    echo "TROUVE: $d"
    du -sh "$d" 2>/dev/null || true
    test -f "$d/package.json" && echo "  package.json OK"
    test -f "$d/deploy/gsms/Dockerfile.crm" && echo "  Dockerfile.crm OK"
  else
    echo "absent: $d"
  fi
done
echo ""
echo "--- Recherche schema.prisma ---"
find /opt /root -maxdepth 6 -type f -path '*/packages/database/prisma/schema.prisma' 2>/dev/null | while read -r f; do
  d="$(dirname "$(dirname "$(dirname "$f")")")"
  echo "TROUVE: $d"
done
'@

& ssh -i $sshKey -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new "${sshUser}@${sshHost}" $remoteScript
