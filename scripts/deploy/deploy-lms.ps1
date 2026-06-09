# Moteur de deploiement LMS (preferez les scripts numerotes ci-dessous).
#
# GUIDE RAPIDE (PowerShell, depuis la racine du projet) :
#   cd c:\laragon\www\app-prisma
#   .\scripts\0-aide-deploiement.ps1      # affiche ce guide
#   .\scripts\1-etape-preparer-fichiers.ps1  # ETAPE 1 — PC : .env, Traefik (pas de SSH)
#   .\scripts\2-etape-infra-vps.ps1        # ETAPE 2 — envoi VPS + Docker + Postgres
#   .\scripts\3-etape-apps-vps.ps1          # ETAPE 3 — CRM + landing + migrations
#
# Avance :
#   .\scripts\deploy\deploy-lms.ps1 -PrepareOnly | -InfraOnly | -AppsOnly | -RebuildOnly
#   .\scripts\4-etape-rebuild-images.ps1   # alias rebuild images (sans migrations par defaut)
#
# Important Windows : utiliser .\ au debut (pas \scripts\... seul).

param(
  [string]$ConfigFile = '',
  [switch]$PrepareOnly,
  [switch]$InfraOnly,
  [switch]$AppsOnly,
  [switch]$RebuildOnly,
  [switch]$NoCache,
  [switch]$RebuildDocs,
  [switch]$DeployNow,
  [switch]$UseDeployConfig
)

$modeCount = @($PrepareOnly, $InfraOnly, $AppsOnly, $RebuildOnly).Where({ $_ }).Count
if ($modeCount -gt 1) {
  throw 'Un seul mode : -PrepareOnly OU -InfraOnly OU -AppsOnly OU -RebuildOnly.'
}

$ErrorActionPreference = 'Stop'
$script:UiConfirm = $env:LMS_DEPLOY_UI_CONFIRM -eq '1'
$script:PtyMode = $env:LMS_DEPLOY_PTY -eq '1'
if ($script:PtyMode) {
  try {
    [Console]::InputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
  } catch { /* ignore */ }
}
if ($script:UiConfirm) {
  Write-Host '[UI] Mode non interactif - les invites O/N utilisent les valeurs par defaut (confirmation lms-deploy).' -ForegroundColor DarkGray
} elseif ($script:PtyMode) {
  Write-Host '[COCKPIT] Repondez dans le terminal du navigateur (panneau de droite), pas dans une autre fenetre PowerShell.' -ForegroundColor Cyan
}

function Read-TtyLine {
  param([string]$Prompt)
  if ($script:PtyMode) {
    if ($Prompt) { Write-Host -NoNewline "$Prompt " }
    [Console]::Out.Flush()
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { return '' }
    return $line.Trim()
  }
  if ($Prompt) { return (Read-Host $Prompt).Trim() }
  return (Read-Host).Trim()
}
$script:InfraOnly = [bool]$InfraOnly
$script:AppsOnly = [bool]$AppsOnly
$script:RebuildOnly = [bool]$RebuildOnly
$script:DockerBuildNoCache = [bool]$NoCache
$script:RebuildDocsOnVps = [bool]$RebuildDocs
$script:PrepareOnly = [bool]$PrepareOnly
$script:appsOnlyStackRepair = $false
$script:deployBootstrapInfra = $false
$ScriptsRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptsRoot '..')).Path
$StackSrc = Join-Path $RepoRoot 'deploy\gsms'
$Templates = Join-Path $StackSrc 'templates'
$Staging = Join-Path $ScriptsRoot '.deploy-staging'
$DefaultConfigPath = Join-Path $ScriptsRoot 'deploy.config.json'
$DefaultKey = Join-Path $env:USERPROFILE '.ssh\id_ed25519'

function Read-Default {
  param([string]$Prompt, [string]$Default = '')
  if ($script:UiConfirm) {
    if ($Default) {
      Write-Host ('[UI] ' + $Prompt + ' -> ' + $Default) -ForegroundColor DarkGray
      return $Default
    }
    Write-Host ('[UI] ' + $Prompt + ' -> (vide)') -ForegroundColor DarkGray
    return ''
  }
  if ($Default) {
    $v = Read-TtyLine "$Prompt [$Default]"
    if ([string]::IsNullOrWhiteSpace($v)) { return $Default }
    return $v
  }
  return Read-TtyLine $Prompt
}

