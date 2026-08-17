function Get-OrDefault([string]$Value, [string]$Default) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return $Default }
  return $Value
}

function ConvertTo-UrlEncoded([string]$Value) {
  if ([string]::IsNullOrEmpty($Value)) { return '' }
  return [System.Uri]::EscapeDataString($Value)
}

function New-RandomSecret([int]$Bytes = 32) {
  $buf = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
  $b64 = [Convert]::ToBase64String($buf) -replace '\+', '-' -replace '/', '_' -replace '=', ''
  $len = [Math]::Min(43, $b64.Length)
  return $b64.Substring(0, $len)
}

function Set-EnvLine {
  param(
    [System.Collections.Generic.List[string]]$Lines,
    [string]$Key,
    [string]$Value
  )
  $pattern = '^\s*' + [regex]::Escape($Key) + '='
  $replaced = $false
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    if ($Lines[$i] -match $pattern) {
      $Lines[$i] = '{0}={1}' -f $Key, $Value
      $replaced = $true
      break
    }
  }
  if (-not $replaced) {
    [void]$Lines.Add(('{0}={1}' -f $Key, $Value))
  }
}

function Read-SecretInput {
  param([string]$Label, [string]$Default = '')
  if ($Default) {
    $use = Read-YesNo ('{0} - garder la valeur existante ?' -f $Label) $true
    if ($use) { return $Default }
  }
  $secure = Read-Host $Label -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Build-DeployEnvFile {
  param(
    [string]$ExamplePath,
    [string]$OutputPath,
    [hashtable]$Vars
  )
  if (-not (Test-Path $ExamplePath)) {
    throw ('Template introuvable: {0}' -f $ExamplePath)
  }
  $lines = New-Object 'System.Collections.Generic.List[string]'
  foreach ($line in Get-Content $ExamplePath -Encoding UTF8) {
    [void]$lines.Add($line)
  }
  foreach ($key in $Vars.Keys) {
    Set-EnvLine -Lines $lines -Key $key -Value ([string]$Vars[$key])
  }
  $dir = Split-Path $OutputPath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllLines($OutputPath, $lines, (New-Object System.Text.UTF8Encoding $false))
}

function Read-EnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path $Path)) { return '' }
  $pattern = '^\s*' + [regex]::Escape($Key) + '=(.*)$'
  foreach ($line in Get-Content $Path -Encoding UTF8) {
    if ($line -match $pattern) {
      return $Matches[1].Trim()
    }
  }
  return ''
}

