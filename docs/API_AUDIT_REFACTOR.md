# Audit API - Refactor structure section/module/page

> **Document actif :** voir [`CAHIER-DE-ROUTE-APIS-LMS.md`](./CAHIER-DE-ROUTE-APIS-LMS.md) (plan P0–P2, topbar notifications/chat, landing, auth). Ce fichier conserve l’historique de l’audit initial.

## Contexte

Objectif: remettre de l'ordre dans l'API du monorepo LMS, aligner les dossiers avec l'arborescence fonctionnelle (section -> module -> page), isoler les APIs communes, et preparer une base robuste pour CRM, Landing, Docs et futurs workers.

## Etat actuel (constate)

- Les routes API actives sont uniquement dans `apps/lms-crm/app/api` (27 routes detectees).
- `apps/lms-landing` et `apps/lms-docs` n'exposent pas de routes `app/api`.
- Les domaines actuellement en place cote CRM:
  - `auth/*`
  - `user-management/*`
  - `dashboard/stats`
  - `health`
- Le dossier `gestion-ressources` consomme encore de nombreux endpoints legacy:
  - `/api/B-gestion-ressources/*`
  - `/api/I-administration-facturation/*`
  - `/api/D-gestion-sites-clients/*`
  - liens legacy `/A-pilotage-supervision/*`
- Aucune route `app/api` correspondante n'a ete trouvee pour les prefixes `A/B/D/I` dans l'etat actuel.

## Points de risque

1. **Risque runtime eleve (404/API KO)**  
   Les composants front appellent des endpoints legacy non presents dans l'API actuelle.

2. **Dette structurelle**  
   Coexistence de deux modeles:
   - nouveau modele section/module/page (partiel)
   - ancien modele GSMS multi-tenant (encore tres present)

3. **Nommage heterogene**  
   Melange de conventions metier modernes et de prefixes alphabetiques historiques (`A/B/D/I`).

4. **Ambiguite mono-entreprise vs multi-tenant**  
   Presence residuelle de notions `tenant*` dans une application ciblee solo-client.

## Cible d'architecture recommandee

## 1) Routes Next (par application)

Garder les route handlers dans chaque application (contrainte Next.js):

- `apps/lms-crm/app/api/...`
- `apps/lms-landing/app/api/...` (si necessaire plus tard)
- `apps/lms-docs/app/api/...` (si necessaire plus tard)

### Arborescence cible CRM

```txt
apps/lms-crm/app/api/
  _shared/
    http/
    auth/
    errors/
    pagination/
    validation/
  sections/
    securite-configuration/
      acces/
        users/
        roles/
        permissions/
        logs/
      parametres/
        settings/
    gestion-ressources/
      rh/
        collaborateurs/
        absences/
        equipes/
      compagnie/
        profil/
        structure/
        documents/
    administration-facturation/
      ...
  common/
    stats/
    health/
  auth/
    [...nextauth]/
    signup/
    reset-password/
```

## 2) Logique metier mutualisee (monorepo)

Sortir la logique commune hors handlers dans `packages`:

```txt
packages/
  api-core/
    src/
      contracts/
      schemas/
      services/
      adapters/
  workers/
    src/
      queues/
      jobs/
      processors/
      schedulers/
```

- `api-core`: DTO, validation, services partages.
- `workers`: traitements asynchrones lourds (exports, agregations, notifications, sync).

## 3) Convention URL cible

- Eviter les prefixes legacy `A/B/D/I`.
- Favoriser:
  - `/api/sections/<section>/<module>/<page>/<resource>`
  - `/api/common/<service>`

## Plan de transformation (pragmatique)

### Phase 1 - Stabilisation immediate

- Creer une table de mapping `legacy -> cible`:
  - `/api/B-gestion-ressources/*` -> `/api/sections/gestion-ressources/*`
  - `/api/I-administration-facturation/*` -> `/api/sections/administration-facturation/*`
  - `/api/D-gestion-sites-clients/*` -> route cible metier (a definir par module)
- Ajouter des routes shim temporaires de compatibilite pour eviter les regressions.
- Nettoyer les liens `/A-pilotage-supervision/*` restants.

