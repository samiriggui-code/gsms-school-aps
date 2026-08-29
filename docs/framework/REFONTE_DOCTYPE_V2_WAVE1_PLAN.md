# Plan — Refonte DocType Framework V2 (Vague 1 / Socle)

> **Produit :** GSMS School = **une école, une DB** (`lms_app`). **Pas un SaaS. Pas de `tenant_id`.**  
> **Décision :** rewrite clean-cutover du moteur DocType, **pas** un big-bang IAM non contrôlé.  
> **Scope :** phases 2–10 du skill V2 + migration des 7 entités actuelles.  
> **Hors scope vague 1 :** CRM OF Lead… · Evidence · CustomField DB · workflow UI · multi-tenant / SaaS.

---

## Règle produit (non négociable)

```text
PAS de tenant_id sur Document.
PAS de tenant_scope dans les queries.
PAS de DocMetaCache clé « tenant ».
PAS de multi-tenant Prisma.

Une instance = une école.
Customisation future = overlay école (CustomField / PropertyOverride),
pas un modèle SaaS multi-clients.
```

Le skill V2 mentionnait `tenant_id` par analogie Frappe multi-site — **inapplicable à GSMS School**.  
Champs système Vague 1 :

`name` · `owner` · `creation` · `modified` · `modified_by` · `docstatus`  
(+ soft-delete si flag) — **c’est tout.**

---

## Objectif

Remplacer `apps/lms-crm/lib/framework/*` + `ENTITY_REGISTRY` parallèle par :

```text
@repo/doctype          ← noyau Frappe-like (zéro domaine, zéro tenant)
apps/lms-crm/domains/* ← enregistrements DocType au boot
/api/resource|/meta|/actions  ← APIs canoniques
/api/entities          ← shim contrôlé puis mort
```

**Doctrine :** framework ↛ LMS/Qualiopi · permissions = DocMeta seul · LMS = client quarantiné (`Lms*`).

---

## Architecture cible

```text
domains/{core,rh,lms,qualiopi}/register.ts
        │ registerDefinition()
        ▼
@repo/doctype (DocTypeRegistry → DocMeta → Document → PermissionEngine)
        │ PersistenceAdapter (DI)
        ▼
prisma injecté par apps/lms-crm/lib/doctype/persistence.ts
```

Package : `packages/doctype` (pattern `@repo/api-core`).  
**Interdit dans le package :** `@/`, `apps/`, `domains/`, `@repo/database`, Prisma, lms, qualiopi, **tenant**.

---

## Structure `@repo/doctype/src`

```text
definition/  field/  meta/  document/  controller/  registry/
naming/  permissions/  workflow/  customization/  events/
persistence/  migration/  api/  tests/
```

| Type | Rôle |
|------|------|
| `DocTypeDefinition` | name, module, label, table, schemaVersion, fields, permissions, naming, flags, persistence, commands?, aliases? |
| `DocField` | fieldname, fieldtype, permlevel, Link/Table options… |
| `DocPermission` | role, permlevel, CRUD+submit…, `requires.slugs` (pont IAM), condition record |
| `DocMeta` | définition compilée + systemFields + cache **clé doctype+metadataVersion** |
| `Document` | insert/save/delete/submit/cancel/reload/validate/has_permission — **sans tenantId** |
| `DocController` | lifecycle hooks + `commands` map |
| `Naming` | UUID_INTERNAL \| SERIES \| FIELD \| MANUAL |
| `Flags` | isChild / isSingle / isVirtual / isSubmittable / softDelete |

---

## Cutover IAM — pas un point de non-retour aveugle

Le rewrite DocType **touche** `protectRoute` / entity registry / routes entities.  
Ce n’est **pas** « tout casser puis prier ». Stratégie :

### Phases internes (même PR possible, merges logiques)

| Phase | Contenu | IAM live |
|-------|---------|----------|
| **A** | `@repo/doctype` + tests · domaines enregistrés · `/api/resource` + `/api/meta` **en parallèle** | **Ancien** `ENTITY_REGISTRY` + engine inchangés |
| **B** | Shim `/api/entities` → ResourceService **derrière flag** `DOCTYPE_V2_RUNTIME=1` | Dual-run possible |
| **C** | `protectRoute` lit PermissionEngine **si flag** ; sinon legacy | Rollback = unset flag |
| **D** | Flag on en permanence · smoke OK | — |
| **E** | Delete `lib/framework/*` + entity Qualopi + registry statique | Seulement après D vert |

### Rollback

