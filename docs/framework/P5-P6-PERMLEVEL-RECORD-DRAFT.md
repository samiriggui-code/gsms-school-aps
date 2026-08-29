# P5 / P6 — permlevel & record permission — mini-draft

> Date : 2026-08-29 · Auteur : Cursor · Statut : **✅ ack Claude — Option A (pas de code moteur)**  
> Contexte : handoff Claude après P4 — « design d’abord, comme P4 ».  
> Format aligné sur [`P4-DOCPERM-ACTIONS-DRAFT.md`](./P4-DOCPERM-ACTIONS-DRAFT.md).

---

## 1. Verdict en une phrase

**P6 a un besoin métier réel (formateur ↔ ses sessions), déjà couvert hors moteur** via l’espace `/formateur` + filtres Prisma `trainerUserId`. Brancher `condition` / `ifOwner` dans `PermissionEngine` serait de la **défense en profondeur**, pas un trou ouvert aujourd’hui pour le parcours formateur. **P5 (permlevel champs) n’a pas de besoin métier actuel confirmé** — le runtime filtre déjà les champs si `permlevel` est déclaré, mais aucun DocType OF ne l’utilise au-delà de `0`.

**Recommandation Cursor :** ne pas toucher `permission-engine.ts` ce soir ; ack Claude sur (a) reporter P5, (b) P6 = optionnel / Vague suivante ou micro-lot défensif.

---

## 2. Preuves de code (pas de suppositions)

### 2.1 Types déjà là, moteur partiel

| Capacité | Type (`packages/doctype/src/types.ts`) | Runtime |
|---|---|---|
| `DocPermission.permlevel` | `0 \| 1 \| 2` | `effectivePermissions` / `buildMetaResponse` filtrent les **fields** si `maxReadPermlevel` | 
| `DocField.permlevel` | optionnel | idem |
| `ifOwner?: boolean` | déclaré | **non lu** par `hasPermission` |
| `condition?: RecordPermissionCondition` | `owner` \| `fieldEqualsPrincipal` | **non lu** par `hasPermission` |
| `persistence.ownerField` | ex. FundingCase / Company | **écriture seule** à la création (`document.ts` pose `principal.id`) — **pas de filtre liste/get** |

`hasPermission` (`permission-engine.ts`) : role + `requires` + action — stop. Aucune branche `ifOwner` / `condition`.

### 2.2 Rôle `formateur` — existe et est isolé

Seed (`crm-role-permissions.js`) : `formateur` a `lms.*` + chat/portal — **pas** `crm.academique.view` / `crm.academique.edit`.

`(protected)/layout.tsx` : rôle instructeur → redirect `/formateur`.

DocType `FormationSession` : read = `crm.academique.view` → un formateur **ne passe pas** le gate DocType CRM des sessions catalogue.

### 2.3 Scoping session déjà implémenté (couche app)

```ts
// apps/lms-crm/lib/instructor/instructor-access.ts
listInstructorSessionIds(trainerUserId) // where: { trainerUserId }
assertInstructorOwnsSession(trainerUserId, sessionId) // findFirst where id + trainerUserId
```

`instructor-trainees-data.ts` et les routes espace formateur s’appuient sur ces helpers. Champ Prisma : `FormationSession.trainerUserId` (aussi déclaré sur le DocType training).

### 2.4 Inventaire `ownerField` / `permlevel` déclarés

- `ownerField: 'ownerUserId'` : `FundingCase`, Company/Contact (CRM) — auto-set create only.
- Aucun DocType CRM scanné n’utilise `ifOwner: true` ni `condition: { … }` dans `permissions[]`.
- `permlevel` sur les règles = quasi toujours `0` ; pas de fields métier sensibles à `permlevel: 1|2` recensés comme besoin produit.

---

## 3. P6 — analyse besoin

### Besoin métier ?

Oui, conceptuellement : un formateur ne doit voir / agir que sur **ses** sessions (`trainerUserId = self`).

### Trou ouvert aujourd’hui ?

| Surface | Risque actuel |
|---|---|
| Espace `/formateur` | Mitigé (`assertInstructorOwnsSession`) |
| API CRM sessions (sections académique) | Formateur n’a pas `academique.view` → 403 / hors parcours |
| `ResourceService.list('FormationSession')` | Si un principal avait `academique.view` **sans** filtre record → verrait **toutes** les sessions. Aujourd’hui les rôles staff/admin qui ont ce slug **doivent** tout voir. |
| DocType genérique + futur rôle hybride | Risque latent si on donne `academique.view` à un formateur « léger » |

### Si on branchait le moteur (après ack)

Proposition d’API (design, pas code) :

1. Dans `hasPermission` **pour get/write/delete d’un doc déjà chargé** : si règle matche avec `ifOwner` / `condition`, évaluer le document courant.
2. Dans `ResourceService.list` : injecter un `where` dérivé des règles `condition` du principal (ex. `{ trainerUserId: principal.id }`) — **plus délicat** (OR entre plusieurs règles, interaction soft-delete).
3. Candidats déclaratifs :
   - `FormationSession` : règle formateur (si un jour slug LMS+academique) `condition: { type: 'fieldEqualsPrincipal', fieldname: 'trainerUserId', principalClaim: 'id' }`
   - `FundingCase` : `ifOwner: true` sur write pour owner commercial (en plus de `finance.edit`) — besoin métier **non confirmé** ce soir (les gestionnaires voient tout le portefeuille)

**Effort / risque :** moyen-élevé (liste + get + tests). Pas un one-liner comme P4.

---

## 4. P5 — analyse besoin

`buildMetaResponse` masque déjà les fields au-delà de `maxReadPermlevel`.

Gap réel = **aucune déclaration** ne s’en sert pour cacher un IBAN, un salaire, etc. Pas de demande produit actuelle dans le handoff.

**Recommandation :** reporter P5 tant qu’aucun champ sensible n’est identifié (ex. futur `LeaveRequest` notes RH, montants FundingCase pour rôle lecture seule déjà géré par absence de `finance.edit` au niveau doc — pas besoin de permlevel field).

---

## 5. Options pour Claude

| Option | Contenu | Quand |
|---|---|---|
| **A — Reporter** | Pas de code moteur ; documenter P6 comme « mitigé app-layer » dans `PERMISSION_AUDIT.md` | Ce soir / demain |
| **B — P6 défensif FormationSession** | Brancher `condition` + filtre list pour `trainerUserId` ; tests ; **sans** changer les slugs formateur | Après ack + tests sérieux |
| **C — P5 d’abord** | Choisir 1–2 fields + déclarer permlevel | Seulement si besoin métier nommé |

Cursor recommande **A** (éventuellement note doctrine), **B** seulement si Claude veut la défense moteur maintenant.

---

## 6. Ce qu’on ne fait pas sans ack

- Modifier `permission-engine.ts` / `resource-service.ts`
- Donner `crm.academique.view` au rôle `formateur`
- Refactor de l’espace `/formateur` (déjà correct)

---

## 7. Décisions demandées

1. Ack verdict P6 = besoin réel mais **déjà mitigé** hors DocType ?
2. Reporter P5 ?
3. Option A / B / C pour la suite ?
