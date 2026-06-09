# Redeploiement VPS - config scripts/deploy.config.json (hosting-global-it-ss.com)
# Usage : .\scripts\redeploy-vps-complet.ps1
$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$configPath = Join-Path $PSScriptRoot 'deploy.config.json'
if (-not (Test-Path $configPath)) {
  throw "Manquant: $configPath"
}

$cfg = Get-Content $configPath -Raw | ConvertFrom-Json
$sshHost = [string]$cfg.SshHost
$sshUser = if ($cfg.SshUser) { [string]$cfg.SshUser } else { 'root' }
$sshKey = if ($cfg.SshKey) { [string]$cfg.SshKey } else { Join-Path $env:USERPROFILE '.ssh\id_ed25519' }
$domain = [string]$cfg.Domain
$smtpUser = [string]$cfg.SmtpUser
$smtpHostName = [string]$cfg.SmtpHost
$crmHost = [string]$cfg.CrmHost

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  REDEPLOIEMENT VPS GSMS / LMS' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ('  IP      : ' + $sshHost)
Write-Host ('  Domaine : ' + $domain)
Write-Host ('  CRM     : ' + $crmHost)
Write-Host ('  SMTP    : ' + $smtpUser + ' sur ' + $smtpHostName)
Write-Host '  Code    : /opt/gsms-school'
Write-Host '  Stack   : /opt/gsms (sans Traefik GSMS, hPanel)'
Write-Host ''

Write-Host '--- Etape 0 : verification VPS ---' -ForegroundColor Yellow
$sshTarget = ($sshUser + '@' + $sshHost)
$check = 'echo monorepo_opt=; test -d /opt/gsms-school/packages/database && echo yes || echo no; ' +
  'echo monorepo_root=; test -d /root/gsms-school/packages/database && echo yes || echo no; ' +
  'echo gsms_stack=; test -f /opt/gsms/.env && echo yes || echo no; ' +
  'docker ps --format "{{.Names}}" | grep gsms || true'
& ssh -i $sshKey -o StrictHostKeyChecking=accept-new $sshTarget $check

Write-Host ''
Write-Host '--- Mot de passe SMTP ---' -ForegroundColor Yellow
$sec = Read-Host ('Mot de passe boite ' + $smtpUser) -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
try { $smtpPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
$env:DEPLOY_SMTP_PASS = $smtpPlain

Write-Host ''
Write-Host '--- Etape 1 : preparation fichiers (.env, compose) ---' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'deploy\deploy-lms.ps1') -PrepareOnly -UseDeployConfig

Write-Host ''
Write-Host '--- Etape 1b : monorepo -> /opt/gsms-school sur VPS ---' -ForegroundColor Cyan
$fixMono = 'set -e; ' +
  'if [ -d /root/gsms-school/packages/database ]; then mkdir -p /opt; rm -rf /opt/gsms-school; mv /root/gsms-school /opt/gsms-school; echo OK_deplace; ' +
  'elif [ -d /opt/gsms-school/packages/database ]; then echo OK_deja; ' +
  'elif [ -d /opt/app-prisma/packages/database ]; then rm -rf /opt/gsms-school; cp -a /opt/app-prisma /opt/gsms-school; echo OK_copie_app_prisma; ' +
  'else echo WARN_pas_de_monorepo; fi; ' +
  'test -d /opt/gsms-school/packages/database && echo VERIF_OK'
& ssh -i $sshKey -o StrictHostKeyChecking=accept-new $sshTarget $fixMono

Write-Host ''
Write-Host '--- Etape 2 : infra Docker (/opt/gsms) ---' -ForegroundColor Cyan
$env:LMS_DEPLOY_UI_CONFIRM = '1'
& (Join-Path $PSScriptRoot '2-etape-infra-vps.ps1')

Write-Host ''
Write-Host '--- Etape 3 : sync code PC + build apps + migrations DB ---' -ForegroundColor Cyan
Remove-Item Env:LMS_DEPLOY_SKIP_MONOREPO_SYNC -ErrorAction SilentlyContinue
$env:DEPLOY_MIGRATE = 'true'
& (Join-Path $PSScriptRoot '3-etape-apps-vps.ps1')

Write-Host ''
Write-Host '=== FIN ===' -ForegroundColor Green
Write-Host ('  Landing : https://' + $domain)
Write-Host ('  CRM     : https://' + $crmHost)
Write-Host ''
