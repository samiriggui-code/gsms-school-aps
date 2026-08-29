# Sources réglementaires GSMS School

Bibliothèque de sources officielles utilisées pour construire le Funding Engine, les connecteurs financeurs et le Qualiopi Engine. Objectif : chaque règle codée dans un connecteur doit pouvoir remonter jusqu'à une source vérifiable.

```
CODE
  ↓
CONNECTOR RULE
  ↓
SPECIFICATION
  ↓
SOURCE OFFICIELLE (ce dossier)
```

## Règle absolue

Aucune capacité (API, format, authentification) n'est déclarée dans `connector-matrix/connector-capabilities.json` sans une source officielle citée dans `connector-matrix/source-registry.json`. Si une information n'est pas confirmée par une source officielle, elle est marquée `"verified": false` avec le motif — jamais supposée.

## Organisation

| Dossier | Contenu |
|---|---|
| `qualiopi/` | Référentiel national qualité, guide de lecture RNQ |
| `cpf-edof/` | Caisse des Dépôts — catalogue XML, dossiers, service fait, facturation |
| `france-travail/` | AIF, Kairos, familles d'API Kairos (Zéro saisie, Parcours Formation, Individu, Open Formation) |
| `opco/` | Norme d'échange inter-OPCO (API Convergence CFA), état d'implémentation par OPCO |
| `agefiph/` | Téléservice et extranet prestataires |
| `transitions-pro/` | Dossier PTP dématérialisé, structures régionales |
| `regions/` | PRF, LHÉO, Carif-Oref |
| `connector-matrix/` | Données structurées (JSON) dérivées de ces sources — consommées par le code |

## État de la recherche (29/08/2026)

Recherche initiale effectuée et sourcée. Trois corrections majeures aux hypothèses de départ :

1. **France Travail a des API pour les OF** (famille "API Kairos") — ce n'est pas portail-seul.
2. **Les 11 OPCO ont une norme d'échange commune** (API Convergence CFA/OPCO) — mais **uniquement pour l'apprentissage**, pas le financement classique. Implémentation inégale d'un OPCO à l'autre.
3. **AGORA** (hub CDC/DGEFP) existe mais est **fermé aux organismes de formation** par ses critères d'éligibilité.

Voir `connector-matrix/source-registry.json` pour le détail sourcé, et les README par domaine pour les nuances.

## Ce qui reste ouvert

- 7 OPCO sur 11 non vérifiés individuellement sur le volet hors-apprentissage (AFDAS et ATLAS vérifiés).
- Détail exact des API Kairos *Zéro saisie* / *Parcours Formation* / *Individu* (fiches derrière login francetravail.io — créer un compte pour les lire).
- Agefiph, Transitions Pro, Régions : absence d'API non prouvée, seulement non documentée publiquement.
