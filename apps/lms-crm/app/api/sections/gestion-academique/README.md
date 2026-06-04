# Section: gestion-academique

API vie scolaire alignées sur le **parcours candidat** :

| Route | Rôle |
|-------|------|
| `vie-scolaire/formations` | Catalogue CRM |
| `vie-scolaire/sessions` | Sessions + inscrits |
| `vie-scolaire/planning` | Calendrier sessions (6 sem.) |
| `vie-scolaire/examens` | Résultats examen (`FormationSessionParticipant`) |
| `vie-scolaire/certifications` | Attestations (`FormationAttestation`) |
| `vie-scolaire/parcours/{id}` | État du parcours + clôture / archivage |

Candidatures : `gestion-ressources/rh/candidatures` (PATCH statuts, sync lead).
