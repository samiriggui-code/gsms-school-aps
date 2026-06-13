# Gestion administrative — legacy Metronic

Composants hérités du template Metronic (e-commerce / customer profile) **non branchés** aux pages CRM actuelles.

## Conservé en production

- **Profil** : `profil-settings.tsx`, `profil-stats.tsx`, `profil-details-overviews.tsx`
- **Structure** : `structure-page-shell.tsx`, organigramme, effectifs, stats
- **Documents** : `documents-list.tsx`, `dossier-slot-sheet.tsx`, stats

## Contenu de ce dossier

- Fiches sheet/list Metronic (`profil-list`, `*-details-billing`, `*-details-orders`, etc.)
- Hooks `use-subcontractor-select-query` pointant vers l’API stub `partenaires/prestataires`
- `documents-add-sheet` (POST `rh/documents` non utilisé par la page documents)

Ne pas réimporter ces fichiers dans de nouvelles pages.
