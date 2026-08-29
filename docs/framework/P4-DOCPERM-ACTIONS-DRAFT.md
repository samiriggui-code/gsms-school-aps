# P4 — DocPerm par action (read/write/create/delete) — mini-draft

> Date : 2026-08-29 · Auteur : Cursor (audit runtime) · Statut : **✅ ack Claude — C/B/A2 livrés**  
> Contexte : handoff Claude « P4 permission engine (design d’abord) ».  
> Réf. historique : `docs/framework/PERMISSION_AUDIT.md` P4 → P4′.

---

## 1. Verdict en une phrase

**Le moteur `@repo/doctype` supporte déjà DocPerm par action.** Le gap P4 n’est pas un rewrite de `PermissionEngine` — c’est (a) la doc d’audit obsolète, (b) quelques déclarations DocType encore grossières, (c) l’absence de slugs IAM `*.create` / `*.delete` hors domaine `iam.users.*`.

**Pas de changement de `@repo/doctype` requis pour clore le cœur de P4.**

---

## 2. Preuve runtime (lu ce soir)

### 2.1 Type + moteur

`DocPermission` (`packages/doctype/src/types.ts`) expose déjà `read` / `write` / `create` / `delete` (+ `submit` / `cancel` / …) et `requires.anyPermissionSlugs`.

`hasPermission` (`permission-engine.ts`) :

1. filtre `role` / `requires` ;
2. teste **l’action demandée** via `actionAllowed(perm, action)` ;
3. OR sur les règles → une règle `read` + slug A et une règle `write` + slug B fonctionnent.

`protectRoute` (G1-E) mappe `GET→read`, `POST→create`, `PATCH→write`, `DELETE→delete` puis appelle `hasPermission` — **plus de slug unique par verbe HTTP hors DocMeta**.

### 2.2 Inventaire CRM (bootstrap réel, 30 DocTypes)

| Pattern | Count | Exemples |
|---|---|---|
| **SPLIT** view ≠ mutate | **29** | `SubcontractorRecord` : `governance.conformite.view` (read) vs `crm.ressources.edit` (create/write/delete) ; `FundingCase` : `crm.finance.view` / `crm.finance.edit` ; `User` : `iam.users.view` / `create` / `edit` / `delete` |
| **SAME** read = mutate | **1** | `SystemLog` : `iam.logs.view` pour read **et** create/write/delete |

Donc la « distinction fine peut lire mais pas écrire » est **déjà la norme** sur le registre, pas l’exception.

### 2.3 Ce que le type déclare mais le moteur n’applique pas encore

| Champ | Statut | Note |
|---|---|---|
| `permlevel` | partiellement | `effectivePermissions` / `buildMetaResponse` filtrent les champs ; hors scope P4 (c’est P5) |
| `condition` / `ifOwner` | **non lus** par `hasPermission` | = **P6** row-level — ne pas mélanger avec P4 |
| `submit` / `cancel` / … | supportés si déclarés | peu utilisés dans les DocTypes OF ce soir |

---

## 3. Relecture de `PERMISSION_AUDIT.md` P4

Le finding P4 (« Pas de DocPerm… Seulement 4 verbes HTTP → 1 slug ») décrit l’ère `ENTITY_REGISTRY`. Post G1-E :

- P1–P3 : résolus (une seule source DocMeta) ;
- P4 tel qu’écrit : **faux** pour le moteur et pour 29/30 déclarations.

Proposition (quand Claude voudra) : remplacer P4 dans l’audit par un finding actualisé du type :

> P4′ — Granularité IAM : hors `iam.users.*`, le catalogue CRM n’offre en général que `.view` / `.edit`, donc create/write/delete restent bundlés derrière `.edit` même si le moteur sait les séparer.

---

## 4. Candidats métier (2–3) — **déclarations seulement**, pas de touch engine

Critère : valeur métier réelle + slugs **déjà** dans `crm-permissions.ts` / `permission-domains.ts`, ou petit ajout IAM explicite si Claude l’ack.

### Candidat A — `SubcontractorRecord` (déjà bon, raffinement optionnel)

**Aujourd’hui :** read = `governance.conformite.view` ; create/write/delete = `crm.ressources.edit`.

