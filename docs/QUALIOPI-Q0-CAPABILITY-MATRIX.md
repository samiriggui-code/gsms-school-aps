# Qualiopi Q0 — Matrice de capacité & règles pilotes Q1

**Date :** 2026-09-02  
**Statut :** validé pour implémentation Q1  
**Référentiel :** V9-2024-01-08 (`QUALIOPI_REFERENTIAL_VERSION`)  
**Engine :** `qualiopi-engine-q1.0`

---

## Principe

```
MÉTIER PRODUIT → EVIDENCE PROUVE → RULE ÉVALUE → QUALIOPI DÉTECTE → MÉTIER CORRIGE
```

- Evidence ≠ conformité
- CODE CALCULE · EVE n’intervient pas
- Stress test = read-only

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

Fichiers :

- `apps/lms-crm/lib/of/qualiopi-evaluation-types.ts`
- `apps/lms-crm/lib/of/qualiopi-evaluation-rules.ts`
- `apps/lms-crm/lib/of/qualiopi-session-evaluate.ts`
- `apps/lms-crm/app/api/sections/gestion-ressources/qualiopi/evaluate/route.ts`

---

## Matrice 32 indicateurs (synthèse)

Légende Auto : **YES** (règle Q1) · **PARTIAL** (données présentes, pas de règle) · **NO** · **MANUAL** (classeur)

| Ind. | Scope | Source GSMS | Auto | Manual | Gap principal |
|------|-------|-------------|------|--------|---------------|
| Q-I01 | ORG/FORMATION | Catalogue / landing | PARTIAL | YES | Pas Evidence info publique |
| Q-I02 | ORG/FORMATION | successRate / satisfactionRate | PARTIAL | YES | KPI manuels |
| Q-I03 | FORMATION | Examens / certif | PARTIAL | YES | Taux obtention |
| Q-I04 | BENEFICIARY | NEEDS_ANALYSIS | PARTIAL | YES | Evidence sans link |
| Q-I05 | FORMATION | Objectifs formation | PARTIAL | YES | — |
| Q-I06 | FORMATION | Contenu | PARTIAL | YES | — |
| Q-I07 | FORMATION | Certifiant | PARTIAL | YES | Applicabilité |
| Q-I08 | SESSION | POSITIONING | **YES Q1** | YES | — |
| Q-I09 | SESSION | Conventions | PARTIAL | YES | Pas Evidence |
| Q-I10 | SESSION | Adaptations | PARTIAL | YES | Link I20/I26 |
| Q-I11 | SESSION | FormativeAssessment | **YES Q1** | YES | — |
| Q-I12 | SESSION | Dropout | PARTIAL | YES | Pas link |
| Q-I13 | SESSION | Alternance | NO | YES | N/A SSPI typique |
| Q-I14 | SESSION | Socio-pro | NO | YES | NOT FOUND |
| Q-I15 | SESSION | Apprentis | NO | YES | NOT FOUND |
| Q-I16 | SESSION | Exam / retake | PARTIAL | YES | — |
| Q-I17 | SESSION/ORG | Salles / équipements | PARTIAL | YES | — |
| Q-I18 | SESSION | Circuits n8n | PARTIAL | YES | Orchestration ≠ preuve |
| Q-I19 | SESSION | Ressources péda | PARTIAL | YES | — |
| Q-I20 | ORG | Référent handicap | **YES Q1** | YES | — |
| Q-I21 | TRAINER | Formateurs RH | PARTIAL | YES | — |
| Q-I22 | TRAINER | Compétences RH | PARTIAL | YES | — |
| Q-I23 | ORG | Veille légale | NO | YES | WatchItem absent |
| Q-I24 | ORG | Veille métiers | NO | YES | — |
| Q-I25 | ORG | Veille péda | NO | YES | — |
| Q-I26 | ORG | Handicap | **YES Q1** | YES | — |
| Q-I27 | SUBCONTRACTOR | Sous-traitants | **YES Q1** | YES | — |
| Q-I28 | ORG | PFST | NO | YES | required:false |
| Q-I29 | ORG | Insertion | NO | YES | — |
| Q-I30 | SESSION | Satisfaction | **YES Q1** | YES | — |
| Q-I31 | ORG/SESSION | Tickets / incidents | PARTIAL | YES | Pas Evidence |
| Q-I32 | ORG | Amélioration continue | PARTIAL | YES | — |

**Comptage Q1 :** 6 YES · ~18 PARTIAL · ~8 NO/manuel pur.

---

## Ce qui n’existe pas encore

- `ComplianceEvaluation` / `ComplianceFinding` / `ComplianceSnapshot` (tables) — MVP in-memory
- Passeport UI / datatable sessions
- RulesVersion persistée sur snapshot
- Link Evidence auto pour Q-I08 / Q-I11 / Q-I30

---

## Roadmap

| Phase | État |
|-------|------|
| Q0 Matrice | ✅ ce document |
| Q1 Engine | ✅ règles + evaluate |
| Q2 Stress test API | ✅ GET evaluate |
| Q3 Passeport UI | ✅ `/qualiopi/passeport` |
| Q4 Datatable sessions | pending |
| Q5 Vue org | pending |
| Q6 Snapshots | pending |
| Q7 Auditor pack | pending |
