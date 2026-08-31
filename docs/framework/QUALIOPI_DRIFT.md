# QUALIOPI_DRIFT.md

> Audit §68 · 2026-08-29 · **Statuts mis à jour 2026-08-31** (croisement Claude + vérif code)

## Findings

| ID | Sévérité | Finding | Statut 31/08 |
|----|----------|---------|--------------|
| Q1 | **P0** | Classeur = modèle **32 cases** OK/KO/TO_FIX/NA sur `ComplianceDossierItem` — pas Evidence → Coverage. | ✅ **Tradeoff assumé** (OF-11′) — dualité couverture Evidence / jugement audit |
| Q2 | **P0** | `registry.ts` **importe** `@/lib/of/qualiopi-compliance-item-entity` → framework dépend de Qualiopi/OF (**interdit** §64 V2). | ✅ Résolu (G1-E / domains/qualiopi) |
| Q3 | P0 | Double API write : `/api/entities/complianceDossierItem` et `sections/.../qualiopi/items/[itemId]`. | 📌 **Choix assumé P0** — voir § Décision |
| Q4 | P1 | Hooks Qualiopi dans le « controller » ad hoc recalculent complétude dossier — logique **métier Qualiopi dans couche entity**, pas Evidence Engine. | 📌 **Choix assumé P0** — voir § Décision |
| Q5 | P1 | Pas de `Evidence`, `EvidenceLink`, `EvidenceRule`, `IndicatorCoverage`, `Audit*` DocTypes. | ✅ Résolu (Evidence Engine) |
| Q6 | P2 | Seed indicateurs V9 existe (data) mais non branché comme DocType référentiel séparé du runtime checklist. | Ouvert P2 (non bloquant) |
| Q7 | P1 | Risk : n8n / IA pourraient être tentés d’écrire `auditStatus=OK` — aucune garde « Evidence only ». | Mitigé partiel (OF-11′ : coverage ≠ OK auto) ; garde n8n = hors scope |
| Q8 | info | Permissions support→ressources corrigées 29/08 (mauvais domaine menu). | ✅ Résolu |

## Modèle correct (V2 §40–43)

```text
Session / Attendance / Survey / …  → events → Evidence → EvidenceLink → Qualiopi Engine → IndicatorCoverage
```

DocTypes Qualiopi autorisés : Criterion, Indicator, EvidenceRule, IndicatorCoverage, Audit, AuditSample, AuditFinding — **contrôle**, pas opération.

`ComplianceDossierItem` peut rester **outil d’audit manuel interne** (mode checklist) mais ne doit pas être la vérité opérationnelle ni vivre dans le registry core via import domaine.

## Décision Cursor 31/08 — Q3 / Q4

**Pas de migration code maintenant** (aligné consigne Claude : pas urgent, pas de perte de données).

**Choix assumé** (même famille que Q1 / OF-11′) :

- La route bespoke `sections/.../qualiopi/items/[itemId]` reste le **chemin UI classeur** (projection OK/KO/TO_FIX/NA, upload preuve, `recompute()` local du dossier `SCHOOL_QUALIOPI`).
- Le DocType `complianceDossierItem` reste le chemin générique `/api/entities/...` pour les **autres kinds** et outils framework.
- Deux chemins d’écriture = dette connue, **acceptable** tant que le classeur a besoin d’un mapping audit + `recompute` spécifiques.

**P1 optionnel (si un jour ça gêne)** : migrer la route vers `ResourceService` + hook `afterUpdate` pour `recompute()` — seulement si un second writer casse la cohérence ou si on unifie toutes les mutations Compliance.

## Action (historique 29/08)

1. ~~Extraire définition Qualiopi hors de `registry.ts`~~ ✅  
2. ~~Introduire Evidence* (Phase 15) avant d’enrichir le classeur~~ ✅  
3. Documenter clairement : classeur = ManualAuditTemplate, pas moteur — ✅ via OF-11′ + ce fichier.
