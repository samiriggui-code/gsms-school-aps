$basePath = "apps\lms-crm\app\(protected)\gestion-academique"
$files = Get-ChildItem -Path $basePath -Recurse -Include "*.tsx","*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $changed = $false

    # Search for imports like '../hooks/use-Formation-select-query' or './hooks/use-Candidat-history'
    # and lowercase the filename part
    
    $regex = "from\s+['\"](\.\.?\/.*?\/)(use-)([A-Z])(.*?)(['\"])"
    
    if ($content -match $regex) {
        $content = [regex]::Replace($content, $regex, {
            param($m)
            $path = $m.Groups[1].Value
            $prefix = $m.Groups[2].Value
            $upper = $m.Groups[3].Value.ToLower()
            $rest = $m.Groups[4].Value
            $quote = $m.Groups[5].Value
            "from " + $m.Groups[5].Value + $path + $prefix + $upper + $rest + $quote
        })
        # Wait, the regex logic above for replacement is slightly flawed in how it rebuilds the string
        # Let's use a simpler one-by-one replacement for the known modules
    }

    $modules = @("Formation", "Candidat", "Etudiant", "Examen", "Planning", "Certification", "SessionPedagogique", "SessionInscription", "StatutAdministratif")
    
    foreach ($mod in $modules) {
        $pattern = "use-$mod-"
        $replacement = "use-$($mod.ToLower())-"
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $changed = $true
        }
    }

    if ($changed) {
        $content | Set-Content $file.FullName
        Write-Host "Fixed casing in $($file.FullName)"
    }
}