- Un rôle « lecteur conformité » (view only) **ne peut déjà pas** valider / créer — gap « lire sans écrire » **déjà couvert**.
- Raffinement utile **si** on veut « RH crée la fiche mais seul Qualité valide le statut » :
  - **Option A1 (sans nouveau slug)** : `create` → `crm.ressources.edit` ; `write` (transitions statut) → exiger **aussi** `governance.conformite.view` via `allPermissionSlugs` — imparfait (pas un vrai « validate »).
  - **Option A2 (propre, ack IAM)** : ajouter `governance.conformite.edit` ; mapper `write` (et éventuellement `create`) dessus ; garder `delete` sur `crm.ressources.edit` ou `crm.securite.edit`.

**Recommandation Cursor :** ne pas coder A2 sans ack Claude (nouveau slug catalogue + seed rôles). A1 est un bricolage — plutôt attendre A2 ou laisser tel quel.

### Candidat B — `FundingCase` / `FundingDocument`

**Aujourd’hui :** `crm.finance.view` / `crm.finance.edit` (create+write+delete bundlés).

- Distinction lire vs écrire : **déjà OK**.
- Raffinement utile : **interdiction delete** pour un gestionnaire finance courant (soft-cancel via transition `CANCELLED` déjà en place) — `delete: true` seulement avec un slug plus fort (`crm.securite.edit` ou futur `crm.finance.delete`).
- Alternative sans nouveau slug : retirer `delete` de la règle `finance.edit` (fail-closed delete) et n’autoriser que cancel métier.

**Recommandation Cursor :** meilleur ROI P4 « fin » ce soir / demain — **retirer ou restreindre `delete`** sur FundingCase sans toucher le moteur.

### Candidat C — `SystemLog` (seul SAME slug)

**Aujourd’hui :** mutate sous `iam.logs.view` — incohérent (un lecteur de journaux ne devrait pas DELETE des logs).

Proposition déclaration :

- `read` → `iam.logs.view`
- `create` → garder `iam.logs.view` **ou** chemin système only (ResourceService / audit writers) — souvent les logs ne passent pas par l’API CRUD publique
- `write` / `delete` → **ne pas déclarer** (ou `crm.securite.edit` si purge admin explicitement voulue)

**Recommandation Cursor :** fix declaration-only, faible risque, bon signal P4.

### Hors candidates pour l’instant

- `ComplianceDossierItem` : déjà view/edit ; alignement read sur `governance.conformite.view` (comme `ComplianceDossier`) serait une **cohérence catalogue**, pas un nouveau modèle de droits.
- `LmsCourse` : déjà plus fin (`lms.content.draft` vs `lms.catalog.manage`) — pas prioritaire.
- `User` : **référence or** create/edit/delete séparés — pattern à recopier si on étend le catalogue IAM CRM.

---

## 5. Ce qu’on ne fait **pas** dans ce chantier

- Pas de modification de `permission-engine.ts` pour P4.
- Pas de P5 (permlevel champ) ni P6 (`condition` / `ifOwner`) sous couvert de P4.
- Pas de passage des 30 DocTypes en revue create≠delete d’un coup.
- Pas de nouveaux slugs IAM sans ack Claude + seed rôles.

---

## 6. Décisions demandées à Claude

1. **Ack verdict** : P4 moteur = déjà OK ; suite = déclarations (+ IAM optionnel) ?
2. **Priorité d’implémentation** (après ack) : C (`SystemLog`) → B (FundingCase delete) → A2 (slug `governance.conformite.edit`) ?
3. Faut-il **mettre à jour** `PERMISSION_AUDIT.md` P4 → P4′ dans le même lot docs ?

En attente de ces trois points avant tout code.

---

## 7. Livré après ack (29/08)

| Item | Changement |
|---|---|
| C SystemLog | DocType : `read` seul sous `iam.logs.view` (plus de create/write/delete) |
| B FundingCase | `create`/`write` → `crm.finance.edit` ; `delete` → `crm.securite.edit` |
| A2 SubcontractorRecord | `read` → conformite.view ; `create`/`delete` → ressources.edit ; `write` → **conformite.edit** |
| IAM | slug `governance.conformite.edit` + seed **admin** + **collaborateur** |
| API RH | GET conformite.view · POST ressources.edit · PATCH conformite.edit |
| Doctrine | `PERMISSION_AUDIT.md` P4 → P4′ |
