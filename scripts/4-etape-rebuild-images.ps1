# =============================================================================
# REBUILD — Images Docker sur le VPS (après correctifs monorepo)
# =============================================================================
# Sync le code vers le VPS, rebuild crm/landing/worker, redémarre les conteneurs.
# Pas de migrations Prisma par défaut (plus rapide qu'étape 3 complète).
#
#   cd c:\laragon\www\app-prisma
#   .\scripts\4-etape-rebuild-images.ps1
#
# Options via deploy-lms.ps1 :
#   -RebuildOnly -NoCache   # rebuild sans cache Docker
# =============================================================================

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$configPath = Join-Path $PSScriptRoot 'deploy.config.json'
if (-not (Test-Path $configPath)) {
  Write-Host ''
  Write-Host 'ERREUR : deploy.config.json introuvable.' -ForegroundColor Red
  Write-Host '  Etapes 1 et 2 requises avant un rebuild.' -ForegroundColor Yellow
  Write-Host ''
  exit 1
}

$extra = @()
if ($args -contains '-NoCache') { $extra += '-NoCache' }

Write-Host ''
Write-Host '========== REBUILD IMAGES VPS (CRM / landing / worker) ==========' -ForegroundColor Cyan
Write-Host "  Dossier : $RepoRoot"
Write-Host '  Docs Mintlify : non (ajoutez -RebuildDocs dans deploy-lms si besoin)'
Write-Host ''

& (Join-Path $PSScriptRoot 'deploy\deploy-lms.ps1') -RebuildOnly @extra @args
