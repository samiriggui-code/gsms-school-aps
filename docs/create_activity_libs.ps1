function Create-ActivityLib($name, $pascal) {
    $path = "c:\laragon\www\lms\apps\lms-crm\lib\$name-activity.ts"
    $upper = $pascal.ToUpper()
    $content = @"
export const $($upper)_ACTIVITY_EVENT = '$name.activity';

/**
 * Construit le nom de canal activite $name.
 */
export function get$($pascal)ActivityChannel(
  tenantId: string,
  $($name)Id: string,
) {
  const safeTenantId = String(tenantId || 'solo');
  const safe$($pascal)Id = String($($name)Id || 'unknown');
  return ``tenant.\${safeTenantId}.$name.\${safe$($pascal)Id}.activity``;
}
"@
    # Use standard string for content to avoid PowerShell expansion issues with ${}
    $content = $content.Replace("``", "`") # Restore backticks if I used them for escaping
    
    # Actually just write it manually to be safe with backticks and variables
    $finalContent = "export const $($upper)_ACTIVITY_EVENT = '$name.activity';`n`n"
    $finalContent += "/**`n * Construit le nom de canal activite $name.`n */`n"
    $finalContent += "export function get$($pascal)ActivityChannel(`n  tenantId: string,`n  $($name)Id: string,`n) {`n"
    $finalContent += "  const safeTenantId = String(tenantId || 'solo');`n"
    $finalContent += "  const safe$($pascal)Id = String($($name)Id || 'unknown');`n"
    $finalContent += "  return ``tenant.`${safeTenantId}.$name.`${safe$($pascal)Id}.activity``;`n}"
    
    # Fix the template literal syntax which gets mangled in PS here
    $finalContent = "export const " + $upper + "_ACTIVITY_EVENT = '" + $name + ".activity';`n`n" +
                    "export function get" + $pascal + "ActivityChannel(tenantId: string, itemId: string) {`n" +
                    "  const safeTenantId = String(tenantId || 'solo');`n" +
                    "  const safeItemId = String(itemId || 'unknown');`n" +
                    "  return \`tenant.\${safeTenantId}." + $name + ".\${safeItemId}.activity\`;`n}"

    $finalContent | Set-Content $path -NoNewline
}

Create-ActivityLib "formation" "Formation"
Create-ActivityLib "candidat" "Candidat"
Create-ActivityLib "etudiant" "Etudiant"
Create-ActivityLib "session-pedagogique" "SessionPedagogique"
Create-ActivityLib "session-inscription" "SessionInscription"
Create-ActivityLib "statut-administratif" "StatutAdministratif"
Create-ActivityLib "examen" "Examen"
Create-ActivityLib "planning" "Planning"
Create-ActivityLib "certification" "Certification"
