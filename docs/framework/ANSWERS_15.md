# ANSWERS_15 — Audit factuel §79 (avant toute modification structurelle)

> Date : 2026-08-29 · Code : `apps/lms-crm/lib/framework/*` · **Pas une spéculation.**

---

### 1. Où est la source de vérité des DocTypes actuels ?

**`apps/lms-crm/lib/framework/registry.ts`** — objet TypeScript `ENTITIES: Record<string, EntityDefinition>`.

Pas de tables `DocType` / `tabDocType`. Pas de JSON fichier séparé. Frontend lit via `GET /api/entities/{entity}/schema` → `serializeEntitySchema(def)`.

---

### 2. Où sont les DocFields ?

**Inline** dans `EntityDefinition.fields: EntityField[]` (`lib/framework/entity.ts`).

Pas d’entité `DocField` persistée. Types limités : `string|text|number|boolean|date|select|relation|json|file` — **pas** la taxonomie Frappe (Link/Table/Currency/…).

---

### 3. Comment sont résolus les Controllers ?

**Aucun** `resolve_controller()`. Comportement = `hooks` optionnels sur la définition (`beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`) exécutés dans `engine.ts`.

Exemple Qualiopi : hooks dans `lib/of/qualiopi-compliance-item-entity.ts` (fichier **domaine**, importé par le registry — drift).

---

### 4. Quel est le lifecycle d’un Document ?

```text
create: Zod create → beforeCreate? → prisma.create → afterCreate?
update: load → Zod update → beforeUpdate? → prisma.update → afterUpdate?
delete: load → beforeDelete? → softDelete|delete → afterDelete?
```

**Absents :** before_naming, naming, before_validate/validate dédiés, before_save, submit, cancel, on_submit, docstatus, amend, reload API.

---

### 5. Où sont les permissions ?

**Deux endroits :**

1. `EntityDefinition.permissions` `{ GET, POST, PATCH, DELETE }` → slugs `CRM_PERMISSION` / `IAM_*` / `LMS_*`  
2. `lib/auth/entity-registry.ts` → `ENTITY_REGISTRY` (même forme)

`protectRoute()` lit **uniquement** `ENTITY_REGISTRY` via `permissionForEntityMethod()`.

Les slugs sont ensuite vérifiés contre les permissions du **rôle utilisateur** (IAM classique), pas un modèle DocPerm par rôle/doctype.

---

### 6. Permissions rattachées au DocType ou dupliquées ?

**Dupliquées / parallèles.**  
`def.permissions` n’est pas la source runtime. Drift possible (et déjà observé : `complianceDossierItem` un temps dans `ENTITIES` sans entrée auth ; corrigé partiellement le 29/08).

**Pas** de modèle Frappe : `Session.permissions = [{ role, read, write, … }]`.

---

### 7. Y a-t-il des permlevels ?

**Non.** Seulement `visibleFor?: string[]` (filtre lecture par roleSlug dans `sanitize()`). Pas de `permlevel` champ / rôle.

---

### 8. Comment fonctionnent les child tables ?

**Absentes.** Pas de `is_child`, `parent`, `parentfield`, `parenttype`, `idx`.  
Les relations sont des `fieldtype: 'relation'` (FK) vers une autre entity autonome.

---

### 9. Comment fonctionne le naming ?

**Aucun moteur de naming.** IDs = ceux de Prisma (cuid/uuid). Pas de séries `SES-YYYY-#####`, pas de `name` métier Frappe-like.

---

### 10. Comment fonctionnent les workflows ?

**Aucun** Workflow attaché au DocType.  
États métier éventuels = champs `status` Select + logique dans routes `sections/*` ou hooks ad hoc.  
n8n = `SessionAutomationRun` — orchestration, pas state machine DocType.

---

### 11. Quels modules importent le DocType core ?

| Consommateur | Usage |
|--------------|--------|
| `app/api/entities/[entity]/*` | CRUD générique |
| `sections/.../acces/users|roles` | `listEntity` seulement |
| `components/framework/*` | EntityForm / EntityTable |
| `framework-lab` page | UI lab |
| `lib/of/qualiopi-compliance-item-entity` | Définition (puis importée **dans** registry) |

---

### 12. Le core importe-t-il LMS / lab ?

| Import | Verdict |
|--------|---------|
| `registry.ts` → `@/lib/auth/crm-permissions` | OK (socle auth) |
| `registry.ts` → `@/lib/rh-iam-roles` | OK-ish (filtre rôles) |
| `registry.ts` → `@/lib/of/qualiopi-compliance-item-entity` | **INTERDIT V2** — domaine Qualiopi/OF dans le registry |
| `engine.ts` → `@/lib/prisma` | OK |
| Entités `course`/`lesson`/`enrollment` **dans** le registry core | **Drift LMS** — clients OK, mais priorisés dans le socle |

Le framework n’importe pas `app/(lms)` pages, mais **déclare et priorise** des DocTypes LMS dans le noyau.

---

### 13. Quelles données Qualiopi sont au mauvais endroit ?

- `ComplianceDossierItem` + UI classeur = **checklist opérationnelle** OK/KO/TO_FIX/NA mappée sur `ComplianceItemStatus` — **pas** Evidence → IndicatorCoverage.  
- Double écriture : `/api/entities/complianceDossierItem` **et** `sections/.../qualiopi/items/[itemId]`.  
- Permissions historiques `support.*` (corrigées vers `ressources.*` le 29/08) — symptôme de mauvais domaine.  
- Pas de DocTypes `Evidence`, `EvidenceLink`, `EvidenceRule`, `IndicatorCoverage`.

---

### 14. Quels endpoints CRUD sont auto-générés ?

```text
GET/POST   /api/entities/{entity}
GET/PATCH/DELETE /api/entities/{entity}/{id}
GET        /api/entities/{entity}/schema
```

---

### 15. Quels endpoints sont des commandes métier ?

**Non formalisés** comme Command API. Exemples dans `sections/*` :  
classeur Qualiopi PATCH item, circuits n8n, devis acceptation, émargement, apply AI artifact, etc. — handlers métier ad hoc, pas `POST /api/actions/{doctype}/{name}/{command}`.

---

## Synthèse écart vs V2

| Concept V2 | Présent ? |
|------------|-----------|
| DocTypeDefinition déclaratif | Partiel (EntityDefinition) |
| DocField first-class | Non (inline) |
| DocMeta compile + custom | Non |
| Document runtime | Non (engine Prisma direct) |
| Controller class | Non (hooks) |
| Naming | Non |
| docstatus vs business status | Non |
| DocPerm / permlevel / record ACL | Non (slugs plats) |
| Child / Single / Virtual | Non |
| Workflow DocType | Non |
| Resource + Meta API | Partiel (`/entities` + `/schema`) |
| Command API | Non |
| framework ↛ domain | **Violé** (import Qualiopi) |
| CRM OF avant LMS | **Violé** (priorité LMS dans registry) |
