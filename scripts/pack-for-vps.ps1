# Raccourci → deploy/gsms/pack.ps1 (source de vérité packaging VPS)
param(
  [switch]$Scp,
  [switch]$Extract,
  [switch]$Deploy,
  [string]$Output = ''
)

$pack = Join-Path $PSScriptRoot '..\deploy\gsms\pack.ps1'
if (-not (Test-Path $pack)) {
  throw "pack.ps1 introuvable : $pack"
}

$params = @{}
if ($Scp) { $params['Scp'] = $true }
if ($Extract) { $params['Extract'] = $true }
if ($Deploy) { $params['Deploy'] = $true }
if ($Output) { $params['Output'] = $Output }

& $pack @params
