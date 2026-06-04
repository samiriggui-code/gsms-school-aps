$candidatsPath = "apps\lms-crm\app\(protected)\gestion-academique\admissions\candidats"
$etudiantsPath = "apps\lms-crm\app\(protected)\gestion-academique\admissions\etudiants"

Get-ChildItem -Path $candidatsPath -Recurse -File | ForEach-Object {
    (Get-Content $_.FullName) | ForEach-Object {
        $_ -replace "Collaborateur", "Candidat" `
           -replace "collaborateur", "candidat" `
           -replace "COLLABORATEUR", "CANDIDAT"
    } | Set-Content $_.FullName
}

Get-ChildItem -Path $etudiantsPath -Recurse -File | ForEach-Object {
    (Get-Content $_.FullName) | ForEach-Object {
        $_ -replace "Collaborateur", "Etudiant" `
           -replace "collaborateur", "etudiant" `
           -replace "COLLABORATEUR", "ETUDIANT"
    } | Set-Content $_.FullName
}