### Phase 2 - Structuration API

- Introduire `sections/*`, `common/*`, `_shared/*`.
- Deplacer progressivement les handlers existants vers cette structure.
- Garder les anciennes URLs via shims le temps de la migration front.

### Phase 3 - Mutualisation packages

- Extraire la logique repetee des route handlers vers `packages/api-core`.
- Conserver dans `app/api` des handlers minces (auth/check/parse/response).

### Phase 4 - Workers

- Creer `packages/workers`.
- Deporter les calculs/exports/process lourds hors requetes synchrones.

## Priorites d'execution

1. Corriger les endpoints legacy utilises par `gestion-ressources` (impact runtime direct).
2. Installer la nouvelle structure `sections/*` + shims.
3. Extraire les services communs vers `packages/api-core`.
4. Ajouter `packages/workers` pour les traitements asynchrones.

## Benefices attendus

- Moins de 404 et de comportements incoherents.
- API lisible, previsible, scalable.
- Reduction des doublons et de la confusion entre modules.
- Meilleure maintenance multi-apps (CRM, Landing, Docs).
- Base solide pour performance/charge via workers.

## Decision recommandee

Valider une migration en 2 temps:

1. **Compatibilite immediate** (shims + nettoyage des liens legacy)  
2. **Refactor structurel** (sections/common/shared + packages api-core/workers)

Cette approche limite le risque produit tout en accelerant la remise a niveau.

## Avancement reel (mise en oeuvre)

### Termine

- Structure initiale creee:
  - `apps/lms-crm/app/api/_shared/*`
  - `apps/lms-crm/app/api/sections/*`
  - `apps/lms-crm/app/api/common/*`
  - `packages/api-core/*`
  - `packages/workers/*`
- Shims de compatibilite legacy actifs:
  - `/api/B-gestion-ressources/[...path]`
  - `/api/I-administration-facturation/[...path]`
  - `/api/D-gestion-sites-clients/[...path]`
- Routes sectionnelles proxies ajoutees:
  - `/api/sections/gestion-ressources/[...path]`
  - `/api/sections/administration-facturation/[...path]`
  - `/api/sections/gestion-sites-clients/[...path]`
  - `/api/sections/securite-configuration/acces/[...path]`
  - `/api/sections/securite-configuration/parametres/[...path]`
- Routes communes ajoutees:
  - `/api/common/stats` (proxy vers `dashboard/stats`)
  - `/api/common/health` (proxy vers `health`)
- Premier rebranchement front vers nouveaux namespaces:
  - `use-dashboard-stats-generic` bascule sur `common/stats` et `sections/gestion-ressources/stats`.

### En cours

- Nettoyage des derniers liens UI legacy (`/A-*`, `/B-*`, `/I-*`, `/D-*`) hors proxies techniques.
- Migration des consommateurs de `user-management/*` vers `sections/securite-configuration/*`.
- Remplacement des liens UI legacy GSMS.
- Reliquat principal identifie: composants `demo/*` et `components/common/*` (contenu historique non critique).

### Regle projet confirmee (ne pas supprimer)

- `app/(protected)/demo/*` est conserve comme base de reference Metronic pour accelerer le developpement des prochains modules.
- `components/common/*` est conserve comme bibliotheque de composants/patterns reutilisables.
- Ces deux zones ne sont pas une cible de suppression brute; elles sont traitees en mode "reference + extraction progressive".
- Priorite nettoyage: seulement les modules metier actifs et routes production utilisees.

## Catalogue de reference UI (demo + common)

Objectif: accelerer les futurs modules en reutilisant des patterns existants au lieu de repartir de zero.

### Bibliotheque commune a privilegier

- `components/common/container.tsx` + `components/common/toolbar.tsx`: structure standard de page (header, actions, densite uniforme).
- `components/common/menu-card.tsx` + `components/common/menu-cards-section.tsx`: cartes de navigation section/module.
- `components/common/stats-card.tsx`: cartes KPI reutilisables (2 a 6 colonnes).
- `components/common/security-highlights.tsx`: bloc "indicateurs et tendances" pret pour dashboards.
- `components/common/page-header.tsx`: fallback pour pages qui n'utilisent pas encore `toolbar`.

