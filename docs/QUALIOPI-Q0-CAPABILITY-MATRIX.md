# Qualiopi Q0 — Matrice de capacité & règles pilotes Q1

**Date :** 2026-09-17 (schéma métier complet)  
**Statut :** schema COVERED 32/32 — règles auto Q1 encore 6  
**Référentiel :** V9-2024-01-08 (`QUALIOPI_REFERENTIAL_VERSION`)  
**Engine :** `qualiopi-engine-q1.0`  
**Mapping Prisma :** `docs/QUALIOPI-PRISMA-MAPPING.md`

---

## Principe

```
MÉTIER PRODUIT → EVIDENCE PROUVE → RULE ÉVALUE → QUALIOPI DÉTECTE → MÉTIER CORRIGE
```

- Evidence ≠ conformité
- CODE CALCULE · EVE n’intervient pas
- Stress test = read-only
- **Schema fit ≠ règle Q1** : les 32 ont un modèle ; seules 6 ont une règle auto.

---

## Statuts d’évaluation

| Statut | Signification |
|--------|---------------|
| PASS | Éléments suffisants pour la règle |
| FAIL | Exigence applicable non satisfaite |
| WARNING | Situation à surveiller |
| NOT_APPLICABLE | Règle non applicable au contexte |
| NOT_VERIFIABLE | Données insuffisantes — pas de faux PASS |

---

## Règles pilotes Q1 (implémentées)

| Code | Scope | Source GSMS | Critère | actionTarget |
|------|-------|-------------|---------|--------------|
| Q-I08 | SESSION | `CandidatureAssessment` POSITIONING | ratio COMPLETED / confirmés | suivi-formations/[sessionId] |
| Q-I11 | SESSION | `FormativeAssessment` | ≥1 formative / confirmé | suivi-formations/[sessionId] |
| Q-I30 | SESSION | `SatisfactionSurvey` HOT/COLD | ≥1 COMPLETED (N/A si session non démarrée) | suivi-formations/[sessionId] |
| Q-I20 | ORGANIZATION | `SystemSetting.disabilityReferent*` | nom renseigné | /rh/referent-handicap |
| Q-I26 | ORGANIZATION | référent + adaptations | référent OK ; WARNING si ADAPTATION_PENDING | referent-handicap / session |
| Q-I27 | ORGANIZATION | `SubcontractorRecord` | N/A si 0 ; PASS si APPROVED/ACTIVE | /rh/sous-traitants |

API : `GET /api/sections/gestion-ressources/qualiopi/evaluate?sessionId=`

---

## Matrice 32 — schéma Prisma (2026-09-17)

Légende Auto : **YES** (règle Q1) · **READY** (modèle prêt, pas encore de règle) · **N/A-offre** (`required:false`)

| Ind. | Prisma principal | Auto | Notes |
|------|------------------|------|-------|
| Q-I01 | `Formation.public*` | READY | |
| Q-I02 | `CertificationOutcomeStat` | READY | |
| Q-I03 | `CertificationOutcomeStat` + RNCP | READY | |
| Q-I04 | `CandidatureAssessment` NEEDS | READY | |
| Q-I05–07 | Formation objectifs / contenus / adéquation | READY | |
| Q-I08 | POSITIONING | **YES Q1** | |
| Q-I09 | Convention | READY | |
| Q-I10 | adaptation* | READY | |
| Q-I11 | FormativeAssessment | **YES Q1** | |
| Q-I12 | `EngagementMeasure` + dropout | READY | |
| Q-I13 | `CompanyTutorLink` / Mission | N/A-offre | CFA |
| Q-I14 | `SocioProfessionalSupportAction` | N/A-offre | CFA |
| Q-I15 | `ApprenticeRightsAck` | N/A-offre | CFA |
| Q-I16 | `SessionCertificationPresentation` | READY | |
| Q-I17 | salles / équipements | READY | |
| Q-I18 | `SessionIntervenantAssignment` | READY | |
| Q-I19 | `PedagogicalResourceDelivery` | READY | |
| Q-I20 | disability + mobility + conseil | **YES Q1** (handicap) | mobilité/conseil READY |
| Q-I21 | `TrainerCompetencyReview` | READY | |
| Q-I22 | `StaffDevelopmentAction` | READY | |
| Q-I23–25 | `WatchItem` + `WatchExploitation` | READY | |
| Q-I26 | HandicapNetworkPartner + référent | **YES Q1** | |
| Q-I27 | SubcontractorRecord | **YES Q1** | |
| Q-I28 | `SocioEconomicPartnership` | N/A-offre | PFST |
| Q-I29 | `InsertionFollowUp` | N/A-offre | |
| Q-I30 | SatisfactionSurvey | **YES Q1** | |
| Q-I31 | Ticket/Incident `isComplaint` | READY | |
| Q-I32 | `ContinuousImprovementAction` | READY | |

**Comptage :** schema **32/32 COVERED** · règles Q1 **6 YES** · **~20 READY** · **~6 N/A-offre**.

---

## Ce qui n’existe pas encore

- UI d’écriture sur les nouveaux modèles
- Règles Q1 étendues (veille, réclamations, amélioration…)
- Evidence auto à la complétion métier
- `ComplianceEvaluation` / snapshot persisté (MVP in-memory)

---

## Roadmap

| Phase | État |
|-------|------|
| Q0 Matrice | ✅ |
| Q1 Engine (6 règles) | ✅ |
| Schema métier 32 | ✅ 2026-09-17 |
| Q2 Stress test API | ✅ |
| Q3 Passeport UI | ✅ |
| Q4+ UI + règles étendues | pending |
