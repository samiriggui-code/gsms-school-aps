# Affiche le guide de deploiement (aucune modification sur le VPS)
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$readme = Join-Path $PSScriptRoot 'README.md'

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  DEPLOIEMENT LMS - 3 ETAPES' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host ('Projet : ' + $RepoRoot)
Write-Host ('Detail : ' + $readme)
Write-Host ''
Write-Host '  cd c:\laragon\www\app-prisma' -ForegroundColor Green
Write-Host '  .\scripts\0-reset-tout.ps1              # repartir de zero' -ForegroundColor DarkGray
Write-Host '  .\scripts\1-etape-preparer-fichiers.ps1 # PC : .env, secrets' -ForegroundColor Green
Write-Host '  .\scripts\2-etape-infra-vps.ps1         # VPS : Docker, Postgres' -ForegroundColor Green
Write-Host '  .\scripts\3-etape-apps-vps.ps1          # VPS : CRM, landing' -ForegroundColor Green
Write-Host '  .\scripts\4-etape-rebuild-images.ps1    # VPS : rebuild Docker (apres correctifs)' -ForegroundColor DarkGray
Write-Host ''
Write-Host ('Detail : ' + (Join-Path $PSScriptRoot 'DEPLOIEMENT.md')) -ForegroundColor DarkGray
Write-Host ''

$config = Join-Path $PSScriptRoot 'deploy.config.json'
$staging = Join-Path $PSScriptRoot '.deploy-staging\.env'
if (Test-Path $staging) {
  Write-Host 'Etat : .deploy-staging OK - vous pouvez lancer etape 2' -ForegroundColor Green
} else {
  Write-Host 'Etat : commencez par etape 1 (preparer-fichiers)' -ForegroundColor Yellow
}
if (Test-Path $config) {
  Write-Host 'Etat : deploy.config.json present' -ForegroundColor Green
}
Write-Host ''
