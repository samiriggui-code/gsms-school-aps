# GSMS — Framework DocType — REDIRECT

> **Ce fichier est obsolète comme charte.**

**Source de vérité :** [`GSMS SCHOOL — FRAMEWORK DOCTYPE V2.md`](./GSMS%20SCHOOL%20—%20FRAMEWORK%20DOCTYPE%20V2.md)

**Audits & plan :**

- [`framework/ANSWERS_15.md`](./framework/ANSWERS_15.md)
- [`framework/DOCTYPE_INVENTORY.md`](./framework/DOCTYPE_INVENTORY.md)
- [`framework/PERMISSION_AUDIT.md`](./framework/PERMISSION_AUDIT.md)
- [`framework/LMS_DRIFT.md`](./framework/LMS_DRIFT.md)
- [`framework/QUALIOPI_DRIFT.md`](./framework/QUALIOPI_DRIFT.md)
- [`framework/MIGRATION_PLAN.md`](./framework/MIGRATION_PLAN.md)

## Rappel anti-foirage

- DocType ≠ form builder / lab LMS  
- Framework ↛ LMS / Qualiopi  
- Permissions = metadata DocType (plus de registre parallèle désync)  
- CRM OF → Training → Funding → Evidence → Qualiopi → … → LMS  
- Freeze LMS jusqu’à réparation socle  

Correctifs mineurs déjà faits (29/08) : sync `complianceDossierItem` dans `ENTITY_REGISTRY` + perms `ressources.*` — **insuffisant** vs V2 ; suite = Phase 0–1 puis bridge DocMeta.
