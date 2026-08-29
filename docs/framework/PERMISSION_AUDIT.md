# PERMISSION_AUDIT.md

> Audit §66 · 2026-08-29

## Architecture actuelle

```text
EntityDefinition.permissions  ──(déclaratif, souvent ignoré au runtime)
ENTITY_REGISTRY               ── protectRoute() → slug → rôle IAM
menu-crm-access.ts            ── gate navigation (prefix → slug)
```

## Findings

| ID | Sévérité | Finding |
|----|----------|---------|
| P1 | **P0** | **Double source** : `def.permissions` ≠ source runtime (`ENTITY_REGISTRY`). Non Frappe-like. |
| P2 | **P0** | Historique : `complianceDossierItem` dans `ENTITIES` sans `ENTITY_REGISTRY` → fail-closed 403 ou trou selon chemin. **Corrigé 29/08** (entrée ajoutée) — risque de récidive sans sync auto. |
| P3 | **P0** | Permissions Qualiopi étaient `support.*` alors que menu = `ressources.*`. **Corrigé 29/08**. |
| P4 | P1 | **P4′ (actualisé 29/08)** — Granularité IAM : le moteur DocPerm sépare déjà read/write/create/delete ; hors `iam.users.*`, le catalogue CRM n’offre en général que `.view` / `.edit`, donc create/write/delete restent souvent bundlés derrière `.edit`. Correctifs déclarationnels P4-C/B/A2 (SystemLog, FundingCase delete, `governance.conformite.edit`). |
| P5 | P1 | Pas de **permlevel**. |
| P6 | P1 | Pas de **record permission** (trainer ne voit que ses sessions, etc.). |
| P7 | P2 | `visibleFor` sur field = demi-mesure lecture ; non branché écriture. |
| P8 | P2 | Permissions UI menu (`menu-crm-access`) indépendantes du DocType — OK pour nav, mais pas dérivées de DocMeta. |
| P9 | P1 | Pas de distinction child ACL : N/A (pas de child). |
| P10 | P2 | Pas de Custom Permission / standard overlay. |
| P11 | info | Frontend EntityForm n’embarque pas les perms ; s’appuie sur API 403 — correct, mais pas de Meta API `permissions utilisateur`. |

## Permissions orphelines / DocType sans perm

Après fix 29/08 : les 7 keys `ENTITIES` ont une entrée `ENTITY_REGISTRY`.

**Test manquant :** assert CI `Object.keys(ENTITIES) === Object.keys(ENTITY_REGISTRY)` + égalité des 4 méthodes.

## Cible V2

```text
DocTypeDefinition.permissions[]  → DocMeta
Permission Engine lit DocMeta seulement
ENTITY_REGISTRY parallèle = SUPPRIMÉ ou généré 1:1 depuis DocMeta (legacy bridge)
```