### Demos les plus utiles pour prochains modules

- `app/(protected)/demo/pilotage-supervision/*`:
  - pattern dashboard + pages filles + welcome callout;
  - utile pour supervision, analytics, rapports, risques.
- `app/(protected)/demo/support-assistance/*`:
  - pattern module multi-pages (menu cards, sous-pages, callouts);
  - utile pour centres d'aide, tickets, documentation.
- `app/(protected)/demo/companies/*` et `demo/company/*`:
  - pattern fiche detail, tabs/records, activites/fichiers;
  - utile pour pages "detail entite" (client, partenaire, site).
- `app/(protected)/demo/contacts/*`:
  - pattern liste + page-header + sheet creation;
  - utile pour referentiels (contacts, intervenants, formateurs).
- `app/(protected)/demo/tasks/*`, `demo/today/*`, `demo/upcoming/*`, `demo/completed/*`, `demo/priority/*`:
  - pattern board/list + stats + suivi d'etat;
  - utile pour workflow operationnel et planification.

### Strategie d'usage recommandee

1. Copier d'abord la structure visuelle (header, cards, table/list, sheet), sans couplage API legacy.
2. Brancher ensuite les endpoints cibles `api/sections/*` ou `api/common/*`.
3. Extraire les morceaux stables vers `components/common/*` quand un pattern est reutilise >= 2 fois.
4. Laisser les pages demo intactes comme "catalogue vivant" de reference.

### Avancement concret au 26/04

- `gestion-ressources/rh/collaborateurs`: appels API legacy nettoyes vers `sections/gestion-ressources/*`.
- `gestion-ressources/rh/equipes`: appels API legacy nettoyes vers `sections/gestion-ressources/*` + `sections/gestion-sites-clients/*`.
- `gestion-ressources/rh/absences`: appels API legacy nettoyes vers `sections/gestion-ressources/*`.
- `gestion-ressources/rh/components`: appels API legacy nettoyes vers `sections/*`.
- `gestion-ressources/compagnie/*` (profil, structure, documents, components, hooks): appels API legacy nettoyes vers `sections/*`.
- `demo/pilotage-supervision` et composants communs stats: migration `A-pilotage-supervision` vers `common/stats`.
- `app/api/sections/gestion-ressources/[...path]`: proxy legacy retire, remplace par un handler sectionnel natif (mapping RH prioritaire + fallbacks de transition).
- `app/api/sections/administration-facturation/[...path]`: proxy legacy retire, remplace par un handler sectionnel natif.
- `app/api/sections/gestion-sites-clients/[...path]`: proxy legacy retire, remplace par un handler sectionnel natif.
- Routes legacy supprimees:
  - `app/api/B-gestion-ressources/[...path]/route.ts`
  - `app/api/I-administration-facturation/[...path]/route.ts`
  - `app/api/D-gestion-sites-clients/[...path]/route.ts`
- `lib/api.ts`: suppression du remapping legacy `B/I/D -> sections/*` (mode sectionnel natif uniquement).
- Dossier de base de securite deplace:
  - `app/api/user-management/*` -> `app/api/sections/securite-configuration/acces/*`
  - suppression du dossier racine `app/api/user-management`
  - suppression du proxy catch-all `app/api/sections/securite-configuration/acces/[...path]/route.ts` (routes natives directes)
- Structuration module-par-module en cours (gestion-ressources / RH):
  - `app/api/sections/gestion-ressources/rh/collaborateurs/[[...path]]/route.ts`
  - `app/api/sections/gestion-ressources/rh/absences/[[...path]]/route.ts`
  - `app/api/sections/gestion-ressources/rh/equipes/[[...path]]/route.ts`

### A faire ensuite

1. Remplacer les routes proxy par des handlers metier natifs dans `sections/*`.
2. Extraire services/schemas communs vers `packages/api-core`.
3. Introduire les workers pour les traitements lourds (exports, agregations, notifications).
