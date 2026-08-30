# Audit exhaustif — 50 workflows GSMS vs code réel (29/08/2026)

> Contexte : `docs/GSMS SCHOOL — WORKFLOWS OF COMPLETS.md` §64 fixe une cible de 40-50 workflows métier (WF-01 à WF-45 numérotés + 5 items nommés non numérotés : Facturation/Relance paiement/Evidence generation/Qualiopi recalculation/Audit interne). Cet audit vérifie chacun contre le **code réel** (grep/lecture), pas contre les docs de suivi du projet (`SUIVI-CURSOR-CLAUDE.md`, `HANDOFF-*.md`, `SD-06-EVENT-CATALOG-DRAFT.md`) qui ont servi seulement d'indices de départ. Deux des findings les plus lourds (WF-11/12, WF-17) ont été re-vérifiés manuellement par Claude après le rapport de l'agent, pas acceptés sur parole.

**Résumé chiffré original (29/08, avant rattrapage) : 20 ✅ / 15 🟡 / 15 ❌ (sur 50).**

**Mise à jour 30/08 après Tranches 1+2 + WF-02/03** (détail des livraisons et vérifications indépendantes dans `SUIVI-CURSOR-CLAUDE.md`) :
**31 ✅ / 11 🟡 / 8 ❌ (sur 50)**, soit 11 workflows fermés en une session — tous vérifiés indépendamment (code relu en entier, tests + `tsc` + `migrate diff` relancés par Claude, pas acceptés sur le rapport de Cursor) :
- WF-06 🟡→✅ (SELF_FUNDED/APPRENTICESHIP explicites)
- WF-07 🟡→✅ (statut VIEWED ajouté au cycle devis)
- WF-08 🟡→✅ (cycle convention complet GENERATED→ARCHIVED + relances J+2/J+5)
- WF-17 ❌→✅ (détection signature manquante + notifs, sans fabriquer de preuve)
- WF-18 🟡→✅ (cycle de justification d'absence complet)
- WF-28/29/30 ❌→✅ (satisfaction entreprise/formateur/financeur)
- WF-32 ❌→✅ (analyse auto satisfaction + alerte)
- WF-02/03 ❌→✅ (analyse du besoin + positionnement, nouveau modèle `CandidatureAssessment`)

**Reste ouvert (8❌ / 11🟡)** : WF-04 (accessibilité par candidat), WF-14 (J-5, quasi gratuit maintenant que WF-02/03 existent), WF-19 (prévention rupture), WF-21 (évaluation formative non rattachée au parcours CNAPS), WF-35-37 (veille, bloqué), WF-45 (autres financeurs, bloqué) en ❌ ; WF-11/12 (design assumé, pas un bug), WF-15/20/22/24/25/33/34/38/46 en 🟡.

**Mise à jour 30/08 (nuit, fin de session)** — Tranches 2 et 3 fermées (voir plus haut : WF-06/07/08/17/18/28/29/30/32/02/03/04/14 = 13 workflows), puis **Tranche 4 : WF-34 🟡→✅** (`QualityIncident.deadline`/`verifiedAt` + statut `AWAITING_VERIFICATION`, commit `3450941`, vérifié indépendamment).

**Tally final de la nuit : 34 ✅ / 10 🟡 / 6 ❌ (sur 50)**, contre 20/15/15 en début de soirée — **14 workflows fermés en une session**, chacun vérifié indépendamment (code relu en entier, `test:doctype` + `harden` + `tsc --noEmit` + `prisma migrate diff --exit-code` relancés par Claude, jamais acceptés sur le rapport de Cursor seul).

**Reste ouvert pour la prochaine session** :
- **❌ (6)** : WF-19 (prévention rupture — heuristique de risque à concevoir), WF-21 (évaluation formative non rattachée au parcours CNAPS présentiel), WF-35/36/37 (veille, bloqué faute de source externe), WF-45 (autres financeurs, bloqué faute de process vérifié).
- **🟡 (10)** : WF-11/12 (design assumé — pas de hard-block auto, décision volontaire, pas un bug à corriger), WF-15/20/22/24/25/33/38/46. **WF-24 (rattrapage examen) a un vrai point de design non résolu** : `FormationExam` est 1:1 par session, pas par participant — décider nouvelle session dédiée vs champ retry participant avant de coder. **WF-33 a été jugé non prioritaire** : `SupportTicket` couvre déjà fonctionnellement le cycle réclamation, renommer l'enum toucherait tous les usages du ticketing au-delà des réclamations.

---

*Détail original (29/08), tableaux ci-dessous non mis à jour ligne par ligne — se référer à la section "Mise à jour 30/08" ci-dessus pour le statut courant des WF listés.*

---

## ⚠️ Cas de survente détectés (doc dit "implémenté", code dit autre chose)

Tous issus de `docs/framework/SD-06-EVENT-CATALOG-DRAFT.md` (corrigé le 29/08 suite à cet audit) :

1. **§7 checklist** : *« Famille A (session) : LOCKED — implémenté »* lue seule laisse croire que les 34 WF sont faits. En réalité 11/34 sont à zéro code. Le doc se couvrait plus bas (§3 : "scope volontairement resserré") mais la checklist finale ne reprenait pas la nuance.
2. **`SIGNATURE_MISSING` (WF-17)** listé dans un tableau intitulé "(implémenté)" — **zéro trace de code re-vérifiée par Claude** (`grep -i "signature.*manquant\|missing.*signature"` → aucun résultat dans `apps/lms-crm`).
3. **`LEARNER_ABSENT`/cycle justification (WF-18)** même tableau "(implémenté)" — le code réel n'a que `FormationSessionEmargementStatus` PRESENT/ABSENT/LATE/EXCUSED + notes libres, aucune state machine de justification.
4. **Contrôleurs J-30/J-15 (WF-11/12)** — présentés comme une logique de vérification automatique. **Re-vérifié par Claude** : `session-readiness-transitions.ts` est une simple map `DRAFT→PLANNED→...→ARCHIVED` sans aucune condition ; la route `readiness/route.ts` prend `findingIds` **tel quel depuis le body HTTP client** (`Array.isArray(body.findingIds) ? body.findingIds : []`, ligne 55) — aucun modèle `Finding`, aucun calcul serveur de formateur/salle/matériel manquant. C'est un bouton d'avancement manuel + log d'audit, pas un moteur de contrôle.
5. **`DOCUMENT_SENT`** regroupait convocation/convention/attestation sous "implémenté" — convocation et attestation sont réelles, mais la "convention" n'a pas de cycle SIGNED/relance J+2/J+5.

Point positif à signaler : le code de `finance/factures/route.ts` contient lui-même le commentaire *« émission à venir »* — le code admet honnêtement l'absence d'un modèle `Invoice` dédié (item 46), pas de survente là.

---

## Famille A — Session (WF-01 à WF-34)

| WF | Nom court | Verdict | Preuve / gap |
|---|---|---|---|
| WF-01 | Prospect→demande formation | ✅ | `Lead`, `Company`, `Contact`, `TrainingRequest` (schema.prisma:3286-3389) + UI leads/quote-requests/préinscriptions |
| WF-02 | Analyse du besoin | ❌ | Zéro champ/modèle "needs analysis" |
| WF-03 | Positionnement initial | ❌ | Zéro hit "positionnement" comme workflow |
| WF-04 | Accessibilité/handicap (candidat) | ❌ | Aucun champ accessibilité sur Candidature/Participant — à ne pas confondre avec WF-40 (référent handicap organisme, réel) |
| WF-05 | Qualification dossier | ✅ | `ComplianceDossier`/`ComplianceDossierItem` (CANDIDATURE_ADMISSION), `DocumentRequest`, n8n relance conformité |
| WF-06 | Choix financement | 🟡 | `FundingFunderType` complet sauf SELF_FUNDED/APPRENTICESHIP explicites (repliés sur OTHER) |
| WF-07 | Devis | 🟡 | Cycle DRAFT→SENT→ACCEPTED/REJECTED→EXPIRED réel ; `VIEWED` absent |
| WF-08 | Convention/contrat | 🟡 | PDF généré réel ; pas de cycle GENERATED→SENT→VIEWED→SIGNED→ARCHIVED, pas de relance J+2/J+5 |
| WF-09 | Validation inscription | ✅ | `CandidatureStatus.VALIDATED` → `FormationSessionParticipant` |
| WF-10 | Création session | ✅ | `SessionReadinessStatus` + `SessionReadinessEvent` + Evidence |
| WF-11 | Contrôle J-30 | 🟡 | Bouton d'avancement manuel, aucune vérification auto, `findingIds` fourni par le client (voir survente #4) |
| WF-12 | J-15 contractualisation | 🟡 | Même moteur générique, pas de check auto conventions/signatures |
| WF-13 | J-10 convocation | ✅ | Génération + route API réelles |
| WF-14 | J-5 préparation pédagogique | ❌ | Aucun test préformation/positionnement final |
| WF-15 | J0 entrée en formation | 🟡 | Transition RUNNING générique, pas d'orchestration dédiée |
| WF-16 | Émargement | ✅ | `FormationSessionEmargement` complet (marquage staff + PDF + historique) |
| WF-17 | Signature manquante | ❌ | Zéro code (voir survente #2) |
| WF-18 | Gestion absence | 🟡 | Statuts présence réels, pas de cycle de justification |
| WF-19 | Prévention rupture de parcours | ❌ | Zéro hit "rupture"/"décrochage" |
| WF-20 | Bilan formateur quotidien | 🟡 | Notes libres (`journalNotesMorning/Evening`), pas d'entité structurée |
| WF-21 | Évaluation formative | ❌ | Infra Quiz existe côté LMS e-learning autonome, non rattachée au parcours CNAPS présentiel |
| WF-22 | Évaluation finale | 🟡 | `FormationExamOutcome` réel, pas d'évaluation distincte "objectifs ACQUIRED/PARTIAL" |
| WF-23 | Certification/examen | ✅ | `FormationExam` + `examOutcome` réels |
| WF-24 | Échec examen | 🟡 | Statuts FAILED/ABSENT capturés, aucune logique de rattrapage |
| WF-25 | Clôture pédagogique | 🟡 | `closeSessionDossier()` réel, pas de vérification auto pré-clôture |
| WF-26 | Attestation et certificat | ✅ | Gaté sur `examOutcome === PASSED` + idempotence |
| WF-27 | Satisfaction à chaud | ✅ | `SatisfactionSurvey(HOT)` + email + token public + cron |
| WF-28 | Satisfaction entreprise | ❌ | Timing HOT/COLD uniquement, pas de COMPANY |
| WF-29 | Satisfaction formateur | ❌ | Idem, pas de TRAINER |
| WF-30 | Satisfaction financeur | ❌ | Idem, pas de FUNDER |
| WF-31 | Satisfaction à froid | ✅ | `SatisfactionSurvey(COLD)` + cron |
| WF-32 | Analyse auto satisfactions | ❌ | Aucune logique de seuil/alerte |
| WF-33 | Réclamation | 🟡 | `SupportTicket` réel, cycle fonctionnellement équivalent mais étapes différentes de la doctrine |
| WF-34 | Action corrective | 🟡 | `QualityIncident` (rootCause/correctiveAction/assignedTo/statuts) sans champ deadline ni étape de vérification |

## Famille B — Organisme (WF-35 à WF-40)

| WF | Nom court | Verdict | Preuve |
|---|---|---|---|
| WF-35/36/37 | Veille (réglementaire/métiers/pédagogique) | ❌ | Aucune source externe branchée — bloqué à raison |
| WF-38 | Compétences formateur | 🟡 | "Document expirant" ✅ (`ComplianceService.auditOpenDossiers()` + cron 15min) ; "revue annuelle" ❌ |
| WF-39 | Sous-traitants | ✅ | `SubcontractorRecord`, commit `987f6b7` |
| WF-40 | Référent handicap (organisme) | ✅ | `DisabilityReferent`, commit `987f6b7` |

## Famille C — Financeurs (WF-41 à WF-45)

| WF | Nom court | Verdict | Preuve |
|---|---|---|---|
| WF-41 | Entreprise/B2B | ✅ | `FundingCaseStatus` générique |
| WF-42 | OPCO | ✅ | AFDAS/ATLAS seulement |
| WF-43 | CPF/EDOF | ✅ | `lib/connectors/edof/` |
| WF-44 | France Travail | ✅ | `lib/connectors/france-travail/` |
| WF-45 | Autres financeurs | ❌ | Pas de checklist connecteur codée |

## Items 46-50

| # | Nom court | Verdict | Preuve |
|---|---|---|---|
| 46 | Facturation | 🟡 | Devis ACCEPTED réutilisé comme facture, pas de modèle `Invoice` dédié (le code l'admet : commentaire "émission à venir") |
| 47 | Relance paiement | ✅ | `fetchOverdueInvoices()` + n8n "Relance impayés" |
| 48 | Evidence generation | ✅ | Câblé dans 6+ domaines, pas juste le modèle Prisma |
| 49 | Qualiopi recalculation | ✅ | `buildQualiopiCoverage()` réel |
| 50 | Audit interne | ✅ | `QualiopiClasseurView`, persisté sur `ComplianceDossierItem` |

---

## Ce que ça change concrètement

- **Famille C (financeurs) et items 46-50** : solides, rien à craindre.
- **Famille B** : honnête, déjà documentée comme partielle (veille bloquée à raison).
- **Famille A (session, 34 WF)** est la vraie zone de risque Qualiopi : 11 workflows entièrement absents, dont plusieurs directement liés à des indicateurs Qualiopi cités dans le doc source (WF-02 analyse du besoin, WF-03 positionnement, WF-19 prévention rupture de parcours, WF-32 analyse satisfaction). Ce ne sont pas des détails cosmétiques — ce sont des exigences d'audit Qualiopi nommément citées dans `WORKFLOWS OF COMPLETS.md`.
