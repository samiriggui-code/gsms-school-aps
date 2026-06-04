# =============================================================================
# ETAPE 3 / 3 — Applications (CRM, landing, docs) sur le VPS
# =============================================================================
# Prerequis : etapes 1 et 2 terminees (/opt/gsms/.env sur le NUC)
#
#   cd c:\laragon\www\app-prisma
#   .\scripts\3-etape-apps-vps.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$configPath = Join-Path $PSScriptRoot 'deploy.config.json'
$stagingEnv = Join-Path $PSScriptRoot '.deploy-staging\.env'

if (-not (Test-Path $configPath)) {
  Write-Host ''
  Write-Host 'ERREUR : deploy.config.json introuvable.' -ForegroundColor Red
  Write-Host '  Etape 1 : .\scripts\1-etape-preparer-fichiers.ps1' -ForegroundColor Yellow
  Write-Host '  Etape 2 : .\scripts\2-etape-infra-vps.ps1' -ForegroundColor Yellow
  Write-Host ''
  exit 1
}

if (-not (Test-Path $stagingEnv)) {
  Write-Host ''
  Write-Host 'AVERTISSEMENT : scripts\.deploy-staging\.env absent sur ce PC.' -ForegroundColor Yellow
  Write-Host '  OK si l infra est deja sur le VPS (/opt/gsms/.env).' -ForegroundColor DarkGray
  Write-Host '  Sinon : relancez l etape 1 puis 2.' -ForegroundColor DarkGray
  Write-Host ''
}

Write-Host ''
Write-Host '========== ETAPE 3 / 3 : APPS (CRM + landing) ==========' -ForegroundColor Cyan
Write-Host "  Dossier projet : $RepoRoot"
Write-Host ''

& (Join-Path $PSScriptRoot 'deploy\deploy-lms.ps1') -AppsOnly @args
