# Wrapper pour l'UI lms-deploy : redirige Write-Host vers stdout sans casser param() des scripts.
param(
  [Parameter(Mandatory = $true)]
  [string]$ScriptPath,
  [switch]$AutoConfirm
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::UTF8

function Write-Host {
  [CmdletBinding()]
  param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $false)]
    [AllowEmptyString()]
    [object]$Object,
    [System.ConsoleColor]$ForegroundColor,
    [switch]$NoNewline
  )

  $text = if ($null -eq $Object) { '' } else { "$Object" }

  if ($PSBoundParameters.ContainsKey('ForegroundColor')) {
    Microsoft.PowerShell.Utility\Write-Host -Object $text -ForegroundColor $ForegroundColor -NoNewline:$NoNewline
    return
  }

  if ($NoNewline) {
    [Console]::Out.Write($text)
  }
  elseif ([string]::IsNullOrEmpty($text)) {
    [Console]::Out.WriteLine()
  }
  else {
    [Console]::Out.WriteLine($text)
  }
}

if (-not (Test-Path -LiteralPath $ScriptPath)) {
  [Console]::Error.WriteLine("Script introuvable : $ScriptPath")
  exit 1
}

if ($AutoConfirm) {
  $env:LMS_DEPLOY_UI_CONFIRM = '1'
  [Console]::Out.WriteLine('[UI] Confirmation interface - invites O/N ignorees')
  [Console]::Out.Flush()
}

$invokeArgs = @()
if ($AutoConfirm -and $ScriptPath -match '0-reset-tout\.ps1$') {
  $invokeArgs += '-Force'
}

& $ScriptPath @invokeArgs *>&1 | ForEach-Object {
  $line = if ($_ -is [System.Management.Automation.ErrorRecord]) {
    $_.ToString()
  }
  elseif ($null -ne $_) {
    "$_"
  }
  else {
    $null
  }
  if ($null -ne $line -and $line -ne '') {
    [Console]::Out.WriteLine($line)
    [Console]::Out.Flush()
  }
}

exit $LASTEXITCODE
