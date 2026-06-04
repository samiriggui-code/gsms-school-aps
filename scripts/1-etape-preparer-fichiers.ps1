# =============================================================================
# ETAPE 1 / 3 — Preparation des fichiers (sur votre PC uniquement)
# =============================================================================
# Questions : domaine, SMTP, VPS, HTTPS...
# Genere     : scripts\.deploy-staging\  (.env, SECRETS.txt, Caddyfile, compose)
#              scripts\deploy.config.json
# Aucune connexion SSH a cette etape.
#
#   cd c:\laragon\www\app-prisma
#   .\scripts\1-etape-preparer-fichiers.ps1
#
# Ensuite : .\scripts\2-etape-infra-vps.ps1
# Guide    : .\scripts\DEPLOIEMENT.md
# =============================================================================

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

Write-Host ''
Write-Host '========== ETAPE 1 / 3 : PREPARER LES FICHIERS (PC) ==========' -ForegroundColor Cyan
Write-Host "  Dossier projet : $RepoRoot"
Write-Host '  Sortie         : scripts\.deploy-staging\'
Write-Host '  Pas de SSH     : rien n est envoye au VPS pour l instant'
Write-Host ''
Write-Host '  Etape suivante apres validation : .\scripts\2-etape-infra-vps.ps1'
Write-Host ''

& (Join-Path $PSScriptRoot 'deploy\deploy-lms.ps1') -PrepareOnly @args