function Read-Secret {
  param([string]$Prompt)
  if ($script:UiConfirm) {
    Write-Host ('[UI] ' + $Prompt + ' -> (non saisi - a completer sur le VPS si besoin)') -ForegroundColor DarkGray
    return ''
  }
  if ($script:PtyMode) {
    Write-Host '[COCKPIT] Saisie visible dans le terminal web :' -ForegroundColor Yellow
    return Read-TtyLine $Prompt
  }
  $sec = Read-Host $Prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

function Read-YesNo {
  param([string]$Prompt, [bool]$DefaultYes = $true)
  if ($script:UiConfirm) {
    $label = if ($DefaultYes) { 'oui' } else { 'non' }
    Write-Host ('[UI] ' + $Prompt + ' -> ' + $label + ' (defaut)') -ForegroundColor DarkGray
    return $DefaultYes
  }
  $hint = if ($DefaultYes) { 'O/n' } else { 'o/N' }
  $v = (Read-TtyLine "$Prompt ($hint)").Trim().ToLower()
  if (-not $v) { return $DefaultYes }
  return $v -in @('o', 'oui', 'y', 'yes')
}

function New-Secret { param([int]$Bytes = 32)
  $b = New-Object byte[] $Bytes
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  return ([BitConverter]::ToString($b) -replace '-', '').ToLower().Substring(0, 48)
}

function Escape-EnvQuoted {
  param([string]$Value)
  if ($Value -match '[\s#@"]') { return "`"$($Value -replace '"','\"')`"" }
  return $Value
}

function Normalize-AppRootPath {
  param([string]$Path)
  $p = if ($Path) { $Path.Trim() } else { '' }
  if (-not $p) { return '/opt/gsms-school' }
  if ($p -match '^[A-Za-z]:\\') { return $p }
  if ($p.StartsWith('/')) { return $p.TrimEnd('/') }
  if ($p -match '^~') { return $p }
  return '/opt/' + ($p -replace '^/+', '')
}

function Expand-TemplateFile {
  param([string]$TemplatePath, [string]$OutPath, [hashtable]$Vars)
  $text = Get-Content -LiteralPath $TemplatePath -Raw -Encoding UTF8
  foreach ($k in $Vars.Keys) {
    $text = $text.Replace("{{$k}}", [string]$Vars[$k])
  }
  $dir = Split-Path $OutPath -Parent
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [IO.File]::WriteAllText($OutPath, $text, [Text.UTF8Encoding]::new($false))
}

function Copy-StackToStaging {
  if (Test-Path $Staging) { Remove-Item -Recurse -Force $Staging }
  New-Item -ItemType Directory -Path $Staging -Force | Out-Null
  $exclude = @('templates', '.deploy-staging')
  Get-ChildItem -LiteralPath $StackSrc | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Staging $_.Name) -Recurse -Force
  }
}

function Test-RemotePath {
  param(
    [string[]]$SshArgs,
    [string]$SshTarget,
    [string]$RemotePath
  )
  $remoteTest = 'test -e {0} && echo yes || echo no' -f $RemotePath
  $out = & ssh @SshArgs $SshTarget $remoteTest
  return ($out.Trim() -eq 'yes')
}

function Expand-StackStaging {
  param(
    [hashtable]$Vars,
    [bool]$UseHttps
  )
  $Vars['GENERATED_AT'] = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  New-Item -ItemType Directory -Path (Join-Path $Staging 'traefik\dynamic') -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $Staging 'homepage\config') -Force | Out-Null
  Expand-TemplateFile (Join-Path $Templates '.env.tpl') (Join-Path $Staging '.env') $Vars
  if ($UseHttps) {
    Expand-TemplateFile (Join-Path $Templates 'traefik.yml.tpl') (Join-Path $Staging 'traefik\traefik.yml') $Vars
    Expand-TemplateFile (Join-Path $Templates 'traefik-dynamic.yaml.tpl') (Join-Path $Staging 'traefik\dynamic\routers.yaml') $Vars
  } else {
    Copy-Item (Join-Path $StackSrc 'traefik\traefik.http.yml') (Join-Path $Staging 'traefik\traefik.yml') -Force
    Expand-TemplateFile (Join-Path $Templates 'traefik-dynamic.http.yaml.tpl') (Join-Path $Staging 'traefik\dynamic\routers.yaml') $Vars
  }
  Expand-TemplateFile (Join-Path $Templates 'homepage-services.yaml.tpl') (Join-Path $Staging 'homepage\config\services.yaml') $Vars
  Expand-TemplateFile (Join-Path $Templates 'homepage-settings.yaml.tpl') (Join-Path $Staging 'homepage\config\settings.yaml') $Vars
  Expand-TemplateFile (Join-Path $Templates 'homepage-docker.yaml.tpl') (Join-Path $Staging 'homepage\config\docker.yaml') $Vars
  Expand-TemplateFile (Join-Path $Templates 'homepage-widgets.yaml.tpl') (Join-Path $Staging 'homepage\config\widgets.yaml') $Vars
  Expand-TemplateFile (Join-Path $Templates 'homepage-bookmarks.yaml.tpl') (Join-Path $Staging 'homepage\config\bookmarks.yaml') $Vars
  Expand-TemplateFile (Join-Path $Templates 'SECRETS.txt.tpl') (Join-Path $Staging 'SECRETS.txt') $Vars
  Write-VarsJsonFile -Vars $Vars -OutPath (Join-Path $Staging 'traefik\dynamic\_vars.json')
}

function Write-VarsJsonFile {
  param([hashtable]$Vars, [string]$OutPath)
  # Exclure champs quotes .env (SMTP_PASS_QUOTED casse ConvertTo-Json sous Windows)
  $skip = @('SMTP_PASS_QUOTED', 'SMTP_SENDER_QUOTED')
  $safe = [ordered]@{}
  foreach ($k in ($Vars.Keys | Sort-Object)) {
    if ($skip -contains $k) { continue }
    if ($k -match '_QUOTED$') { continue }
    $safe[$k] = [string]$Vars[$k]
  }
  $json = $safe | ConvertTo-Json -Compress -Depth 4
  [IO.File]::WriteAllText($OutPath, $json, [Text.UTF8Encoding]::new($false))
}

function New-StagingFromDeployConfig {
  param([hashtable]$Cfg)
  $domain = [string]$Cfg.Domain
  if (-not $domain) { throw 'deploy.config.json : Domain manquant' }
  $scheme = if ($Cfg.Scheme) { [string]$Cfg.Scheme } else { 'https' }
  $useHttps = ($scheme -eq 'https')
  $crmHost = if ($Cfg.CrmHost) { [string]$Cfg.CrmHost } else { "crm.$domain" }
  $docsHost = if ($Cfg.DocsHost) { [string]$Cfg.DocsHost } else { "docs.$domain" }
  $monitoringHost = if ($Cfg.MonitoringHost) { [string]$Cfg.MonitoringHost } else { "monitoring.$domain" }
  $portainerHost = if ($Cfg.PortainerHost) { [string]$Cfg.PortainerHost } else { "portainer.$domain" }
  $uptimeHost = if ($Cfg.UptimeHost) { [string]$Cfg.UptimeHost } else { "uptime.$domain" }
  $netdataHost = if ($Cfg.NetdataHost) { [string]$Cfg.NetdataHost } else { "netdata.$domain" }
  $n8nHost = if ($Cfg.N8nHost) { [string]$Cfg.N8nHost } else { "n8n.$domain" }
  $openWebuiHost = if ($Cfg.OpenWebuiHost) { [string]$Cfg.OpenWebuiHost } else { "ia.$domain" }
  $serverIp = if ($Cfg.ServerIp) { [string]$Cfg.ServerIp } else { [string]$Cfg.SshHost }
  $projectName = if ($Cfg.ProjectName) { [string]$Cfg.ProjectName } else { 'GSMS' }
  $smtpHost = if ($Cfg.SmtpHost) { [string]$Cfg.SmtpHost } else { 'smtp.hostinger.com' }
  $smtpPort = if ($Cfg.SmtpPort) { [string]$Cfg.SmtpPort } else { '465' }
  $smtpSecure = if ($Cfg.SmtpSecure) { [string]$Cfg.SmtpSecure } else { 'true' }
  $smtpUser = if ($Cfg.SmtpUser) { [string]$Cfg.SmtpUser } else { "admin@$domain" }
  $pgPass = New-Secret 24
  $minioPass = New-Secret 24
  $pgPassEnc = [uri]::EscapeDataString($pgPass)
  $homepageHosts = "$monitoringHost,$portainerHost,$uptimeHost,$serverIp,localhost"
  $vars = @{
    PROJECT_NAME                   = $projectName
    POSTGRES_USER                  = 'lms'
    POSTGRES_PASSWORD              = $pgPass
    POSTGRES_PASSWORD_ENCODED      = $pgPassEnc
    POSTGRES_DB                    = 'lms_app'
    MINIO_ROOT_USER                = 'lms'
    MINIO_ROOT_PASSWORD            = $minioPass
    S3_BUCKET                      = 'lms-uploads'
    SMTP_HOST                      = $smtpHost
    SMTP_PORT                      = $smtpPort
    SMTP_SECURE                    = $smtpSecure
    SMTP_USER                      = $smtpUser
    SMTP_PASS_QUOTED               = $(if ($Cfg.SmtpPass) { Escape-EnvQuoted ([string]$Cfg.SmtpPass) } else { '""' })
    SMTP_FROM                      = $smtpUser
    SMTP_SENDER_QUOTED             = (Escape-EnvQuoted $projectName)
    CONTACT_TO_EMAIL               = $smtpUser
    CONTACT_SEND_USER_CONFIRMATION = 'true'
    NEXTAUTH_URL                   = "${scheme}://$crmHost"
    NEXTAUTH_SECRET                = (New-Secret)
    AUTH_SECRET                    = (New-Secret)
    NEXT_PUBLIC_CRM_URL            = "${scheme}://$crmHost"
    NEXT_PUBLIC_LANDING_URL        = "${scheme}://$domain"
    NEXT_PUBLIC_SITE_URL           = "${scheme}://$domain"
    HOMEPAGE_ALLOWED_HOSTS         = $homepageHosts
    NETDATA_HOSTNAME               = ($projectName.ToLower() -replace '[^a-z0-9-]', '-')
    DOMAIN                         = $domain
    CRM_HOST                       = $crmHost
    DOCS_HOST                      = $docsHost
    MONITORING_HOST                = $monitoringHost
    PORTAINER_HOST                 = $portainerHost
    UPTIME_HOST                    = $uptimeHost
    NETDATA_HOST                   = $netdataHost
    N8N_HOST                       = $n8nHost
    OPEN_WEBUI_HOST                = $openWebuiHost
    SERVER_IP                      = $serverIp
    SCHEME                         = $scheme
    TRAEFIK_EMAIL                  = "admin@$domain"
    CADDY_EMAIL                    = "admin@$domain"
    EXTERNAL_TRAEFIK               = 'true'
    TRAEFIK_DYNAMIC_DIR            = if ($Cfg.TraefikDynamicDir) { [string]$Cfg.TraefikDynamicDir } else { '/opt/traefik/dynamic' }
    TRAEFIK_CONTAINER_NAME         = if ($Cfg.TraefikContainerName) { [string]$Cfg.TraefikContainerName } else { 'traefik' }
  }
  Copy-StackToStaging
  Expand-StackStaging -Vars $vars -UseHttps $useHttps
  Write-Host "  -> Staging regenere: $Staging" -ForegroundColor Green
}

function Sync-CanonicalComposeToStaging {
  $src = Join-Path $script:RepoRoot 'deploy\gsms\docker-compose.yml'
  $dst = Join-Path $script:Staging 'docker-compose.yml'
  if (-not (Test-Path $src)) {
    throw "docker-compose.yml source introuvable: $src"
  }
  Copy-Item -LiteralPath $src -Destination $dst -Force
}

function Send-FullStackToVps {
  param([string[]]$SshArgs, [string]$SshTarget)
  $localEnv = Join-Path $script:Staging '.env'
  if (-not (Test-Path $localEnv)) {
    throw ('Fichier local manquant : ' + $localEnv + ' - lancez .\scripts\1-etape-preparer-fichiers.ps1')
  }
  Sync-CanonicalComposeToStaging
  Write-Host ('  -> Upload scripts\.deploy-staging vers ' + $script:gsmsDir) -ForegroundColor Cyan
  & scp @SshArgs -r ($script:Staging + '\*') ($SshTarget + ':' + $script:gsmsDir + '/')
  # Windows : le wildcard * n'inclut pas les fichiers masques (.env)
  & scp @SshArgs $localEnv ($SshTarget + ':' + $script:gsmsDir + '/.env')
  $localSecrets = Join-Path $script:Staging 'SECRETS.txt'
  if (Test-Path $localSecrets) {
    & scp @SshArgs $localSecrets ($SshTarget + ':' + $script:gsmsDir + '/SECRETS.txt')
  }
  & ssh @SshArgs $SshTarget ('chmod 600 ' + $script:gsmsDir + '/SECRETS.txt ' + $script:gsmsDir + '/.env 2>/dev/null; true')
}

function Test-RemoteGsmsEnv {
  param([string[]]$SshArgs, [string]$SshTarget)
  $remoteTest = 'test -f {0}/.env && echo yes || echo no' -f $script:gsmsDir
  $r = & ssh @SshArgs $SshTarget $remoteTest
  return ($r.Trim() -eq 'yes')
}

function Find-RemoteMonorepoPath {
  param([string[]]$SshArgs, [string]$SshTarget, [string]$PreferredRoot)
  $preferred = Normalize-AppRootPath $PreferredRoot
  $remoteTest = @"
for d in '$preferred' /opt/gsms-school /root/gsms-school /opt/app-prisma; do
  if [ -d "`$d/packages/database" ]; then echo "`$d"; exit 0; fi
done
f=`$(find /opt /root -maxdepth 6 -type f -path '*/packages/database/prisma/schema.prisma' 2>/dev/null | head -1)
if [ -n "`$f" ]; then dirname "`$(dirname "`$(dirname "`$f")")"); exit 0; fi
exit 1
"@
  try {
    $r = & ssh @SshArgs $SshTarget $remoteTest 2>$null
    $p = ($r | Select-Object -Last 1).Trim()
    if ($p -and $p.StartsWith('/')) { return $p }
  } catch { /* ignore */ }
  return $null
}

function Test-SshPrivateKeyFile {
  param([Parameter(Mandatory)][string]$KeyPath)
  if (-not (Test-Path -LiteralPath $KeyPath)) {
    Write-Host ('[SSH] Cle introuvable : ' + $KeyPath) -ForegroundColor Red
    return $false
  }
  $null = & ssh-keygen -y -f $KeyPath 2>&1
  if ($LASTEXITCODE -eq 0) { return $true }
  Write-Host ('[SSH] Cle refusee par OpenSSH (invalid format) : ' + $KeyPath) -ForegroundColor Red
  Write-Host '       Cockpit : hote - reimporter la cle PEM dans le vault (pas de passphrase).' -ForegroundColor DarkYellow
  Write-Host '       Puis relancez Go depuis le pipeline (sync deploy.config).' -ForegroundColor DarkYellow
  return $false
}

function New-DeploySshArgs {
  param([switch]$AllocateTty)
  $args = @('-i', $script:sshKey, '-o', 'StrictHostKeyChecking=accept-new')
  # -tt : force un PTY distant même si OpenSSH hésite (terminal web / node-pty)
  if ($AllocateTty) { return @('-tt') + $args }
  return $args
}

function Sync-DeployInvokeContext {
  # Portee explicite : Invoke-LmsDeployExecute lit toujours $script:* (evite variables vides en fonction)
  $script:Staging = $Staging
  $script:RepoRoot = $RepoRoot
  $script:gsmsDir = $gsmsDir
  $script:appRoot = $appRoot
  $script:sshHost = $sshHost
  $script:sshUser = $sshUser
  $script:sshKey = $sshKey
  $script:domain = $domain
  $script:crmHost = $crmHost
  $script:scheme = $scheme
  $script:serverIp = $serverIp
  $script:skipStackUpload = $skipStackUpload
  $script:syncMonorepo = $syncMonorepo
  $script:deployApps = $deployApps
  $script:deployMigrate = $deployMigrate
  $script:withMonitoring = $withMonitoring
  if (-not $script:deployMode) {
    if ($script:InfraOnly) { $script:deployMode = 'infra_only' }
    elseif ($script:AppsOnly) { $script:deployMode = 'apps_only' }
    elseif ($script:RebuildOnly) { $script:deployMode = 'rebuild_only' }
    else { $script:deployMode = 'full' }
  }
}

function Invoke-LmsDeployExecute {
  Sync-DeployInvokeContext
  $sshTarget = "${script:sshUser}@${script:sshHost}"
  $sshArgs = New-DeploySshArgs
  $sshStreamArgs = New-DeploySshArgs -AllocateTty
  $skipEnvChmod = $false

  Write-Host ''
  Write-Host '--- Sync vers VPS ---' -ForegroundColor Cyan
  if ($script:PtyMode) {
    [Console]::Out.Flush()
  }
  & ssh @sshArgs $sshTarget ('mkdir -p ' + $script:gsmsDir)
  & scp @sshArgs (Join-Path $PSScriptRoot 'prepare-vps.sh') "${sshTarget}:/tmp/prepare-vps.sh"
  & scp @sshArgs (Join-Path $PSScriptRoot 'install-docker-vps.sh') "${sshTarget}:/tmp/install-docker-vps.sh"
  & scp @sshArgs (Join-Path $PSScriptRoot '_deploy-remote-lib.sh') "${sshTarget}:/tmp/_deploy-remote-lib.sh"
  & scp @sshArgs (Join-Path $PSScriptRoot 'install-external-traefik-routes.sh') "${sshTarget}:/tmp/install-external-traefik-routes.sh"
  $prepSed = 'sed -i ''s/\r$//'' /tmp/prepare-vps.sh /tmp/install-docker-vps.sh /tmp/_deploy-remote-lib.sh /tmp/install-external-traefik-routes.sh 2>/dev/null; true'
  $prepChmod = 'chmod +x /tmp/prepare-vps.sh /tmp/install-docker-vps.sh /tmp/_deploy-remote-lib.sh /tmp/install-external-traefik-routes.sh 2>/dev/null; true'
  & ssh @sshArgs $sshTarget ($prepSed + '; ' + $prepChmod)

  if (-not $script:skipStackUpload) {
    $remoteEnv = Test-RemoteGsmsEnv -SshArgs $sshArgs -SshTarget $sshTarget
    if ($remoteEnv -and $script:InfraOnly) {
      Write-Host 'ATTENTION: .env deja present sur le VPS.' -ForegroundColor Yellow
      if (-not (Read-YesNo 'Ecraser .env et SECRETS.txt (casse Postgres si nouveau mot de passe)' $false)) {
        Write-Host '  -> Upload stack SANS .env ni SECRETS.txt' -ForegroundColor DarkGray
        Get-ChildItem $script:Staging -Exclude '.env', 'SECRETS.txt' | ForEach-Object {
          & scp @sshArgs -r $_.FullName ($sshTarget + ':' + $script:gsmsDir + '/')
        }
        $skipEnvChmod = $true
      } else {
        Send-FullStackToVps -SshArgs $sshArgs -SshTarget $sshTarget
      }
    } else {
      Send-FullStackToVps -SshArgs $sshArgs -SshTarget $sshTarget
    }
  } elseif ($script:appsOnlyStackRepair) {
    Write-Host '--- Etape 3 : envoi stack (/.env manquant sur VPS) ---' -ForegroundColor Cyan
    Send-FullStackToVps -SshArgs $sshArgs -SshTarget $sshTarget
    Write-Host '  -> Stack envoyee' -ForegroundColor Green
  } else {
    Write-Host '  -> Pas de sync stack (/.env deja sur VPS)' -ForegroundColor DarkGray
  }

  # Toujours forcer le compose canonique (sans gsms-traefik) — le staging peut etre obsolete
  $canonicalCompose = Join-Path $script:RepoRoot 'deploy\gsms\docker-compose.yml'
  if (Test-Path $canonicalCompose) {
    Write-Host '  -> Force docker-compose.yml (sans Traefik GSMS)' -ForegroundColor Cyan
    & scp @sshArgs $canonicalCompose ($sshTarget + ':' + $script:gsmsDir + '/docker-compose.yml')
  }

  if (-not (Test-RemoteGsmsEnv -SshArgs $sshArgs -SshTarget $sshTarget)) {
    if (Test-Path (Join-Path $script:Staging '.env')) {
      Write-Host 'AVERTISSEMENT: .env toujours absent sur VPS - nouvel envoi automatique...' -ForegroundColor Yellow
      Send-FullStackToVps -SshArgs $sshArgs -SshTarget $sshTarget
      $script:deployBootstrapInfra = $true
    }
    if (-not (Test-RemoteGsmsEnv -SshArgs $sshArgs -SshTarget $sshTarget)) {
      throw ('Echec upload : ' + $script:gsmsDir + '/.env introuvable sur le VPS apres scp. Verifiez SSH et espace disque.')
    }
  }
  Write-Host ('  OK : ' + $script:gsmsDir + '/.env present sur le VPS') -ForegroundColor Green

  if ($script:syncMonorepo) {
    Write-Host '--- Sync monorepo (archive, peut prendre plusieurs minutes) ---' -ForegroundColor Cyan
    $tar = Join-Path $env:TEMP "lms-monorepo-$(Get-Date -Format 'yyyyMMddHHmmss').tar.gz"
    Push-Location $script:RepoRoot
    try {
      & tar -czf $tar `
        --exclude=node_modules --exclude=.next --exclude=.git --exclude=.turbo `
        --exclude=scripts/.deploy-staging --exclude='*.tar.gz' .
    } finally { Pop-Location }
    & scp @sshArgs $tar "${sshTarget}:/tmp/lms-monorepo.tar.gz"
    $ar = $script:appRoot
    $tarCmd = 'set -e; mkdir -p ' + $ar + '; tar -xzf /tmp/lms-monorepo.tar.gz -C ' + $ar
    $tarCmd += '; rm -f /tmp/lms-monorepo.tar.gz'
    $tarCmd += '; cp -f /tmp/_deploy-remote-lib.sh ' + $ar + '/scripts/deploy/_deploy-remote-lib.sh 2>/dev/null; true'
    $tarCmd += '; find ' + $ar + '/scripts -name ''*.sh'' -exec sed -i ''s/\r$//'' {} + 2>/dev/null; true'
    $tarCmd += '; chmod +x ' + $ar + '/scripts/deploy/*.sh 2>/dev/null; true'
    $gd = $script:gsmsDir
    $tarCmd += '; cp -f ' + $ar + '/deploy/gsms/Dockerfile.* ' + $gd + '/ 2>/dev/null; true'
    & ssh @sshArgs $sshTarget $tarCmd
    Remove-Item $tar -Force -ErrorAction SilentlyContinue
  }

  Write-Host '--- Execution sur le VPS (SSH interactif — reponses dans le terminal cockpit) ---' -ForegroundColor Cyan
  if ($script:PtyMode) {
    [Console]::Out.Flush()
  }
  $remoteScript = Join-Path $PSScriptRoot 'deploy-lms-remote.sh'
  $remoteScriptOnHost = '/tmp/deploy-lms-remote.sh'
  & scp @sshArgs $remoteScript "${sshTarget}:${remoteScriptOnHost}"
  # Scripts Windows (CRLF) : sed sur le NUC avant execution (evite "set -euo pipefail" invalide)
  $ar = $script:appRoot
  $remoteCmd = @(
    ('sed -i ''s/\r$//'' ' + $remoteScriptOnHost + ' /tmp/_deploy-remote-lib.sh /tmp/install-docker-vps.sh 2>/dev/null; true'),
    ('find ' + $ar + '/scripts -name ''*.sh'' -exec sed -i ''s/\r$//'' {} + 2>/dev/null; true'),
    ('chmod +x ' + $remoteScriptOnHost + ' /tmp/install-docker-vps.sh /tmp/_deploy-remote-lib.sh 2>/dev/null; true'),
    ('export GSMS_DIR=' + $script:gsmsDir),
    'export DEPLOY_LIB=/tmp/_deploy-remote-lib.sh',
    ('export APP_ROOT=' + $ar),
    ('export DEPLOY_MODE=' + $script:deployMode),
    ('export DEPLOY_APPS=' + $script:deployApps.ToString().ToLower()),
    ('export DEPLOY_MIGRATE=' + $script:deployMigrate.ToString().ToLower()),
    ('export DEPLOY_MONITORING=' + $script:withMonitoring.ToString().ToLower()),
    ('export DEPLOY_BOOTSTRAP_INFRA=' + $script:deployBootstrapInfra.ToString().ToLower()),
    ('export DOCKER_BUILD_NO_CACHE=' + $(if ($script:DockerBuildNoCache) { '1' } else { '0' })),
    ('export REBUILD_DOCS=' + $(if ($script:RebuildDocsOnVps) { '1' } else { '0' })),
    ('bash ' + $remoteScriptOnHost)
  ) -join '; '
  # -t : flux SSH ligne par ligne vers le terminal web (comme le reset)
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & ssh @sshStreamArgs $sshTarget $remoteCmd
  $remoteExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($remoteExit -ne 0) {
    throw "Echec du script distant (code $remoteExit). Voir la sortie SSH ci-dessus."
  }

  Write-Host ''
  Write-Host '=== Deploiement termine ===' -ForegroundColor Green
  Write-Host "  Stack : $($script:gsmsDir)"
  Write-Host "  Landing : $($script:scheme)://$($script:domain)"
  Write-Host "  CRM     : $($script:scheme)://$($script:crmHost)"
  if (-not $script:AppsOnly) {
    Write-Host ''
    Write-Host 'Mots de passe Postgres / MinIO :' -ForegroundColor Cyan
    Write-Host "  ssh $sshTarget `"cat $($script:gsmsDir)/SECRETS.txt`""
  }
  if ($script:InfraOnly) {
    Write-Host ''
    Write-Host 'Etape 3 : .\scripts\3-etape-apps-vps.ps1' -ForegroundColor Green
  }
  if (-not $script:AppsOnly -and -not $script:smtpPass) {
    Write-Host ''
    Write-Host 'SMTP client : editer sur le VPS si besoin :' -ForegroundColor Yellow
    Write-Host "  ssh $sshTarget `"nano $($script:gsmsDir)/.env`""
  }
  Write-Host ''
  Write-Host "DNS : A records -> $($script:serverIp)" -ForegroundColor Yellow
}

if (($AppsOnly -or $RebuildOnly) -and -not $ConfigFile) {
  $ConfigFile = $DefaultConfigPath
}

if ($UseDeployConfig -and $PrepareOnly) {
  $cfgPath = if ($ConfigFile -and (Test-Path $ConfigFile)) { $ConfigFile } else { $DefaultConfigPath }
  if (-not (Test-Path $cfgPath)) { throw "Config introuvable: $cfgPath" }
  $obj = Get-Content $cfgPath -Raw | ConvertFrom-Json
  $ht = @{}
  $obj.PSObject.Properties | ForEach-Object { $ht[$_.Name] = $_.Value }
  if ($env:DEPLOY_SMTP_PASS) { $ht['SmtpPass'] = [string]$env:DEPLOY_SMTP_PASS }
  Write-Host '=== Preparation depuis deploy.config.json ===' -ForegroundColor Cyan
  Write-Host "  Domaine : $($ht.Domain)  |  SMTP : $($ht.SmtpUser)"
  New-StagingFromDeployConfig -Cfg $ht
  Write-Host ''
  Write-Host "=== Staging pret : $Staging ===" -ForegroundColor Green
  Write-Host '  Etape suivante : .\scripts\2-etape-infra-vps.ps1'
  exit 0
}

Write-Host ''
if ($PrepareOnly) {
  Write-Host '=== Preparation fichiers (PC uniquement, pas de SSH) ===' -ForegroundColor Cyan
} elseif ($AppsOnly) {
  Write-Host '=== Deploiement LMS - mode AppsOnly (etape 3) ===' -ForegroundColor Cyan
} elseif ($RebuildOnly) {
  Write-Host '=== Rebuild images Docker sur le VPS (etape 4) ===' -ForegroundColor Cyan
} elseif ($InfraOnly) {
  Write-Host '=== Deploiement LMS - mode InfraOnly (etape 2 VPS) ===' -ForegroundColor Cyan
} else {
  Write-Host '=== Deploiement LMS (complet) ===' -ForegroundColor Cyan
}
Write-Host 'Entree = valeur par defaut entre crochets.'
Write-Host ''

function Get-Cfg {
  param([string]$Key, [string]$Fallback)
  if ($script:Saved.ContainsKey($Key) -and $script:Saved[$Key]) { return [string]$script:Saved[$Key] }
  return $Fallback
}

# Profil SSH injecté par gsms-deploy (deploy-terminal-server) quand on lance depuis le pipeline UI.
function Apply-UiHostEnvOverrides {
  if ($env:LMS_DEPLOY_SSH_HOST) {
    $script:Saved['SshHost'] = $env:LMS_DEPLOY_SSH_HOST.Trim()
    if ($env:LMS_DEPLOY_SSH_USER) { $script:Saved['SshUser'] = $env:LMS_DEPLOY_SSH_USER.Trim() }
    if ($env:LMS_DEPLOY_SSH_KEY) { $script:Saved['SshKey'] = $env:LMS_DEPLOY_SSH_KEY.Trim() }
    if ($env:LMS_DEPLOY_GSMS_DIR) { $script:Saved['GsmsDir'] = $env:LMS_DEPLOY_GSMS_DIR.Trim() }
    if ($env:LMS_DEPLOY_APP_ROOT) { $script:Saved['AppRoot'] = $env:LMS_DEPLOY_APP_ROOT.Trim() }
    $target = "$(Get-Cfg 'SshUser' 'root')@$(Get-Cfg 'SshHost' '?')"
    $gsms = Get-Cfg 'GsmsDir' '/opt/gsms'
    Write-Host ('[UI] Cible VPS (profil hote cockpit) : ' + $target + ' | ' + $gsms) -ForegroundColor Cyan
    return
  }
  if ($script:PtyMode) {
    if ($env:LMS_DEPLOY_UI_WARN) {
      Write-Host ('[UI] ' + $env:LMS_DEPLOY_UI_WARN) -ForegroundColor Yellow
    }
    $uiCfgTarget = (Get-Cfg 'SshUser' 'root') + '@' + (Get-Cfg 'SshHost' '?')
    $uiCfgGsms = Get-Cfg 'GsmsDir' '/opt/gsms'
    Write-Host ('[UI] Cible depuis deploy.config.json : ' + $uiCfgTarget + ' | ' + $uiCfgGsms) -ForegroundColor DarkYellow
    Write-Host '      Si ce n''est pas le bon VPS, ouvrez le pipeline depuis l''hote cockpit (sync auto deploy.config).' -ForegroundColor DarkYellow
  }
}

# --- Charger config partielle (sans secrets) ---
$script:Saved = @{}
if ($AppsOnly -or $RebuildOnly) {
  if (-not (Test-Path $ConfigFile)) {
    throw "Config introuvable: $ConfigFile`nFaites d'abord: .\scripts\1-etape-preparer-fichiers.ps1 puis .\scripts\2-etape-infra-vps.ps1"
  }
}
if ($ConfigFile -and (Test-Path $ConfigFile)) {
  $obj = Get-Content $ConfigFile -Raw | ConvertFrom-Json
  $obj.PSObject.Properties | ForEach-Object { $script:Saved[$_.Name] = $_.Value }
  Write-Host "Config chargee: $ConfigFile" -ForegroundColor DarkGray
}
Apply-UiHostEnvOverrides

$skipStackUpload = $false
$deployMode = 'full'

if ($AppsOnly) {
  $deployMode = 'apps_only'
  $skipStackUpload = $true
  $script:appsOnlyStackRepair = $false
  $script:deployBootstrapInfra = $false
  $sshHost = Get-Cfg 'SshHost' '192.168.1.37'
  $sshUser = Get-Cfg 'SshUser' 'root'
  $sshKey = Get-Cfg 'SshKey' $DefaultKey
  $gsmsDir = Get-Cfg 'GsmsDir' '/opt/gsms'
  $appRoot = Normalize-AppRootPath (Get-Cfg 'AppRoot' '/opt/gsms-school')
  $domain = Get-Cfg 'Domain' 'example.com'
  $crmHost = Get-Cfg 'CrmHost' "crm.$domain"
  $scheme = Get-Cfg 'Scheme' 'https'
  $useHttps = ($scheme -eq 'https')
  $serverIp = Get-Cfg 'ServerIp' $sshHost
  $script:smtpPass = ''
  Write-Host "  VPS: ${sshUser}@${sshHost}  |  ${scheme}://$domain  |  code: $appRoot"

  $sshTarget = "${sshUser}@${sshHost}"
  $sshArgs = @('-i', $sshKey, '-o', 'StrictHostKeyChecking=accept-new')
  $remoteEnv = Test-RemotePath -SshArgs $sshArgs -SshTarget $sshTarget -RemotePath "$gsmsDir/.env"
  $remoteCompose = Test-RemotePath -SshArgs $sshArgs -SshTarget $sshTarget -RemotePath "$gsmsDir/docker-compose.yml"

  if (-not $remoteEnv -or -not $remoteCompose) {
    Write-Host ''
    Write-Host '--- Infra absente ou incomplete sur le VPS ---' -ForegroundColor Yellow
    if (-not $remoteEnv) { Write-Host "  Manquant: $gsmsDir/.env" }
    if (-not $remoteCompose) { Write-Host "  Manquant: $gsmsDir/docker-compose.yml" }
    Write-Host '  Cause frequente: pass 1 (-InfraOnly) interrompu avant upload, ou VPS reinitialise.' -ForegroundColor DarkGray

    $localEnv = Join-Path $Staging '.env'
    if (Test-Path $localEnv) {
      Write-Host ('  Copie locale OK : ' + $localEnv) -ForegroundColor Green
      Write-Host '  -> Envoi automatique de .deploy-staging au debut du deploiement' -ForegroundColor Cyan
      $script:appsOnlyStackRepair = $true
      $script:deployBootstrapInfra = $true
    } else {
      Write-Host "  Pas de staging local ($Staging)." -ForegroundColor Yellow
      if (Read-YesNo 'Regenerer .env depuis deploy.config.json (NOUVEAUX mots de passe - OK si Postgres jamais demarre)' $false) {
        New-StagingFromDeployConfig -Cfg $script:Saved
        $script:appsOnlyStackRepair = $true
        $script:deployBootstrapInfra = $true
      } else {
        throw "AppsOnly impossible sans .env sur le VPS.`n  1) .\scripts\2-etape-infra-vps.ps1`n  2) Ou regenerez le staging (etape 1)"
      }
    }
  } else {
    Write-Host 'Infra presente sur le VPS (.env OK).' -ForegroundColor DarkGray
  }

  $remoteMono = Find-RemoteMonorepoPath -SshArgs $sshArgs -SshTarget $sshTarget -PreferredRoot $appRoot
  if ($env:LMS_DEPLOY_SKIP_MONOREPO_SYNC -eq '1') {
    Write-Host 'Sync monorepo : ignoree (LMS_DEPLOY_SKIP_MONOREPO_SYNC)' -ForegroundColor DarkGray
    $syncMonorepo = $false
  } elseif ($remoteMono) {
    Write-Host "Monorepo DEJA sur le VPS : $remoteMono" -ForegroundColor Green
    $appRoot = Normalize-AppRootPath $remoteMono
    $syncMonorepo = Read-YesNo 'Re-synchroniser le monorepo depuis ce PC (45 Mo, lent)' $false
  } else {
    Write-Host 'Monorepo ABSENT sur le VPS — sync obligatoire.' -ForegroundColor Yellow
    $syncMonorepo = Read-YesNo 'Synchroniser le monorepo depuis ce PC' $true
  }
  $deployApps = $true
  $deployMigrate = Read-YesNo 'Executer migrations Prisma + seed' $true
  $withMonitoring = $false
  if (-not (Read-YesNo 'Lancer le deploiement apps maintenant' $true)) { exit 0 }
  Invoke-LmsDeployExecute
  exit 0
}

if ($RebuildOnly) {
  $deployMode = 'rebuild_only'
  $skipStackUpload = $true
  $script:appsOnlyStackRepair = $false
  $script:deployBootstrapInfra = $false
  $sshHost = Get-Cfg 'SshHost' '192.168.1.37'
  $sshUser = Get-Cfg 'SshUser' 'root'
  $sshKey = Get-Cfg 'SshKey' $DefaultKey
  $gsmsDir = Get-Cfg 'GsmsDir' '/opt/gsms'
  $appRoot = Normalize-AppRootPath (Get-Cfg 'AppRoot' '/opt/gsms-school')
  $domain = Get-Cfg 'Domain' 'example.com'
  $crmHost = Get-Cfg 'CrmHost' "crm.$domain"
  $scheme = Get-Cfg 'Scheme' 'https'
  $serverIp = Get-Cfg 'ServerIp' $sshHost
  $script:smtpPass = ''
  Write-Host "  VPS: ${sshUser}@${sshHost}  |  code: $appRoot"
  Write-Host '  Rebuild : images Docker CRM + landing + worker (pas docs sauf -RebuildDocs)' -ForegroundColor DarkGray
  Write-Host '  Donnees : Postgres/Redis/MinIO = volumes Docker — NON supprimes par le rebuild' -ForegroundColor DarkGray
  Write-Host '  Sauvegarde auto : dump BDD + .env + compose dans .gsms-cockpit/backups/pre-*' -ForegroundColor DarkGray
  Write-Host '  Migrations Prisma : desactivees par defaut (repondez Non sauf si vous savez)' -ForegroundColor Yellow
  if ($script:DockerBuildNoCache) {
    Write-Host '  docker build --no-cache' -ForegroundColor DarkGray
  }

  $sshTarget = "${sshUser}@${sshHost}"
  if (-not (Test-SshPrivateKeyFile -KeyPath $sshKey)) {
    throw 'Cle SSH invalide — corrigez le vault cockpit puis relancez.'
  }
  $sshArgs = @('-i', $sshKey, '-o', 'StrictHostKeyChecking=accept-new')
  $remoteEnv = Test-RemotePath -SshArgs $sshArgs -SshTarget $sshTarget -RemotePath "$gsmsDir/.env"
  $remoteCompose = Test-RemotePath -SshArgs $sshArgs -SshTarget $sshTarget -RemotePath "$gsmsDir/docker-compose.yml"

  if (-not $remoteEnv -or -not $remoteCompose) {
    Write-Host ''
    Write-Host '--- Infra absente ou incomplete sur le VPS ---' -ForegroundColor Yellow
    if (-not $remoteEnv) { Write-Host "  Manquant: $gsmsDir/.env" }
    if (-not $remoteCompose) { Write-Host "  Manquant: $gsmsDir/docker-compose.yml" }
    Write-Host "  Hote verifie : $sshTarget | gsmsDir=$gsmsDir" -ForegroundColor DarkGray
    Write-Host '  Cause frequente: mauvais VPS dans deploy.config.json (utilisez l hote cockpit / sync auto).' -ForegroundColor DarkGray

    $localEnv = Join-Path $Staging '.env'
    if (Test-Path $localEnv) {
      Write-Host ('  Copie locale OK : ' + $localEnv) -ForegroundColor Green
      Write-Host '  -> Envoi automatique de .deploy-staging puis rebuild' -ForegroundColor Cyan
      $script:appsOnlyStackRepair = $true
      $script:deployBootstrapInfra = $true
      $skipStackUpload = $false
    } else {
      throw "Rebuild impossible sans stack sur $sshTarget.`n  Lancez l'etape 2 Infra sur CE VPS, ou verifiez SshHost/GsmsDir (profil cockpit)."
    }
  } else {
    Write-Host 'Infra presente sur le VPS (compose + .env OK).' -ForegroundColor DarkGray
  }

  $syncMonorepo = Read-YesNo 'Synchroniser le monorepo depuis ce PC (obligatoire si code corrige)' $true
  $deployApps = $true
  $deployMigrate = Read-YesNo 'Executer aussi migrations Prisma + seed (RISQUE si BDD prod deja en service)' $false
  $withMonitoring = $false
  if (-not (Read-YesNo 'Lancer le rebuild maintenant' $true)) { exit 0 }
  Invoke-LmsDeployExecute
  exit 0
}

if ($InfraOnly) {
  $deployMode = 'infra_only'
}

$script:skipWizard = $false
$stagingEnv = Join-Path $Staging '.env'

if ($InfraOnly -and (Test-Path $stagingEnv) -and (Test-Path $DefaultConfigPath)) {
  Write-Host ''
  Write-Host 'Fichiers prepares trouves : scripts\.deploy-staging\' -ForegroundColor Green
  if (Read-YesNo 'Utiliser ces fichiers (recommande, pas de nouveaux mots de passe)' $true) {
    $script:skipWizard = $true
    if (-not $script:Saved.Count) {
      $obj = Get-Content $DefaultConfigPath -Raw | ConvertFrom-Json
      $obj.PSObject.Properties | ForEach-Object { $script:Saved[$_.Name] = $_.Value }
    }
    $sshHost = Get-Cfg 'SshHost' '192.168.1.37'
    $sshUser = Get-Cfg 'SshUser' 'root'
    $sshKey = Get-Cfg 'SshKey' $DefaultKey
    $gsmsDir = Get-Cfg 'GsmsDir' '/opt/gsms'
    $appRoot = Normalize-AppRootPath (Get-Cfg 'AppRoot' '/opt/gsms-school')
    $projectName = Get-Cfg 'ProjectName' 'GSMS'
    $domain = Get-Cfg 'Domain' 'hosting-global-it-ss.com'
    $crmHost = Get-Cfg 'CrmHost' "crm.$domain"
    $docsHost = Get-Cfg 'DocsHost' "docs.$domain"
    $monitoringHost = Get-Cfg 'MonitoringHost' "monitoring.$domain"
    $portainerHost = Get-Cfg 'PortainerHost' "portainer.$domain"
    $uptimeHost = Get-Cfg 'UptimeHost' "uptime.$domain"
    $netdataHost = Get-Cfg 'NetdataHost' "netdata.$domain"
    $n8nHost = Get-Cfg 'N8nHost' "n8n.$domain"
    $openWebuiHost = Get-Cfg 'OpenWebuiHost' "ia.$domain"
    $scheme = Get-Cfg 'Scheme' 'https'
    $useHttps = ($scheme -eq 'https')
    $serverIp = Get-Cfg 'ServerIp' $sshHost
    $smtpHost = Get-Cfg 'SmtpHost' 'smtp.hostinger.com'
    $smtpPort = Get-Cfg 'SmtpPort' '465'
    $smtpSecure = Get-Cfg 'SmtpSecure' 'true'
    $smtpUser = Get-Cfg 'SmtpUser' "admin@$domain"
    Write-Host ''
    Write-Host '--- Options envoi VPS ---' -ForegroundColor Yellow
    $withMonitoring = Read-YesNo 'Deployer monitoring (Portainer, Netdata, Homepage, Uptime)' $true
    $syncMonorepo = $false
    $deployApps = $false
    $deployMigrate = $false
    $script:smtpPass = ''
  }
}

if ($InfraOnly -and -not $script:skipWizard -and -not (Test-Path $stagingEnv)) {
  Write-Host ''
  Write-Host 'Aucun fichier prepare (scripts\.deploy-staging\.env absent).' -ForegroundColor Yellow
  Write-Host '  Lancez d abord : .\scripts\1-etape-preparer-fichiers.ps1' -ForegroundColor Yellow
  if (-not (Read-YesNo 'Continuer quand meme et tout regenerer ici' $false)) {
    exit 0
  }
}

if (-not $script:skipWizard) {

$sshHost = Read-Default 'IP ou hostname du VPS' (Get-Cfg 'SshHost' '192.168.1.37')
$sshUser = Read-Default 'Utilisateur SSH' (Get-Cfg 'SshUser' 'root')
$sshKey = Read-Default 'Cle SSH' (Get-Cfg 'SshKey' $DefaultKey)
$gsmsDir = Read-Default 'Dossier stack sur le VPS' (Get-Cfg 'GsmsDir' '/opt/gsms')
$appRoot = Normalize-AppRootPath (Read-Default 'Dossier monorepo sur le VPS (absolu)' (Get-Cfg 'AppRoot' '/opt/gsms-school'))

$projectName = Read-Default 'Nom du projet / client' (Get-Cfg 'ProjectName' 'GSMS')
$domain = Read-Default 'Domaine principal (landing)' (Get-Cfg 'Domain' 'gsms-security.com')
$serverIp = Read-Default 'IP du VPS (DNS A records)' (Get-Cfg 'ServerIp' $sshHost)

Write-Host ''
Write-Host '--- Sous-domaines (defaut: crm.DOMAINE, etc.) ---' -ForegroundColor Yellow
$crmHost = Read-Default 'CRM' "crm.$domain"
$docsHost = Read-Default 'Documentation' "docs.$domain"
$monitoringHost = Read-Default 'Homepage / monitoring' "monitoring.$domain"
$portainerHost = Read-Default 'Portainer' "portainer.$domain"
$uptimeHost = Read-Default 'Uptime Kuma' "uptime.$domain"
$netdataHost = Read-Default 'Netdata' "netdata.$domain"
$n8nHost = Read-Default 'n8n (workflows)' (Get-Cfg 'N8nHost' "n8n.$domain")
$openWebuiHost = Read-Default 'Open WebUI (IA)' (Get-Cfg 'OpenWebuiHost' "ia.$domain")
$traefikEmail = Read-Default 'Email Traefik (Let us Encrypt)' "admin@$domain"

Write-Host ''
Write-Host '--- Base de donnees (automatique) ---' -ForegroundColor Yellow
# Toujours identiques — mot de passe genere et sauvegarde sur le VPS (SECRETS.txt + .env)
$pgUser = 'lms'
$pgDb = 'lms_app'
$pgPass = New-Secret 24
$minioUser = 'lms'
$minioPass = New-Secret 24
$s3Bucket = 'lms-uploads'
Write-Host "  Postgres : utilisateur=$pgUser base=$pgDb mot de passe=*** (genere -> SECRETS.txt sur le VPS)" -ForegroundColor DarkGray
Write-Host "  MinIO    : utilisateur=$minioUser mot de passe=*** (genere -> SECRETS.txt)" -ForegroundColor DarkGray

Write-Host ''
Write-Host '--- SMTP (boite mail du CLIENT) ---' -ForegroundColor Yellow
Write-Host '  Vous ne devez pas connaitre ce mot de passe : le client le saisit ici ou plus tard sur le VPS (.env).' -ForegroundColor DarkGray
$smtpHost = Read-Default 'Serveur SMTP' (Get-Cfg 'SmtpHost' 'smtp.hostinger.com')
$smtpPort = Read-Default 'Port SMTP' (Get-Cfg 'SmtpPort' '465')
$smtpSecure = Read-Default 'SMTP_SECURE (true/false)' (Get-Cfg 'SmtpSecure' 'true')
$smtpUser = Read-Default 'Email SMTP du client (SMTP_USER / FROM)' (Get-Cfg 'SmtpUser' "admin@$domain")
$smtpFrom = $smtpUser
$smtpSender = Read-Default 'Nom affiche (SMTP_SENDER)' $projectName
$contactTo = Read-Default 'Email reception formulaire contact' $smtpFrom

$smtpPass = ''
if (Read-YesNo 'Le client saisit le mot de passe mail maintenant' $true) {
  $smtpPass = Read-Secret 'Mot de passe boite mail (client - non enregistre sur ce PC)'
} else {
  Write-Host '  -> SMTP_PASS laisse vide : le client remplira /opt/gsms/.env sur le serveur (SMTP_PASS=...)' -ForegroundColor DarkGray
}

Write-Host ''
Write-Host '--- Options deploiement ---' -ForegroundColor Yellow
if ($PrepareOnly) {
  $withMonitoring = Read-YesNo 'Inclure monitoring dans la stack (Portainer, Netdata, etc.)' $true
  $syncMonorepo = $false
  $deployApps = $false
  $deployMigrate = $false
  Write-Host '  PrepareOnly : rien n est envoye au VPS a cette etape.' -ForegroundColor DarkGray
} elseif ($InfraOnly) {
  $withMonitoring = Read-YesNo 'Deployer monitoring (Portainer, Netdata, Homepage, Uptime)' $true
  $syncMonorepo = $false
  $deployApps = $false
  $deployMigrate = $false
  Write-Host '  InfraOnly : etape 3 = .\scripts\3-etape-apps-vps.ps1' -ForegroundColor DarkGray
} else {
  $withMonitoring = Read-YesNo 'Deployer monitoring (Portainer, Netdata, Homepage, Uptime)' $true
  $syncMonorepo = Read-YesNo 'Synchroniser le monorepo depuis ce PC (peut etre long)' $false
  $deployApps = Read-YesNo 'Builder et demarrer les apps (landing, CRM, docs)' $false
  $deployMigrate = $false
  if ($deployApps) {
    $deployMigrate = Read-YesNo 'Executer migrations Prisma + seed' $true
  }
}

# Toujours reverse proxy externe (hPanel / Traefik VPS) — pas de gsms-traefik
$externalTraefik = $true
$traefikDynamicDir = Get-Cfg 'TraefikDynamicDir' '/opt/traefik/dynamic'
$traefikContainerName = Get-Cfg 'TraefikContainerName' 'traefik'
Write-Host ''
Write-Host '--- Reverse proxy ---' -ForegroundColor Yellow
Write-Host '  hPanel / Traefik VPS : apps sur 127.0.0.1:3000 (landing), :3001 (crm), :3004 (docs)' -ForegroundColor DarkGray
$useHttps = $true
$scheme = 'https'
$nextAuthSecret = New-Secret
$authSecret = New-Secret

$pgPassEnc = [uri]::EscapeDataString($pgPass)
$homepageHosts = "$monitoringHost,$portainerHost,$uptimeHost,$serverIp,localhost"

$vars = @{
  PROJECT_NAME                   = $projectName
  POSTGRES_USER                  = $pgUser
  POSTGRES_PASSWORD              = $pgPass
  POSTGRES_PASSWORD_ENCODED      = $pgPassEnc
  POSTGRES_DB                    = $pgDb
  MINIO_ROOT_USER                = $minioUser
  MINIO_ROOT_PASSWORD            = $minioPass
  S3_BUCKET                      = $s3Bucket
  SMTP_HOST                      = $smtpHost
  SMTP_PORT                      = $smtpPort
  SMTP_SECURE                    = $smtpSecure
  SMTP_USER                      = $smtpUser
  SMTP_PASS_QUOTED               = $(if ($smtpPass) { Escape-EnvQuoted $smtpPass } else { '""' })
  SMTP_FROM                      = $smtpFrom
  SMTP_SENDER_QUOTED             = (Escape-EnvQuoted $smtpSender)
  CONTACT_TO_EMAIL               = $contactTo
  CONTACT_SEND_USER_CONFIRMATION = 'true'
  NEXTAUTH_URL                   = "${scheme}://$crmHost"
  NEXTAUTH_SECRET                = $nextAuthSecret
  AUTH_SECRET                    = $authSecret
  NEXT_PUBLIC_CRM_URL            = "${scheme}://$crmHost"
  NEXT_PUBLIC_LANDING_URL        = "${scheme}://$domain"
  NEXT_PUBLIC_SITE_URL           = "${scheme}://$domain"
  HOMEPAGE_ALLOWED_HOSTS         = $homepageHosts
  NETDATA_HOSTNAME               = ($projectName.ToLower() -replace '[^a-z0-9-]', '-')
  DOMAIN                         = $domain
  CRM_HOST                       = $crmHost
  DOCS_HOST                      = $docsHost
  MONITORING_HOST                = $monitoringHost
  PORTAINER_HOST                 = $portainerHost
  UPTIME_HOST                    = $uptimeHost
  NETDATA_HOST                   = $netdataHost
  N8N_HOST                       = $n8nHost
  OPEN_WEBUI_HOST                = $openWebuiHost
  SERVER_IP                      = $serverIp
  SCHEME                         = $scheme
  TRAEFIK_EMAIL                  = $traefikEmail
  CADDY_EMAIL                    = $traefikEmail
  EXTERNAL_TRAEFIK               = 'true'
  TRAEFIK_DYNAMIC_DIR            = $traefikDynamicDir
  TRAEFIK_CONTAINER_NAME         = $traefikContainerName
}

} # fin if (-not $script:skipWizard)

if (-not $script:skipWizard) {
  Write-Host ''
  Write-Host '--- Generation des fichiers (PC) ---' -ForegroundColor Cyan
  Copy-StackToStaging
  Expand-StackStaging -Vars $vars -UseHttps $useHttps
  if ($useHttps) {
    Write-Host '  Traefik : HTTPS + Let''s Encrypt (auto)' -ForegroundColor DarkGray
  } else {
    Write-Host '  Traefik : HTTP seul (test LAN, pas de SSL)' -ForegroundColor DarkGray
  }
}

$toSave = @{
  SshHost = $sshHost; SshUser = $sshUser; SshKey = $sshKey
  GsmsDir = $gsmsDir; AppRoot = $appRoot; ProjectName = $projectName
  Domain = $domain; ServerIp = $serverIp; Scheme = $scheme
  CrmHost = $crmHost; DocsHost = $docsHost; MonitoringHost = $monitoringHost
  PortainerHost = $portainerHost; UptimeHost = $uptimeHost; NetdataHost = $netdataHost
  N8nHost = $n8nHost; OpenWebuiHost = $openWebuiHost
  SmtpHost = $smtpHost; SmtpPort = $smtpPort; SmtpSecure = $smtpSecure; SmtpUser = $smtpUser
  ExternalTraefik = [bool]$externalTraefik
  TraefikDynamicDir = $traefikDynamicDir
  TraefikContainerName = $traefikContainerName
}
if ($PrepareOnly -or $InfraOnly) {
  $toSave | ConvertTo-Json | Set-Content $DefaultConfigPath -Encoding UTF8
  Write-Host ('  -> Config : ' + $DefaultConfigPath) -ForegroundColor Green
} elseif (Read-YesNo 'Sauvegarder dans scripts/deploy.config.json' $false) {
  $toSave | ConvertTo-Json | Set-Content $DefaultConfigPath -Encoding UTF8
}

Write-Host ''
Write-Host '--- Fichiers prepares (PC) ---' -ForegroundColor Green
Write-Host ('  Dossier : ' + $Staging)
Write-Host '  .env, SECRETS.txt, docker-compose.yml, traefik/, homepage/, ...'
if (Test-Path (Join-Path $Staging 'SECRETS.txt')) {
  Write-Host '  Mots de passe Postgres/MinIO : scripts\.deploy-staging\SECRETS.txt' -ForegroundColor Cyan
}

if ($PrepareOnly) {
  Write-Host ''
  Write-Host '=== Preparation terminee (rien envoye au VPS) ===' -ForegroundColor Green
  Write-Host '  Etape suivante : .\scripts\2-etape-infra-vps.ps1'
  exit 0
}

Write-Host ''
Write-Host '--- Recapitulatif envoi VPS ---' -ForegroundColor Green
Write-Host "  VPS      : ${sshUser}@${sshHost}"
Write-Host "  Landing  : ${scheme}://$domain"
Write-Host "  CRM      : ${scheme}://$crmHost"
Write-Host "  Docs     : ${scheme}://$docsHost"
Write-Host "  SMTP     : $smtpUser @ $smtpHost"
if (-not $DeployNow) {
  if (-not (Read-YesNo 'Envoyer au VPS et lancer l infra maintenant' $true)) {
    Write-Host ('Fichiers prets dans : ' + $Staging)
    Write-Host '  Relancez : .\scripts\2-etape-infra-vps.ps1'
    exit 0
  }
}

Invoke-LmsDeployExecute
