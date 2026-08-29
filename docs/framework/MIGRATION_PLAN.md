# MIGRATION_PLAN.md — DocType Framework V2

> Issu de l’audit §79 + skill V2 §76 · **Freeze features LMS** · Ne pas coder Phase 2+ sans DoD Phase 1.

## Phase 0 — FREEZE

- [x] Doctrine V2 publiée (`docs/GSMS SCHOOL — FRAMEWORK DOCTYPE V2.md`)  
- [x] Audits ANSWERS_15 / INVENTORY / PERMISSION / LMS / QUALIOPI  
- [ ] Stop nouvelles entités LMS dans registry  
- [ ] Stop nouvelles features lab hors sync tests  

## Phase 1 — AUDIT (fait)

Livrables dans `docs/framework/*`.

## Phase 2 — DocTypeDefinition + DocField

- Introduire modèle/types V2 (`DocTypeDefinition`, `DocField`) **sans casser** `EntityDefinition` (adapter bridge).  
- Taxonomie fieldtypes contrôlée (Data, Link, Table, …).  
- `module` obligatoire sur chaque DocType.  

## Phase 3 — DocMeta

- Compile : definition + (plus tard) custom fields/overrides.  
- `DocMetaCache` clé doctype + metadata_version (**pas** de tenant).  

## Phase 4 — Document Runtime

- Classe/service `Document` : insert/save/delete/reload/validate/has_permission.  
- Champs système : name, owner, creation, modified, modified_by, docstatus — **pas de `tenant_id`**.  

## Phase 5 — Controller Lifecycle

- Pipeline before_insert → naming → validate → save → after_*  
- Controllers par DocType hors framework core.  

## Phase 6 — Permissions + permlevel

- **Supprimer drift** : une seule résolution depuis DocMeta.  
- Bridge temporaire : générer `ENTITY_REGISTRY` depuis DocMeta pour `protectRoute`.  
- Introduire DocPerm + permlevel (même minimal 0/1).  

## Phase 7 — Naming

- Strategies UUID_INTERNAL | SERIES | FIELD | MANUAL.  
- Séries SES-/LRN- hors controllers métier.  

## Phase 8 — Child / Single / Virtual

- Child = structure parent only, ACL héritée.  
- Single = settings.  
- Virtual = contrat externe (EDOF view) — **pas** doublon FundingCase.  

## Phase 9 — Workflow

- WorkflowDefinition attaché DocType.  
- Séparé n8n. docstatus ≠ business status.  

## Phase 10 — Resource API + Meta API

- `/api/resource/{doctype}` (+ name)  
- `/api/meta/{doctype}`  
- Bridge deprecate `/api/entities` après parité.  

## Phase 11 — Customization Layer

- CustomField, PropertyOverride, CustomPermission.  

## Phase 12 → 18 — Domaines (ordre V2 §76 — Vague 2 après G1-E)

```text
12 CRM OF → 13 Training → 14 Funding → Documents → Quality
→ 15 Evidence → 16 Qualiopi/Audit → 17 Finance → 18 LMS
```

**Interdit :** implémenter Funding/Evidence en Prisma hors DocType pendant Vague 1 (drift type Qualiopi).  
Chaque domaine : DocTypes + Controllers + Commands — **enregistre** auprès du registry.  

## Definition of Done framework

Voir skill V2 §77 — formulaire lab **≠** Done.
