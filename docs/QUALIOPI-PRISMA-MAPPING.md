# Qualiopi V9 ↔ Prisma (mapping complet)

**Date :** 2026-09-17  
**Référentiel :** V9-2024-01-08  
**Corpus preuves :** `C:\laragon\www\qualiopi-rag\data\qualiopi-markdown-v9\indicateurs\`  
**Seed :** `packages/database/prisma/data/qualiopi-indicators-v9.js`

## Principe

```
Métier Prisma → Evidence (preuve) → Rule Q1 (évaluation) → Classeur (jugement audit)
```

- **Pas** de table `QualiopiIndicator` miroir du guide (seed + RAG).
- Evidence ≠ conformité.
- `required: false` sur I13–I15, I20 (mobilité/conseil), I28–I29 = N/A si hors offre OF.

## Mapping 32 indicateurs

| Code | Modèles / champs Prisma | Fit schéma |
|------|-------------------------|------------|
| Q-I01 | `Formation.publicAccess*`, `publicTeachingMethods`, `publicEvaluationMethods`, `publicDisabilityAccessInfo` | COVERED |
| Q-I02 | `CertificationOutcomeStat`, `Formation.successRate` | COVERED |
| Q-I03 | `CertificationOutcomeStat` (passerelles, blocs), `Formation.rncp*` | COVERED |
| Q-I04 | `CandidatureAssessment` NEEDS_ANALYSIS | COVERED |
| Q-I05 | `Formation.operationalObjectivesSummary`, `outcomes` | COVERED |
| Q-I06 | `Formation.contentModalitiesSummary`, modules, `pedagogicalOutline` | COVERED |
| Q-I07 | `Formation.certificationAdequacyNotes`, RNCP | COVERED |
| Q-I08 | `CandidatureAssessment` POSITIONING | COVERED (+ règle Q1) |
| Q-I09 | `FormationSessionConvention`, annonces portail | COVERED |
| Q-I10 | `adaptation*` sur assessment | COVERED |
| Q-I11 | `FormativeAssessment` | COVERED (+ règle Q1) |
| Q-I12 | `EngagementMeasure`, `dropoutRisk*` | COVERED |
| Q-I13 | `CompanyTutorLink`, `ApprenticeshipMission` | COVERED (CFA) |
| Q-I14 | `SocioProfessionalSupportAction` | COVERED (CFA) |
| Q-I15 | `ApprenticeRightsAck` | COVERED (CFA) |
| Q-I16 | `SessionCertificationPresentation`, `FormationExam` | COVERED |
| Q-I17 | salles, équipements, formateur session | COVERED |
| Q-I18 | `SessionIntervenantAssignment` | COVERED |
| Q-I19 | `PedagogicalResourceDelivery`, LMS | COVERED |
| Q-I20 | `disabilityReferent*`, `mobilityReferent*`, `PerfectionnementCouncilMeeting` | COVERED |
| Q-I21 | `TrainerCompetencyReview`, `FormateurProfile` | COVERED |
| Q-I22 | `StaffDevelopmentAction` | COVERED |
| Q-I23–25 | `WatchItem` + `WatchExploitation` (3 domaines) | COVERED |
| Q-I26 | référent + `HandicapNetworkPartner` + adaptations | COVERED (+ règle Q1) |
| Q-I27 | `SubcontractorRecord` | COVERED (+ règle Q1) |
| Q-I28 | `SocioEconomicPartnership` | COVERED (si PFST) |
| Q-I29 | `InsertionFollowUp` | COVERED |
| Q-I30 | `SatisfactionSurvey` | COVERED (+ règle Q1) |
| Q-I31 | `SupportTicket` / `QualityIncident` `isComplaint` + stakeholder | COVERED |
| Q-I32 | `ContinuousImprovementAction` | COVERED |

## Transversal

| Concern | Prisma |
|---------|--------|
| Preuves | `Evidence`, `EvidenceIndicatorLink` |
| Classeur audit | `ComplianceDossier` `SCHOOL_QUALIOPI` |
| Couverture | links Evidence → codes `Q-Ixx` |

## Suite (hors schema)

1. UI d’écriture sur les nouveaux modèles  
2. Règles Q1 étendues (I23–25, I31–32, I12…)  
3. Evidence auto à la création/complétion des enregistrements métier  
4. `pnpm db:seed` pour recharger indicateurs enrichis (pondération, ST, NE)
