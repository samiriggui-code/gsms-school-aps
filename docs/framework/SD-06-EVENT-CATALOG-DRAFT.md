# SD-06 — Catalogue d'événements (draft) — **✅ LOCKED (famille A) / extension B+C**

> Auteur : Claude, papier, comme assigné dans `PLAN-ACTION-GLOBAL-GSMS.md` ligne 118/190 ("Draft Funding/Evidence + SD-06 — Claude, maintenant, ∥ papier").
> Gate : ce doc doit être **verrouillé** (relu, ajusté si besoin, puis marqué LOCKED) avant que Cursor ne code quoi que ce soit touchant readiness de session, doc states, ou events runtime (règle §2 "Freeze" du plan).
> Source : extrait et formalisé depuis `docs/GSMS SCHOOL — WORKFLOWS OF COMPLETS.md` (modèle événementiel §3, workflows A/B/C) — pas inventé, dérivé de la doctrine déjà écrite ce soir.
> Single-tenant : pas de `tenantId`. Pas de nouveau modèle Prisma dans ce document — c'est un contrat de nommage/forme, l'implémentation (table `SystemEvent` ou équivalent) reste à faire par Cursor après lock.

## 1. Pattern canonique (déjà doctrine, formalisé ici)

```
EVENT → CONDITIONS → ACTIONS → RESULTS → EVIDENCE(S) → QUALIOPI RE-EVALUATION
```

Chaque événement du catalogue doit avoir :

