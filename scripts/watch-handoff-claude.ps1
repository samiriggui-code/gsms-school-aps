# Watch HANDOFF-CLAUDE.md and wake Cursor Agent (local session only).
# Usage (from repo root, Windows PowerShell 5.1+):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/watch-handoff-claude.ps1
# Pair with agent notify_on_output on: ^AGENT_LOOP_WAKE_handoff_claude
#
# This is NOT a Cursor product feature — it only works while this process
# runs inside a monitored agent shell for the current chat session.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$path = Join-Path $root 'docs\HANDOFF-CLAUDE.md'
$dir = Split-Path -Parent $path
$file = Split-Path -Leaf $path

if (-not (Test-Path -LiteralPath $path)) {
  New-Item -ItemType File -Path $path -Force | Out-Null
}

Write-Host "[handoff-watch] watching $path"
$lastWrite = (Get-Item -LiteralPath $path).LastWriteTimeUtc

$watcher = New-Object System.IO.FileSystemWatcher $dir, $file
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite
$watcher.EnableRaisingEvents = $true

while ($true) {
  $changed = $watcher.WaitForChanged([System.IO.WatcherChangeTypes]::Changed, 5000)
  if (-not $changed.TimedOut) {
    Start-Sleep -Milliseconds 200
    $current = (Get-Item -LiteralPath $path).LastWriteTimeUtc
    if ($current -gt $lastWrite) {
      $lastWrite = $current
      $payload = @{
        prompt = 'docs/HANDOFF-CLAUDE.md changed. Read it, treat any entry without ✅ traité, mark treated, continue current chantier if any.'
        file = 'docs/HANDOFF-CLAUDE.md'
        at = (Get-Date).ToString('o')
      } | ConvertTo-Json -Compress
      Write-Output "AGENT_LOOP_WAKE_handoff_claude $payload"
    }
  }
}
