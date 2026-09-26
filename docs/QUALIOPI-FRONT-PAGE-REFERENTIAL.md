# Qualiopi — référentiel front (page → indicateurs)

**Outil vivant :** `/qualiopi/referentiel/cartographie-front`  
**Source TS :** `apps/lms-crm/lib/of/qualiopi-page-referential.ts`  
**UI stub :** `components/crm/qualiopi-dev-stub-page.tsx` + `QualiopiPageBrief`

## Principe

Chaque page CRM a un **rôle** :

| Rôle | Signification |
|------|----------------|
| `writer` | Produit la preuve métier (à brancher sur Prisma / Evidence) |
| `reader` | Lit / évalue (passeport, classeur, couverture) |
| `hub` | Landing — agrège, ne produit pas |
| `support` | Contribution indirecte |
| `na` | Hors RNQ |

Breadcrumbs = `MENU_SIDEBAR` (header).  
Contenu Qualiopi attendu = panneau `QualiopiPageBrief`.

## Comment développer une feuille

1. Ouvrir la cartographie ou l’entrée path dans le TS.  
2. Implémenter le métier pour que `mustFind` soit vrai.  
3. Créer Evidence + `EvidenceIndicatorLink` vers les `indicators`.  
4. Remplacer le stub `QualiopiDevStubPage` par la vraie UI (garder le brief en bandeau optionnel).  
5. Vérifier `relatedPaths` (amont/aval).

## Stubs créés (contenu métier vide)

- `/qualiopi/pilotage/veille` — I23–25  
- `/qualiopi/pilotage/amelioration` — I32  
- `/gestion-ressources/compagnie/conseil-perfectionnement` — I20  
- `/gestion-ressources/rh/competences` — I21  
- `/gestion-ressources/rh/developpement` — I22  
- `/gestion-ressources/partenaires/reseau-handicap` — I26  
- `/gestion-ressources/partenaires/pfst` — I28  
- `/gestion-academique/vie-scolaire/alternance` — I13–15  
- `/gestion-academique/vie-scolaire/insertion` — I29  

Menu + `crm-sitemap` mis à jour pour breadcrumbs.

## Backend déjà prêt

Prisma métier Qualiopi + moteur Q1 (6 règles) + Evidence — le front writer doit **écrire** dans ces modèles ; le reader Qualiopi **lit**.

Voir aussi : `docs/QUALIOPI-PRISMA-MAPPING.md`, `docs/QUALIOPI-Q0-CAPABILITY-MATRIX.md`.