1. **Tag git** avant Phase C : `pre-doctype-v2-cutover`  
2. **Feature flag** `DOCTYPE_V2_RUNTIME` (env) — défaut `0` jusqu’à smoke  
3. Rollback immédiat = `DOCTYPE_V2_RUNTIME=0` + redéployer / restart (garde l’ancien chemin tant que Phase E n’est pas faite)  
4. Après Phase E : rollback = `git revert` / checkout du tag (suppression = vrai cut ; d’où tag + CI verts obligatoires)

### Boot — ne pas tuer toute l’app

`instrumentation.ts` **ne doit pas** faire `throw` fatal qui empêche Next de servir Qualiopi/sessions/finance.

```text
bootstrapDocTypes():
  try → assertValid + seal → status = READY
  catch → status = FAILED + log erreur structurée
         → routes /api/resource|/meta|/actions → 503 « DocType bootstrap failed »
         → reste de l’app (sections Qualiopi, sessions, auth NextAuth…) continue
```

En **DEV** : fail visible (banner / log rouge) + tests Vitest `assertValid` bloquants en CI.  
En **PROD** : même isolation — DocType down ≠ process Next mort.

Smoke **hors prod** avant Phase E :

1. `pnpm test:doctype`  
2. `pnpm --filter lms-crm build`  
3. Boot local `DOCTYPE_V2_RUNTIME=1` → meta User + resource User + lab  
4. Boot local `DOCTYPE_V2_RUNTIME=0` → legacy entities OK (rollback check)

---

## Permissions

1. `DocPermission[]` sur DocType → `DocMeta`  
2. `PermissionEngine` lit DocMeta seul  
3. Legacy `ENTITY_REGISTRY` → bridge généré **ou** chemin flag legacy jusqu’à Phase E  
4. `protectRoute` (Phase C+) : session → `PermissionPrincipal` → PermissionEngine

---

## APIs

| Canonique | Rôle |
|-----------|------|
| `GET/POST /api/resource/[doctype]` | list + create |
| `GET/PATCH/DELETE /api/resource/[doctype]/[name]` | CRUD |
| `GET /api/meta/[doctype]` | metadata + perms effectives user |
| `POST /api/actions/[doctype]/[name]/[command]` | commandes déclarées |
| `/api/entities/*` | shim (flag) → ResourceService |

---

## Migration des 7 entités

| Legacy | Canonique | Module |
|--------|-----------|--------|
| `user` | `User` | core.iam |
| `role` | `Role` | core.iam |
| `leaveRequest` | `LeaveRequest` | rh |
| `course` | `LmsCourse` | lms |
| `lesson` | `LmsChapter` (alias `LmsLesson`) | lms |
| `enrollment` | `LmsEnrollment` | lms |
| `complianceDossierItem` | `ComplianceDossierItem` | qualiopi |

Aliases legacy pour shim. Controllers domaine. Core n’importe jamais `lib/of`.

---

## HMR (dev)

| Cas | Comportement |
|-----|--------------|
| Re-register **identique** | no-op |
| Re-register **différent** (édition active) | **recompile DocMeta** + `clear` cache doctype + **reseal** si registry scellé en mode `allowHotReload` (DEV only) |
| PROD / CI | seal strict · double register différent = **erreur** |

Pas seulement « idempotent si égal » — le cas réel = définition qui change en permanence en dev.

---

## Zone gelée pendant exécution Cursor

**G1-E terminé (2026-08-29)** — freeze levée sur :

- ~~`apps/lms-crm/lib/framework/**`~~ (supprimé)
- ~~`apps/lms-crm/lib/auth/entity-registry.ts`~~ (supprimé)
- `apps/lms-crm/lib/auth/protect-route.ts` — désormais PermissionEngine only (modifiable)
- `apps/lms-crm/app/api/entities/**` — shim ResourceService (modifiable)
- routes `sections/.../acces/users|roles` — ResourceService (modifiable)
- ~~`apps/lms-crm/lib/of/qualiopi-compliance-item-entity.ts`~~ (supprimé)

**Nouveau gate :** pas de merge `FundingCase` dans `schema.prisma` sans `✅ gate Funding ouvert` Claude (draft : `docs/framework/FUNDING_CASE_PRISMA_DRAFT.md`).

---

## Ordre d’implémentation