| Champ | Description |
|---|---|
| `event_name` | `SCREAMING_SNAKE_CASE`, verbe au passé ou état atteint (ex. `SESSION_COMPLETED`) |
| `domain` | `session` \| `organisation` \| `financeur` (les 3 familles WF A/B/C) |
| `trigger_source` | `manual` (action UI) \| `scheduled` (ex. J-30/J-15/J-10) \| `system` (dérivé d'un autre événement) |
| `payload_ref` | ID(s) de l'entité concernée — jamais de duplication de données métier dans l'event lui-même |
| `evidence_generated` | `type` de la preuve Evidence Engine créée/référencée (cf. `EVIDENCE_ENGINE_PRISMA_DRAFT.md`), ou `null` si l'événement n'en produit pas directement |
| `consumers` | Qui/quoi réagit à l'événement (ex. `n8n circuit`, `Qualiopi re-evaluation`, `notification`) |

## 2. Session readiness — state machine (SD-06 §A, dérivé WF-10)

```
DRAFT → PLANNED → CONFIRMED → READY → RUNNING → COMPLETED → CLOSED → ARCHIVED
```

Contrôles de transition connus (WF-11 à WF-14, J-30/J-15/J-10/J-5) :

| Transition | Contrôleur | Si échec |
|---|---|---|
| `PLANNED → CONFIRMED` | J-30 : formateur, salle, matériel, programme, planning, accessibilité, financement, documents, prérequis, capacité | `CREATE_FINDING` (pas de blocage auto, juste un signalement) |
| `CONFIRMED → READY` | J-15 : conventions, contrats, signatures, financeurs, relance documents manquants | reste en `CONFIRMED`, relance |
| `READY → RUNNING` | J-10 : convocation + programme + planning + plan d'accès envoyés | déclenche `WF-13` (déjà implémenté ce soir sous OF-02) |

**Gardes de transition — tranché en review (Cursor, 29/08) :** les transitions restent **forçables manuellement** (rôle `ressourcesEdit`/`financeEdit`, ou système) même avec un `CREATE_FINDING` ouvert. Le finding **reste ouvert** (pas de résolution automatique), un événement d'audit est écrit (`SESSION_STATUS_CHANGED`, payload `{ forced: true, findingIds: [...] }`, même pattern que `FundingCaseEvent`). **Pas de hard-block automatique** — cohérent avec la doctrine WF-11 qui parle de "signalement", pas de blocage ; un hard-block bloquerait des opérations OF réelles. Accepté.

## 3. Catalogue famille A — cycle de vie session (implémenté)

Scope volontairement resserré aux événements déjà couverts par du code existant ce soir (OF-02, OF-08, émargement, satisfaction, FundingCase) — pas les 45 WF au complet. Extension en Vague 2+ quand un domaine y touche vraiment.

| event_name | domain | trigger_source | evidence_generated | consumers |
|---|---|---|---|---|
| `SESSION_STATUS_CHANGED` | session | manual/system | `type: HISTORIQUE` (from/to status) | Qualiopi re-eval, `SystemLog` (déjà en place, G10) |
| `SLOT_STARTED` | session | scheduled | `null` (déclencheur, pas preuve en soi) | ouverture émargement |
| `ATTENDANCE_CONFIRMED` | session | manual (signature) | `type: SIGNATURE` (émargement) | Qualiopi re-eval, calcul heures BPF (déjà consommé par `bpf-aggregates.ts` ce soir via `Emargement`) |
| `SIGNATURE_MISSING` | session | system (dérivé créneau du jour + participant sans ligne d'émargement) | `null` (jamais fabriquer la preuve) | notification apprenant/formateur/admin — implémenté Tranche 2 (pedagogy-evening) |
| `LEARNER_ABSENT` | session | manual / evening cron | `type: RELATION` (absence + justification) | cycle `UNJUSTIFIED→JUSTIFICATION_REQUESTED→JUSTIFIED→RESOLVED` — Tranche 2 |
| `NEEDS_ANALYSIS_COMPLETED` | candidature | manual (soumission questionnaire WF-02) | `type: QUESTIONNAIRE` | déclenche WF-03 positionnement |
| `POSITIONING_COMPLETED` | candidature | manual (soumission questionnaire WF-03) | `type: QUESTIONNAIRE` | prérequis / niveau / suite parcours |
| `SPECIAL_NEED_DECLARED` | candidature | system (WF-02 `adaptationRequired=true`) | `type: LOG` | notif référent handicap + cycle WF-04 |
| `ADAPTATION_STATUS_CHANGED` | candidature | manual staff (PENDING→APPROVED→IMPLEMENTED) | `type: LOG` | suivi aménagement Q-I20/Q-I26 |
| `PREFORMATION_J5_REMINDER` | session | cron J-5 (WF-14) | `type: LOG` | rappel horaires/matériel + relance positionnement si incomplet |
| `EXAM_RETAKE_PROPOSED` | session | manual staff (WF-24, outcome FAILED) | `type: LOG` | e-mail apprenant + trace dossier (pas d'e-mail financeur P0) |
| `DOCUMENT_SENT` | session | system | `type: EMAIL` ou `type: DOCUMENT` selon le canal | déjà implémenté ce soir (OF-02 : convocation/convention/attestation) |
| `SATISFACTION_REQUESTED` | session | scheduled (J+45 pour COLD) | `type: QUESTIONNAIRE` | déjà implémenté ce soir (OF-10) |
| `SATISFACTION_COMPLETED` | session | manual (soumission apprenant / stakeholder) | `type: QUESTIONNAIRE` | Qualiopi re-eval |
| `SATISFACTION_SCORE_ALERT` | session | system (score moyen < seuil WF-32) | `type: LOG` | alerte Qualiopi / suivi satisfaction |
| `FUNDING_CASE_STATUS_CHANGED` | financeur | manual/system | `type: HISTORIQUE` | déjà implémenté ce soir — c'est littéralement `FundingCaseEvent`, déjà en base et fonctionnel. **Ce draft ne fait que documenter ce qui existe déjà**, pas ajouter de code. |
| `FUNDING_DOCUMENT_STATUS_CHANGED` | financeur | manual | `type: DOCUMENT` | déjà implémenté ce soir (`FundingDocument`) |

## 4. Catalogue famille C — financeurs (WF-41 à WF-45)

**Déjà largement implémenté ce soir**, sans attendre cette extension formelle — les checklists MANUAL_PORTAL (EDOF/OPCO/FT Kairos) livrées par Cursor sont l'implémentation concrète de WF-42/43/44. Ce tableau documente ce qui existe et ce qui reste hors scope.

| WF | event_name | Statut | Note |
|---|---|---|---|
| WF-41 Entreprise/B2B | `FUNDING_CASE_STATUS_CHANGED` (`funderType: ENTREPRISE`) | ✅ Déjà couvert | Le cycle "devis→validation→convention→session→réalisation→attestation→facture→paiement" suit exactement la state machine `FundingCaseStatus` générique déjà en place — pas de checklist dédiée nécessaire, c'est un flux interne, pas un portail externe. |
| WF-42 OPCO | `OPCO_*` (checklist) | ✅ Implémenté (AFDAS/ATLAS, `verified: true`) | Voir `lib/connectors/opco/opco-dossier-checklist.ts`. Les 9 autres OPCO : `verified: false`, pas de checklist tant que non confirmé. |
| WF-43 CPF/EDOF | `EDOF_*` (checklist + export catalogue XML) | ✅ Implémenté | Voir `lib/connectors/edof/`. |
| WF-44 France Travail | `FT_*` (checklist) | ✅ Implémenté | Voir `lib/connectors/france-travail/kairos-dossier-checklist.ts`. Rappel Qualiopi inclus dans le hint. |
| WF-45 Autres financeurs | — | ❌ Non couvert | AGEFIPH, Transitions Pro, Régions — tous `verified: false` dans `connector-capabilities.json`. Pas d'invention tant qu'aucune source officielle n'est vérifiée (règle du soir : "aucune API/process n'est déclaré sans source officielle vérifiable"). |

## 5. Catalogue famille B — organisme (WF-35 à WF-40)

Ces indicateurs Qualiopi ne sont pas liés à une session mais à l'organisme dans son ensemble.

| event_name | domain | trigger_source | Cycle (dérivé WF) | evidence_generated | Statut (actualisé 29/08) |
|---|---|---|---|---|---|
| `VEILLE_ITEM_CREATED` | organisation | scheduled (périodique) | WF-35 réglementaire / WF-36 métiers-compétences / WF-37 pédagogique-techno : `collect sources → detect change → qualify relevance → create item → assign owner → analyse impact → record action` | `type: LOG` ou `type: DOCUMENT` selon la source | ❌ Non implémenté — aucune source externe branchée, prématuré de coder une infra de veille sans déclencheur réel |
| `TRAINER_DOCUMENT_EXPIRING` | organisation | scheduled | WF-38 : `document_expiring → request update` | `type: LOG` | ✅ **Déjà implémenté** — `ComplianceService.auditOpenDossiers()` (générique, couvre `FORMATEUR_HABILITATION` avec tous les autres kinds), cron réel `packages/workers/src/compliance-auditor.ts` (`*/15 * * * *` relances + expirations, digest admin lundi 8h), wiré dans `packages/workers/src/run.ts`. Catalogue corrigé — ce n'était pas un gap, juste une doc pas à jour. |
| `TRAINER_ANNUAL_REVIEW` | organisation | scheduled | WF-38 : `annual review → competency gap → development action` | `type: EVALUATION` | ❌ Non implémenté — aucun code trouvé (`competency gap`/revue annuelle absent hors docs) |
| `SUBCONTRACTOR_STATUS_CHANGED` | organisation | manual | WF-39 : state machine `PENDING_VALIDATION → APPROVED → ACTIVE → REVIEW_REQUIRED → SUSPENDED` | `type: VALIDATION` | ✅ Implémenté (`SubcontractorRecord`, commit `987f6b7`) |
| `DISABILITY_REFERENT_ACTION_RECORDED` | organisation | manual | WF-40 : maintenance référent/partenaires/ressources/procédures/actions | `type: LOG` | ✅ Implémenté (`DisabilityReferent`, commit `987f6b7`) |

**Reste réellement ouvert dans cette famille** : WF-35-37 (veille, bloqué faute de source externe — pas d'invention tant qu'aucun déclencheur réel n'existe) et le volet "annual review" de WF-38 (pas de besoin métier urgent identifié ce soir). WF-38 "document expirant", WF-39 et WF-40 sont clos.

## 6. Ce que ce catalogue NE couvre PAS (hors scope explicite)

- `ExternalExchange` (échanges programmatiques avec connecteurs API — Zéro Saisie, Parcours Formation, API Convergence OPCO apprentissage) — dépend de comptes/clés externes non obtenus, hors scope tant que non demandé.
- L'implémentation technique de la famille B (table Prisma, UI) — c'est un futur chantier, pas ce draft.
- L'implémentation technique globale (table Prisma `SystemEvent`, event bus, outbox pattern) — c'est du code, pas ce draft papier.

## 7. Checklist review

- [x] Famille A (session) : **LOCKED** — accord Claude ↔ Cursor du 29/08 sur le **sous-ensemble scopé en §3** (readiness + Evidence branchés pour ce sous-ensemble). **Correction 29/08 (audit complet WF-01→34)** : sur les 34 WF de la doctrine complète (`GSMS SCHOOL — WORKFLOWS OF COMPLETS.md`), seuls 10 sont ✅ pleinement implémentés, 13 sont 🟡 partiels, 11 sont ❌ à zéro code (WF-02, 03, 04, 14, 17, 19, 21, 28, 29, 30, 32). Ce "LOCKED" porte sur le contrat de nommage/pattern des événements déjà codés, **pas** sur une couverture complète de la famille A — voir `docs/AUDIT-WORKFLOWS-50-COMPLET.md` pour le détail WF par WF.
- [x] Famille C (financeurs) : **implémentée** via les checklists EDOF/OPCO/FT — ce document formalise a posteriori ce qui existe déjà, rien à coder en plus pour clore ce point.
- [x] Famille B (organisme) : **catalogué mais pas implémenté** — nommage posé pour un futur chantier, pas un go de code immédiat.

## ✅ SD-06 LOCKED (29/08/2026) — extension B/C documentée

Le lock initial (famille A) reste valable. Cette extension ajoute la doctrine cataloguée pour B et C sans rouvrir de code non désiré — C est déjà fait, B attend une décision de chantier future (modèle Prisma à trancher le jour venu).
