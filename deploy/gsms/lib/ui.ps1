# Helpers prompts / affichage (ASCII - PowerShell 5.1)
function Write-Title([string]$Text) {
  Write-Host ''
  Write-Host ('=' * 60) -ForegroundColor Cyan
  Write-Host (' {0}' -f $Text) -ForegroundColor Cyan
  Write-Host ('=' * 60) -ForegroundColor Cyan
  Write-Host ''
}

function Write-Step([string]$Text) {
  Write-Host ('>> {0}' -f $Text) -ForegroundColor Yellow
}

function Write-Ok([string]$Text) {
  Write-Host ('OK - {0}' -f $Text) -ForegroundColor Green
}

function Write-Warn([string]$Text) {
  Write-Host ('!! {0}' -f $Text) -ForegroundColor DarkYellow
}

function Read-InputDefault {
  param(
    [string]$Label,
    [string]$Default = ''
  )
  if ($Default) {
    $raw = Read-Host ('{0} [{1}]' -f $Label, $Default)
  } else {
    $raw = Read-Host $Label
  }
  if ([string]::IsNullOrWhiteSpace($raw)) { return $Default }
  return $raw.Trim()
}

function Read-YesNo {
  param(
    [string]$Label,
    [bool]$Default = $true
  )
  $hint = if ($Default) { 'O/n' } else { 'o/N' }
  $raw = Read-Host ('{0} ({1})' -f $Label, $hint)
  if ([string]::IsNullOrWhiteSpace($raw)) { return $Default }
  return $raw -match '^[oOyY1]'
}

function Read-Choice {
  param(
    [string]$Label,
    [string[]]$Options,
    [int]$Default = 1
  )
  Write-Host $Label
  for ($i = 0; $i -lt $Options.Length; $i++) {
    $n = $i + 1
    if ($n -eq $Default) {
      Write-Host ('  [{0}] {1} (defaut)' -f $n, $Options[$i])
    } else {
      Write-Host ('  [{0}] {1}' -f $n, $Options[$i])
    }
  }
  $raw = Read-Host 'Choix'
  if ([string]::IsNullOrWhiteSpace($raw)) { return $Default }
  $num = 0
  if ([int]::TryParse($raw, [ref]$num) -and $num -ge 1 -and $num -le $Options.Length) {
    return $num
  }
  Write-Warn 'Choix invalide - defaut applique.'
  return $Default
}

function Test-CommandExists([string]$Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-SshArgs([hashtable]$Cfg) {
  $sshArgs = @('-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new')
  if ($Cfg.SshKey -and (Test-Path $Cfg.SshKey)) {
    $sshArgs += @('-i', $Cfg.SshKey)
  }
  return $sshArgs
}

function Invoke-Ssh {
  param([hashtable]$Cfg, [string]$Command)
  $target = '{0}@{1}' -f $Cfg.SshUser, $Cfg.SshHost
  $sshArgs = Get-SshArgs $Cfg
  & ssh @sshArgs $target $Command
  if ($LASTEXITCODE -ne 0) { throw ('SSH a echoue (code {0})' -f $LASTEXITCODE) }
}

function Invoke-Scp {
  param([hashtable]$Cfg, [string]$Local, [string]$Remote)
  $target = '{0}@{1}' -f $Cfg.SshUser, $Cfg.SshHost
  $sshArgs = Get-SshArgs $Cfg
  $dest = '{0}:{1}' -f $target, $Remote
  & scp @sshArgs $Local $dest
  if ($LASTEXITCODE -ne 0) { throw ('SCP a echoue (code {0})' -f $LASTEXITCODE) }
}
