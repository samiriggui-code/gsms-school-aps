# SD-06 — Catalogue d'événements (draft) — **PAS verrouillé**

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

## 3. Catalogue P0 — événements du cycle de vie session (famille A)

Scope volontairement resserré aux événements déjà couverts par du code existant ce soir (OF-02, OF-08, émargement, satisfaction, FundingCase) — pas les 45 WF au complet. Extension en Vague 2+ quand un domaine y touche vraiment.

| event_name | domain | trigger_source | evidence_generated | consumers |
|---|---|---|---|---|
| `SESSION_STATUS_CHANGED` | session | manual/system | `type: HISTORIQUE` (from/to status) | Qualiopi re-eval, `SystemLog` (déjà en place, G10) |
| `SLOT_STARTED` | session | scheduled | `null` (déclencheur, pas preuve en soi) | ouverture émargement |
| `ATTENDANCE_CONFIRMED` | session | manual (signature) | `type: SIGNATURE` (émargement) | Qualiopi re-eval, calcul heures BPF (déjà consommé par `bpf-aggregates.ts` ce soir via `Emargement`) |
| `SIGNATURE_MISSING` | session | system (dérivé `SLOT_COMPLETED` + `signature_missing`) | `null` | notification apprenant/formateur/admin — **la preuve ne doit jamais être fabriquée** (règle explicite WF-17) |
| `LEARNER_ABSENT` | session | manual | `type: RELATION` (absence + justification liée) | notification, statut `UNJUSTIFIED→JUSTIFICATION_REQUESTED→JUSTIFIED→RESOLVED` |
| `DOCUMENT_SENT` | session | system | `type: EMAIL` ou `type: DOCUMENT` selon le canal | déjà implémenté ce soir (OF-02 : convocation/convention/attestation) |
| `SATISFACTION_REQUESTED` | session | scheduled (J+45 pour COLD) | `type: QUESTIONNAIRE` | déjà implémenté ce soir (OF-10) |
| `SATISFACTION_COMPLETED` | session | manual (soumission apprenant) | `type: QUESTIONNAIRE` | Qualiopi re-eval |
| `FUNDING_CASE_STATUS_CHANGED` | financeur | manual/system | `type: HISTORIQUE` | déjà implémenté ce soir — c'est littéralement `FundingCaseEvent`, déjà en base et fonctionnel. **Ce draft ne fait que documenter ce qui existe déjà**, pas ajouter de code. |
| `FUNDING_DOCUMENT_STATUS_CHANGED` | financeur | manual | `type: DOCUMENT` | déjà implémenté ce soir (`FundingDocument`) |

## 4. Ce que ce catalogue NE couvre PAS (hors scope P0, explicite)

- Les 45 workflows dans leur intégralité (familles B organisation et C financeur au-delà de FundingCase — ex. veille réglementaire, sous-traitance, amélioration continue).
- `ExternalExchange` (échanges avec connecteurs externes EDOF/OPCO/France Travail) — dépend de la matrice connecteurs, pas traité ici.
- L'implémentation technique (table Prisma `SystemEvent`, event bus, outbox pattern) — c'est du code, pas ce draft papier.

## 5. Checklist review (utilisateur / Claude / Cursor)

- [x] Pattern EVENT→CONDITIONS→ACTIONS→RESULTS→EVIDENCE→QUALIOPI accepté tel quel — Cursor OK, pas d'objection.
- [x] Session readiness state machine (§2) accepté pour lock. Note d'implémentation (Cursor) : `FormationSession` n'a pas encore de champ readiness — le lock fige le contrat, le champ (`SessionReadinessStatus` ou équivalent) arrive au code post-lock, aucune collision avec un enum existant.
- [x] Catalogue P0 (§3) jugé suffisant pour démarrer (Cursor) — bon ancrage sur l'existant, pas besoin d'étendre familles B/C avant lock.
- [x] Gardes de transition — tranché ci-dessus (§2), accepté par les deux parties.

## ✅ SD-06 LOCKED (29/08/2026)

Accord Claude ↔ Cursor sur les 4 points ci-dessus. Cursor peut coder session readiness / doc states / events runtime à partir de ce contrat.