1. Tag `pre-doctype-v2-cutover`  
2. Scaffold `@repo/doctype` + types (**sans tenant**) + tests  
3. DocMeta + Registry + seal / hot-reload DEV  
4. PermissionEngine + NamingEngine  
5. PrismaAdapter DI + Document + LifecycleRunner  
6. Workflow minimal  
7. Resource / Meta / Command services  
8. App adapters + bootstrap **non-fatal**  
9. Domain registrations  
10. Routes resource/meta/actions (**Phase A** — parallèle)  
11. Flag + shim entities + protectRoute dual (**Phase B–C**)  
12. Smoke flag=1 et flag=0  
13. Flag permanent + delete anciens fichiers (**Phase E**)  
14. Lab → meta/resource  
15. Tests anti-drift CI

---

## Fichiers critiques

**Créer :** `packages/doctype/**` · `apps/lms-crm/lib/doctype/**` · `apps/lms-crm/domains/**` · `app/api/resource|meta|actions/**`

**Réécrire (après flag) :** protect-route · entity-registry · entities shim · instrumentation (bootstrap non-fatal) · lab · users/roles list

**Supprimer (Phase E seulement) :** `lib/framework/{entity,engine,registry,index}.ts` · `lib/of/qualiopi-compliance-item-entity.ts`

**Ne pas toucher :** schema Prisma · menu · pages Qualiopi sections · n8n

---

## Tests DoD

- registry · meta · fields · lifecycle · naming · permissions · permlevel · child ACL · resource/meta/command  
- **pas** de champ `tenantId` / `tenant_id` dans Document / DocMeta / PersistenceBinding  
- architecture : imports interdits dans package  
- bootstrap FAILED → 503 DocType routes, pas crash process  
- flag off = legacy path (tant que Phase E non faite)  
- typecheck + build lms-crm

---

## Non-goals vague 1

CustomField DB · CRM Lead/Session/Funding · Evidence · Qualiopi Evidence rewrite · audit trail réglementaire · amend · **SaaS / multi-tenant / tenant_id** · Frappe Desk · auto-migration Prisma

**Aussi hors vague 1 (et hors parallèle « moteurs ») :**  
implémenter `FundingCase` / `Evidence` / `ExternalExchange` en Prisma **avant G1-D** = bypass DocType (drift Qualiopi).  
Specs + draft schéma Claude OK pendant G1 · **merge Prisma Cursor après G1-D** en DocTypes Vague 2 (ordre V2 §76).  
G1-E (delete) = nettoyage, pas gate Funding.

**Parallèle sûr pendant Vague 1 :** UI sur modèles déjà en base — IA brouillons/historique, Qualiopi historique.  
**Session readiness / doc states / events runtime :** après **SD-06** verrouillé (pas pendant G1 sans catalog).

Vague 2 = CORE done → CRM → Training → Funding → Documents → Quality → Evidence → Qualiopi → Audit → Finance/BPF → LMS.

---

## Vérification manuelle

1. Boot → DocType READY (ou FAILED isolé)  
2. `GET /api/meta/User`  
3. `GET /api/resource/User` (auth)  
4. Flag off → `/api/entities/user` legacy OK  
5. Flag on → parity entities ↔ resource  
6. Lab OK  
7. Import domaine dans package → CI rouge

---

## Risques & mitigation

| Risque | Mitigation |
|--------|------------|
| Cutover IAM casse toute l’app | Flag + tag + Phases A→E · pas de delete avant smoke |
| Boot DocType tue Next | Bootstrap non-fatal · 503 scoped |
| `tenant_id` creep | **Interdit** — single-school only |
| users/roles response shape | mapper ResourceService |
| Qualiopi hooks | controller domaine + tests |
| HMR définition changée | recompile + clear cache DEV (`allowHotReload`) |

---

**Validation de ce plan révisé → exécution Phase A d’abord (package + routes parallèles), pas suppression immédiate.**

---

## Statut exécution (29/08 soir — décision A)

| Item | Statut |
|------|--------|
| Décision A (pas FundingCase avant G1-E) | ✅ |
| Tag `pre-doctype-v2-cutover` | ✅ posé sur HEAD commit `dc0d7e1` (WIP working tree **non** inclus) |
| `@repo/doctype` types + registry + meta + perms + tests | ✅ G1-A |
| 7 DocTypes via `domains/*/register` | ✅ G1-A |
| `GET /api/meta/[doctype]` + resource stub | ✅ G1-A (parallèle legacy) |
| Bootstrap non-fatal + instrumentation | ✅ |
| CH-SAFE IA brouillons / historique | ✅ |
| CH-SAFE Qualiopi historique | ✅ |
| Document runtime / flag cutover / delete legacy | ✅ G1-B/C/D/E done — legacy `lib/framework` + ENTITY_REGISTRY + qualiopi entity deleted; ResourceService only |
