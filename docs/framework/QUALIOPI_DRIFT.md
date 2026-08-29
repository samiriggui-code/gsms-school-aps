# QUALIOPI_DRIFT.md

> Audit §68 · 2026-08-29

## Findings

| ID | Sévérité | Finding |
|----|----------|---------|
| Q1 | **P0** | Classeur = modèle **32 cases** OK/KO/TO_FIX/NA sur `ComplianceDossierItem` — pas Evidence → Coverage. |
| Q2 | **P0** | `registry.ts` **importe** `@/lib/of/qualiopi-compliance-item-entity` → framework dépend de Qualiopi/OF (**interdit** §64 V2). |
| Q3 | P0 | Double API write : `/api/entities/complianceDossierItem` et `sections/.../qualiopi/items/[itemId]`. |
| Q4 | P1 | Hooks Qualiopi dans le « controller » ad hoc recalculent complétude dossier — logique **métier Qualiopi dans couche entity**, pas Evidence Engine. |
| Q5 | P1 | Pas de `Evidence`, `EvidenceLink`, `EvidenceRule`, `IndicatorCoverage`, `Audit*` DocTypes. |
| Q6 | P2 | Seed indicateurs V9 existe (data) mais non branché comme DocType référentiel séparé du runtime checklist. |
| Q7 | P1 | Risk : n8n / IA pourraient être tentés d’écrire `auditStatus=OK` — aucune garde « Evidence only ». |
| Q8 | info | Permissions support→ressources corrigées 29/08 (mauvais domaine menu). |

## Modèle correct (V2 §40–43)

```text
Session / Attendance / Survey / …  → events → Evidence → EvidenceLink → Qualiopi Engine → IndicatorCoverage
```

DocTypes Qualiopi autorisés : Criterion, Indicator, EvidenceRule, IndicatorCoverage, Audit, AuditSample, AuditFinding — **contrôle**, pas opération.

`ComplianceDossierItem` peut rester **outil d’audit manuel interne** (mode checklist) mais ne doit pas être la vérité opérationnelle ni vivre dans le registry core via import domaine.

## Action

1. Extraire définition Qualiopi hors de `registry.ts` (domains/qualiopi enregistre le DocType **auprès** du registry, sans import inverse).  
2. Introduire Evidence* (Phase 15) avant d’enrichir le classeur.  
3. Documenter clairement : classeur = ManualAuditTemplate, pas moteur.
