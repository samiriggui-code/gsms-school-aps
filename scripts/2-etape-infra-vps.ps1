# =============================================================================
# ETAPE 2 / 3 — Envoi infra sur le VPS (NUC)
# =============================================================================
# Prerequis : etape 1 (scripts\.deploy-staging\.env existe)
# Fait : SSH, Docker, /opt/gsms, Postgres, Redis, Caddy, HTTPS
#
#   cd c:\laragon\www\app-prisma
#   .\scripts\2-etape-infra-vps.ps1
#
# Ensuite : .\scripts\3-etape-apps-vps.ps1
# Guide    : .\scripts\DEPLOIEMENT.md
# =============================================================================

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$stagingEnv = Join-Path $PSScriptRoot '.deploy-staging\.env'
if (-not (Test-Path $stagingEnv)) {
  Write-Host ''
  Write-Host 'ERREUR : fichiers non prepares.' -ForegroundColor Red
  Write-Host '  Lancez d abord :' -ForegroundColor Yellow
  Write-Host '    .\scripts\1-etape-preparer-fichiers.ps1'
  Write-Host ''
  exit 1
}

Write-Host ''
Write-Host '========== ETAPE 2 / 3 : ENVOI INFRA VPS ==========' -ForegroundColor Cyan
Write-Host "  Dossier projet : $RepoRoot"
Write-Host '  Source         : scripts\.deploy-staging\'
Write-Host '  Etape suivante : .\scripts\3-etape-apps-vps.ps1'
Write-Host ''

& (Join-Path $PSScriptRoot 'deploy\deploy-lms.ps1') -InfraOnly -DeployNow @args