function Invoke-EnvWizard {
  param(
    [string]$ExamplePath,
    [string]$OutputPath
  )

  Write-Title 'Configuration .env production'

  $existing = @{}
  if (Test-Path $OutputPath) {
    Write-Warn ('Fichier existant: {0}' -f $OutputPath)
    if (-not (Read-YesNo 'Reutiliser et ne modifier que les champs demandes ?' $true)) {
      $OutputPath = Read-InputDefault 'Chemin du nouveau .env' $OutputPath
    }
    foreach ($key in @(
        'DOMAIN', 'SERVER_IP', 'POSTGRES_PASSWORD', 'MINIO_ROOT_PASSWORD',
        'NEXTAUTH_SECRET', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'
      )) {
      $existing[$key] = Read-EnvValue $OutputPath $key
    }
  }

  $domain = Read-InputDefault 'Domaine principal (sans https)' (Get-OrDefault $existing.DOMAIN 'hosting-global-it-ss.com')
  $serverIp = Read-InputDefault 'IP du VPS' (Get-OrDefault $existing.SERVER_IP '187.77.166.124')
  $monitoring = Read-InputDefault 'Sous-domaine monitoring' ('monitoring.{0}' -f $domain)
  $baseUrl = 'https://{0}' -f $domain

  $pgPass = Read-SecretInput 'Mot de passe PostgreSQL' (Get-OrDefault $existing.POSTGRES_PASSWORD '')
  if ([string]::IsNullOrWhiteSpace($pgPass)) { throw 'Mot de passe PostgreSQL obligatoire.' }
  $pgEncoded = ConvertTo-UrlEncoded $pgPass

  $minioDefault = Get-OrDefault $existing.MINIO_ROOT_PASSWORD $pgPass
  $minioPass = Read-SecretInput 'Mot de passe MinIO (stockage fichiers)' $minioDefault
  if ([string]::IsNullOrWhiteSpace($minioPass)) { $minioPass = $pgPass }

  $authSecret = Read-EnvValue $OutputPath 'NEXTAUTH_SECRET'
  if ([string]::IsNullOrWhiteSpace($authSecret) -or $authSecret -eq 'change_me') {
    $gen = Read-YesNo 'Generer NEXTAUTH_SECRET aleatoirement ?' $true
    $authSecret = if ($gen) { New-RandomSecret } else { Read-Host 'NEXTAUTH_SECRET' }
  }

  $smtpUser = Read-InputDefault 'SMTP_USER (email expediteur)' (Get-OrDefault $existing.SMTP_USER 'admin@gsms-security.com')
  $smtpPass = Read-SecretInput 'SMTP_PASS' (Get-OrDefault $existing.SMTP_PASS '')
  $smtpFrom = Read-InputDefault 'SMTP_FROM' (Get-OrDefault $existing.SMTP_FROM $smtpUser)

  $n8nDefault = Get-OrDefault (Read-EnvValue $OutputPath 'N8N_PUBLIC_URL') 'https://n8n-k2pw.srv1722028.hstgr.cloud'
  $n8nPublic = Read-InputDefault 'N8N_PUBLIC_URL (instance n8n)' $n8nDefault
  $n8nApiKey = Read-EnvValue $OutputPath 'N8N_API_KEY'
  if ([string]::IsNullOrWhiteSpace($n8nApiKey)) {
    Write-Warn 'N8N_API_KEY absent — les workflows seront provisionnes au prochain deploy si vous ajoutez la cle API n8n.'
    $n8nApiKey = ''
  } else {
    $keepKey = Read-YesNo 'Garder N8N_API_KEY existante ?' $true
    if (-not $keepKey) {
      $n8nApiKey = Read-Host 'N8N_API_KEY (Settings n8n → API)'
    }
  }

  $dbUrl = 'postgresql://lms:{0}@postgres:5432/lms_app' -f $pgEncoded

  $vars = @{
    DOMAIN                    = $domain
    CRM_HOST                  = $domain
    MONITORING_HOST           = $monitoring
    SERVER_IP                 = $serverIp
    HOMEPAGE_ALLOWED_HOSTS    = ('{0},{1},localhost' -f $monitoring, $serverIp)
    POSTGRES_USER             = 'lms'
    POSTGRES_PASSWORD         = $pgPass
    POSTGRES_PASSWORD_ENCODED = $pgEncoded
    POSTGRES_DB               = 'lms_app'
    DATABASE_URL              = $dbUrl
    DIRECT_URL                = $dbUrl
    MINIO_ROOT_USER           = 'lms'
    MINIO_ROOT_PASSWORD       = $minioPass
    STORAGE_ACCESS_KEY_ID     = 'lms'
    STORAGE_SECRET_ACCESS_KEY = $minioPass
    STORAGE_CDN_URL           = ('{0}/api/public/storage' -f $baseUrl)
    NEXTAUTH_URL              = $baseUrl
    NEXTAUTH_SECRET           = $authSecret
    AUTH_SECRET               = $authSecret
    NEXT_PUBLIC_SITE_URL      = $baseUrl
    NEXT_PUBLIC_CRM_URL       = $baseUrl
    NEXT_PUBLIC_LANDING_URL   = $baseUrl
    SMTP_USER                 = $smtpUser
    SMTP_PASS                 = $smtpPass
    SMTP_FROM                 = $smtpFrom
    CONTACT_TO_EMAIL          = $smtpFrom
    N8N_PUBLIC_URL            = $n8nPublic.TrimEnd('/')
    N8N_API_URL               = $n8nPublic.TrimEnd('/')
    N8N_WEBHOOK_STANDARD_URL  = ('{0}/webhook/gsms/standard' -f $n8nPublic.TrimEnd('/'))
    WORKFLOWS_N8N_STANDARD_ENABLED = 'true'
  }
  if ($n8nApiKey) {
    $vars['N8N_API_KEY'] = $n8nApiKey
  }

  Build-DeployEnvFile -ExamplePath $ExamplePath -OutputPath $OutputPath -Vars $vars
  Write-Ok ('.env ecrit: {0}' -f $OutputPath)
  return $OutputPath
}
