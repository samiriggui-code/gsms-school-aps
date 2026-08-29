# Téléchargements officiels (checklist)

Statuts : `OK` = présent dans le repo · `TODO` = à récupérer · `LINK` = page index seulement · `MANUAL` = téléchargement navigateur (CLI bloqué).

## Qualiopi (ministère)

| Fichier cible | URL | Statut |
|---------------|-----|--------|
| Page RNQ / Guide | https://travail-emploi.gouv.fr/referentiel-national-qualite-guide-de-lecture-qualiopi | LINK |
| Guide lecture V9 (08/01/2024) | https://travail-emploi.gouv.fr/sites/travail-emploi/files/files-spip/pdf/guide_de_lecture_qualiopi_v9_du_8_janvier_2024.pdf | **MANUAL** — voir `qualiopi/guide-lecture-rnq/README.md` |

## CPF / EDOF (Caisse des Dépôts)

Index : https://of.moncompteformation.gouv.fr/espace-public/ressources/guides

| Fichier cible | URL officielle | Dossier local | Statut |
|---------------|----------------|---------------|--------|
| **kit_XML_062026.zip** (12/06/2026) | …/2026-06/kit_XML_062026.zip | `cpf-edof/xml/kit-xml-2026/` | **OK** |
| XSD + exemple XML (extrait kit) | — | `xml/schemas/` · `xml/examples/` | **OK** |
| Spécifications import XML (PDF kit) | dans le zip | `xml/specifications/` | **OK** |
| Guide import XML (04/2026) | …/Guide_EDOF_Import_catalogue_fichier_XML_042026.pdf | `xml/specifications/` | **OK** |
| Créer offre CPF | …/Guide_EDOF_Creer_et_gerer_une_offre_eligible_au_CPF.pdf | `formation/` | **OK** |
| Créer action | …/Guide_EDOF_Creer_et_gerer_une_action_…pdf | `action/` | **OK** |
| Créer session | …/Guide_EDOF_Creer_et_gerer_une_session_…pdf | `session/` | **OK** |
| Demande inscription | …/Guide_EDOF_Dossier_Gerer_une_demande_d_inscription.pdf | `dossiers/` | **OK** |
| Entrée → service fait | …/entrée…DSF.pdf | `service-fait/` | **OK** |
| Facturation / règlements | …/Guide_EDOF_Facturation-et-reglements_092023.pdf | `facturation/` | **OK** |
| Abondement France Travail | …/Gerer_un_dossier_avec_abondement_France_Travail.pdf | `france-travail-abondement/` | **OK** |

## France Travail / KAIROS (hors abondement EDOF)

| Ressource | URL | Statut |
|-----------|-----|--------|
| Présentation KAIROS | https://actuformation.francetravail.org/sujets/presentation-applicatif-kairos/ | LINK — `france-travail/kairos/` |
| AIF (candidat) | https://www.francetravail.fr/candidat/en-formation/mes-aides-financieres/laide-individuelle-a-la-formatio.html | LINK — `france-travail/aif/` |
| Doc API éditeur | — | **TODO** — ne pas marquer API=true |

## OPCO

Cadre général : section OPCO ministère du Travail (acteurs formation pro).  
Par OPCO : remplir `opco/<slug>/README.md` + fiche technique (checklist API/portail).

## Agefiph

| Ressource | URL |
|-----------|-----|
| Formation / conseils | https://www.agefiph.fr/conseils-pratiques/des-aides-et-des-conseils-pour-acceder-la-formation |
| Aides financières | https://www.agefiph.fr/aides-financieres |
| Adaptation situations de formation | https://www.agefiph.fr/aides-financieres/aide-ladaptation-des-situations-de-formation |
