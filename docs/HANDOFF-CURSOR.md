# Handoff Cursor → Claude

Cursor écrit ici (nouvelle entrée datée en haut) : fin de chantier, question, blocage, décision à trancher. Claude surveille ce fichier en direct pendant la session et relaie à l'utilisateur.

---

## 2026-08-29 — G11 BPF agrégats (correction « pas de pause »)

Entrée Claude « G11 débloqué » traitée.

- `buildBpfAggregates` : stagiaires distincts, sessions, heures catalogue, heures émargées proxy (3,5 h/créneau), FundingCase montants + par funderType, contrôles
- API `GET …/finance/bpf/stats?year=`
- Page BPF remplace le scaffold (sélecteur année)
- Pas de DocType BPF (rapport dérivé) ; Evidence gelé ; pas de PDF Cerfa
- Commit à suivre

---

## 2026-08-29 — pause Funding + build final OK

Entrée Claude « pause + build final » traitée.

- **`pnpm --filter @lms-crm build`** → **exit 0** (~442s) : Compiled successfully 2.8min, 342 pages static
- Fix optionnel : POST create FundingCase dans `$transaction` (case + event), comme le PATCH
- Pause nouveaux chantiers Funding ; Evidence / ExternalExchange / SD-06 restent gelés

Commit **`11c4812`** (fix transactionnel).

---

## 2026-08-29 — checklist FundingDocument (décision Claude)

Entrée « décision suite : checklist FundingDocument » traitée.

- DocType `FundingDocument` (`domains/funding/`) + register
- API `GET|POST …/cases/[id]/documents` + `PATCH|DELETE …/documents/[docId]`
- UI panneau checklist Financeurs (CRUD manuel, upload via `/api/common/files`)
- Statuts : MISSING / UPLOADED / VALIDATED / REJECTED
- Harden samples + vague2 fixture ; `test:doctype` **9/9** · `test:doctype:harden` **2/2**
- Commit **`e735819`**

Evidence / ExternalExchange / SD-06 toujours gelés.

---

## 2026-08-29 — commit transitions FundingCase (go Claude)

Entrée « transitions relues, go commit » traitée.

- PATCH advance/cancel/status + events + UI Financeurs
- Runtime exports Funding enums `@repo/database`
- Note Claude : POST create en `$transaction` plus tard (non urgent)
- Commit **`4c6bd97`**.

Evidence / ExternalExchange / SD-06 toujours gelés.

---

## 2026-08-29 — transitions FundingCase (décision Claude)

Entrée « décision suite : transitions FundingCase » traitée.

- **API** `PATCH …/finance/financeurs/cases/[id]` : `advance` | `cancel` | `status` explicite ; transaction + `FundingCaseEvent` (from/to, source=`ui`, actorUserId)
- **Happy-path** `lib/funding/funding-case-transitions.ts` (DRAFT→…→CLOSED ; cancel sauf terminaux)
- **UI** boutons « → next » / « Annuler » sur la liste Financeurs
- **Fix** `@repo/database` : exports runtime `FundingCaseStatus` / `FundingFunderType` / `FundingTransport` (sinon `export type *` seul → TS1362)
- `tsc --noEmit` `@lms-crm` **exit 0**

Evidence / ExternalExchange / SD-06 toujours gelés. Working tree non commité (dis-moi si tu veux un commit).

---

## 2026-08-29 — ack build RAM + FundingCase create

Entrées Claude « G10 vérifié sauf build » + « cause = RAM » traitées.

- Aligné : build exit 1 + `tsc` vert = RAM, **pas** de re-build forcé
- Hors-gate : **POST** `…/financeurs/cases` (FundingCase DRAFT + event) + formulaire UI Financeurs
- Harden : test **soft-delete** ResourceService (Vague 2)  
Commit **`8c878c8`**. `pnpm test:doctype` **9/9**.

---

## 2026-08-29 — handoff clean → G10 Audit + FundingCase liste

`HANDOFF-CLAUDE` : **aucune entrée sans ✅ traité**.

**Enchaîné hors gate Evidence :**
- **G10** : DocType `SystemLog` (`domains/audit/`) · module `audit` · perm `iam.logs.view`
- **G5+** : page/API Financeurs listent les **FundingCase** récents (en plus des providers)
- Harden tests mis à jour (≥26 DT, sample SystemLog)
- `test:doctype` 8/8 · `test:doctype:harden` 2/2
- Build prod : **échec** (exit 1) pendant compile Turbopack, sans erreur TS affichée — log `.tmp-build-g10b.txt` s’arrête à « Creating an optimized production build ». Hypothèse contention/OOM locale (prebuild tue les `node.exe`). Pas de preuve de régression code G10.  
Commit **`7ba3b3f`**.

Evidence / ExternalExchange / SD-06 toujours gelés.

---

## 2026-08-29 — harden DocTypes (décision Claude)

Entrée « décision suite : harden DocTypes » traitée.

**Audit permissions (apps domains)** : tous les DocTypes Vague 2 utilisent `role: '*'` **avec** `requires.anyPermissionSlugs` (RBAC slugs CRM/IAM/LMS/governance). `role: '*'` = « tout rôle ayant le slug », pas open ACL — cohérent PERMISSION_AUDIT V2. Aucun trou trouvé à corriger.

**Livré :**
- `packages/doctype/.../vague2-harden.test.ts` — seal CRM/Training/Funding/Documents/Quality, anti-`tenantId`, deny sans slug, ResourceService search+pagination
- `apps/lms-crm/scripts/harden-doctypes.test.ts` — bootstrap réel ≥25 DT, modules présents, perms + samples PermissionEngine
- Wave1 smoke fixtures : `requires` ajoutés (alignement)
- Script root `pnpm test:doctype:harden`

**Vérifs :** `pnpm test:doctype` **8/8** · `pnpm test:doctype:harden` **2/2** · `migrate diff --exit-code` **0**  
(Build prod non relancé ce tour — dernier vert post-G1-E.)

Evidence / ExternalExchange / SD-06 toujours gelés.  
Commit **`b9dd2c3`**.

---

## 2026-08-29 — ack fix Claude mapTransport REST_JSON

Entrée `🔧 corrigé par Claude` (G5 transport) traitée.

- Fix Claude déjà en working tree : `REST_JSON`/`SOAP_XML`/`WEBHOOK` + `verification_level`
- Commit **`619ed47`**
- Re-sync OK : `FRANCE_TRAVAIL_API_KAIROS → PARTIAL_API`, `OPCO_API_CONVERGENCE_APPRENTISSAGE → VERIFIED_API`, `EDOF_DOSSIER → MANUAL_PORTAL`

Evidence toujours gelé.

---

## 2026-08-29 — handoff clean + G5 Financeurs UI/API

`HANDOFF-CLAUDE` : **aucune entrée sans ✅ traité**.

**G5 (hors Evidence)** — commit **`b1198c9`** :
- Page `finance/financeurs` : registre **FundingProvider** Prisma + compteurs FundingCase ; auto-sync matrix si table vide
- API `GET|POST …/finance/financeurs` (liste + sync upsert depuis connector-capabilities.json)
- Helper `lib/funding/sync-providers-from-matrix.ts` + script `scripts/sync-funding-providers.ts`
- Matrice connecteurs conservée en section référence

**Toujours gelé :** Evidence / ExternalExchange / SD-06

---

## 2026-08-29 — handoff clean + G7 Quality DocTypes

`HANDOFF-CLAUDE` : **aucune entrée sans ✅ traité**.

**G7** (suite enchaînement, zéro modèle neuf) — commit **`a324995`** :
- `domains/quality/` : **ComplianceDossier**, **SatisfactionSurvey**, **QualityIncident**
- Bootstrap … Documents → Quality → …
- `ComplianceDossierItem` reste domaine Qualiopi
- Registry **25** DocTypes · bootstrap `ready` · tests 6/6

**Stop avant G8 Evidence** — gelé jusqu’à ack Claude / SD-06. Suite possible hors gate : UI Funding (G5) ou harden DocTypes.

---

## 2026-08-29 — ack db:push faux positif + G6 Documents DocTypes

### Claude `🔧 corrigé` — tables Company/Contact/TrainingRequest

- Cursor confirme : `migrate diff --from-config-datasource --to-schema … --script --exit-code` → **exit 0** (empty migration) — base sync après fix Claude (psql).
- Procédure adoptée : ne plus se fier au seul exit code `db:push` ; toujours `migrate diff --exit-code` après.

### G6 Documents (suite Vague 2, zéro modèle neuf)

DocTypes `domains/documents/` : **FileAsset**, **DocumentRequirementTemplate**, **DocumentRequest**  
Bootstrap : … Training → **Documents** → RH → …  
`ComplianceDossierItem` reste Qualiopi (déjà enregistré).  
Pas Evidence / ExternalExchange / SD-06 readiness moteur.

Vérif : `test:doctype` 6/6 · bootstrap `ready` · getDefinition OK.  
Commit **`975501e`**.

---

## 2026-08-29 — merge Company/Contact/TrainingRequest (ack Claude)

Entrée « review draft CRM OF manquants » traitée (`✅ go merge`).

- Commit **`ef2214f`** — `feat(crm): merge Company, Contact, TrainingRequest Prisma + DocTypes`
- Prisma : enums `CrmCompanyKind`, `TrainingRequestStatus` + modèles `Company`, `Contact`, `TrainingRequest`
- Relations : `Lead.contact`, `Formation.trainingRequests`, Company/Contact ↔ TrainingRequest
- `pnpm db:generate` + `db:push` (localhost `lms_solo`) OK
- DocTypes + register : Company, Contact, TrainingRequest (bootstrap ready)
- Draft mis à jour « MERGÉ »
- Learner : inchangé = alias `Candidature`

**Pas touché :** Evidence / ExternalExchange / SD-06

**Suite plan §76 :** G5 Funding déjà en schéma ; prochain domaine logique = **Documents (G6)** ou UI Funding — hors Evidence.

---

## 2026-08-29 — G3 complété (existant + draft) + G4 Training DocTypes

Consigne user : enchaîner Contact/Company/Learner/TrainingRequest si Prisma, sinon draft → puis G4.

### G3

| Cible | Action |
|-------|--------|
| Lead / FinanceDevis | déjà DocTypes |
| Learner | **pas de table** → DocType **`Candidature`** (alias `learner`) sur Prisma existant |
| Contact / Company / TrainingRequest | **absents** → draft papier [`docs/framework/CRM_OF_MISSING_MODELS_DRAFT.md`](./framework/CRM_OF_MISSING_MODELS_DRAFT.md) — **pas mergé**, ack Claude requis |
| Links CRM | Lead/Devis → `Formation` / `FormationSession` / `Candidature` |

### G4 (zéro modèle neuf)

DocTypes `domains/training/` : **Formation**, **FormationVenueRoom**, **FormationSession**, **FormationSessionParticipant**. Bootstrap : CRM → Training → … → Funding. FundingCase.sessionId/participantId → Links Training.

### Vérifs Cursor

- `pnpm test:doctype` 6/6
- bootstrap `ready` ; getDefinition OK pour Lead, Candidature, Formation*, FundingCase, FinanceDevis

### Pas touché

Evidence / ExternalExchange / SD-06 readiness · pas de merge Company/Contact/TrainingRequest

**Action Claude (optionnel)** : review `CRM_OF_MISSING_MODELS_DRAFT.md` (go/no-go + Learner=Candidature).

---

## 2026-08-29 — handoff traité : Funding commité + G3 CRM OF amorcé

Entrée Claude « build cross-check OK + go » traitée.

**Fait :**
- Commit **`b9d35b5`** — `feat(funding): merge FundingCase Prisma models and DocType registry` (schema + generated client + `domains/funding` + bootstrap).
- G3 démarré : `domains/crm/` — DocTypes **Lead** + **FinanceDevis** (modèles Prisma déjà existants, zéro nouveau modèle) ; `registerCrmDocTypes` dans bootstrap (avant RH).
- `pnpm test:doctype` 6/6 OK.
- Pas Evidence / ExternalExchange / SD-06.

**Suite G3 prévue :** Contact/Company/Learner/TrainingRequest seulement s’ils existent déjà en Prisma ou après draft Claude — pour l’instant seul `Lead` (+ devis) est mappé. Ensuite G4 Training DocTypes (Session, etc.).

---

## 2026-08-29 — état d’avancement (Cursor s’arrête / attend)

User : dernière lecture `HANDOFF-CLAUDE.md` + résumé ici, puis **attendre**.

### HANDOFF-CLAUDE — toutes entrées

| Entrée | Statut |
|--------|--------|
| bug `smoke:doctype` | ✅ traité |
| consigne enchaîne | ✅ traité |
| process + cross-check build | ✅ traité (voir build ci-dessous) |
| review draft FundingCase | ✅ traité (+ ligne gate Claude déjà présente) |

Aucune entrée restante sans `✅ traité`.

### Build post-G1-E (cross-check demandé)

- Commande : `pnpm build` dans `apps/lms-crm` (équivalent filter `@lms-crm`).
- **Résultat : exit 0** (~815 s). Compiled OK · TypeScript OK · 340 static pages.
- Conclusion Cursor : **pas de régression G1-E** côté build ; les runs silencieux Claude étaient très probablement contention locale.

### Vague 1 DocType

| Étape | État |
|-------|------|
| G1-A…G1-E | ✅ fait (legacy deleted, ResourceService only) — commit `f529f85` |
| CH-SAFE IA / Qualiopi histo | ✅ fait |
| Tests `pnpm test:doctype` | 6/6 (session antérieure) |
| `pnpm smoke:doctype` | OK (55 users) |

### Funding / Evidence (gates)

- Claude a écrit **`✅ gate Funding ouvert — draft Prisma OK`** (schéma P0 + DocType register autorisés).
- Cursor a **appliqué en working tree** (non commité) : modèles Funding* dans `schema.prisma`, `pnpm db:generate` + `db:push` OK (DB locale `lms_solo`), DocTypes `domains/funding/` + `registerFundingDocTypes` dans bootstrap.
- **Pas de commit** Funding pour l’instant.
- Consigne user récente : **ne plus avancer / merger Funding–Evidence sans nouvel ack explicite Claude** dans `HANDOFF-CLAUDE.md`. Cursor s’aligne : **pause Funding** (pas d’UI/API EDOF/FT, pas Evidence).
- Evidence / ExternalExchange / SD-06 readiness : **toujours gelés**.

### Prochaine vague (quand relance)

Ordre plan §76 : **G3 CRM OF → G4 Training → G5 Funding UI** (Funding code déjà partiellement amorcé sous gate schéma ; suite UI/connecteurs seulement après ack Claude + respect G3–G4 si Claude le rappelle).

### Cursor maintenant

**En attente** — pas de nouveau chantier jusqu’à message user / entrée Claude.

---

## 2026-08-29 — enchaînement post G1-E + **besoin ack gate Funding**

Consigne user reçue (ne pas s’arrêter). Cursor enchaîne.

**Fait à l’instant :**
- Re-smoke/tests doctype verts (6/6 + User list).
- Aucun import résiduel `lib/framework` / `entity-registry`.
- Lab framework-lab mis à jour (copy G1-E + entité `complianceDossierItem`).
- Freeze Vague 1 levée dans `REFONTE_DOCTYPE_V2_WAVE1_PLAN.md`.
- **Draft Prisma Funding** (non mergé) : [`docs/framework/FUNDING_CASE_PRISMA_DRAFT.md`](./framework/FUNDING_CASE_PRISMA_DRAFT.md)

**Action Claude demandée (gate dual) :**
répondre dans `HANDOFF-CLAUDE.md` par une ligne :
`✅ gate Funding ouvert — draft Prisma OK`  
(ou corrections sur le draft). **Sans cet ack, Cursor ne merge pas** `FundingCase` dans `schema.prisma` (respect consigne « confirmé des deux côtés »).

En attendant : Cursor continue CH-SAFE / lab / harden DocType, pas de merge Funding.

---

## 2026-08-29 — produit Cursor : auto-relance après inactivité ?

**Question** : existe-t-il un réglage (`.cursor/*.json`, setting IDE, ou autre) qui permet à un **Agent local IDE** de se relancer tout seul après inactivité, sans nouveau message utilisateur ?

### Verdict (clair)

**Non.** Il n’existe **pas** de clé produit documentée du type « inactivity timeout → auto-continue dans le même chat local », ni de webhook/MCP officiel qui **pousse un prompt dans une session Agent IDE déjà idle**.

Sources produit : [Agent overview](https://cursor.com/docs/agent/overview), [Cloud Automations](https://cursor.com/docs/cloud-agent/automations), skill interne `/loop`.

### Ce qui existe (et ce que ce n’est pas)

| Mécanisme | Où | Relance le **même chat local idle** ? |
|-----------|-----|----------------------------------------|
| File d’attente / steer | Chat Agent (Enter / Cmd+Enter) | **Non** — seulement pendant qu’un tour **tourne déjà** |
| `/goal` | Agent (rollout) | **Non** — objectif long-lived, mais un **tour** doit démarrer (message / wake) |
| `/loop` **local** | Skill + shell monitoré (`notify_on_output`) | **Pas un setting** — bricolage session-bound : le process shell doit rester attaché à **cette** session Agent ; si le chat est idle/fermé, rien ne « réinjecte » magiquement |
| `cursor-subscriptions-subscribe_timer` | **Cloud Agent** MCP only | **Non pour l’IDE local** — timers cloud ; dans cette session locale le namespace MCP n’est même pas dispo |
| **Automations** (cron, webhook, GitHub, Slack…) | [cursor.com/automations](https://cursor.com/automations) / Agents Window / `/automate` | **Non** — spawn un **Cloud Agent** (nouvelle run / environnement isolé), **pas** injection dans le chat IDE courant |
| Hooks `stop` / follow-up | `.cursor/hooks.json` | **Non** pour inactivité — event en fin de tour agent, pas un cron idle |

### Activation précise des seuls mécanismes « planifiés » officiels

Ce sont des **Cloud Automations**, pas un réglage `.cursor/permissions.json` / `settings.json` pour l’agent local :

1. Créer une automation : UI Agents Window, ou https://cursor.com/automations, ou skill `/automate`.
2. Trigger : **Scheduled** (preset ou expression cron) **ou** **Webhook** (URL + API key générés **après save**).
3. Prompt + outils + repo (souvent « no repository » par défaut pour cron/Slack — à forcer si code).
4. Facturation = usage **cloud agent**.

Il n’y a **pas** de fichier repo du genre `.cursor/auto-continue.json` documenté pour réveiller le chat local.

### Background Agents ↔ session locale

**Pas de handoff produit documenté** « la session locale finit → délègue et continue dans le même fil via Background/Cloud Agent ». Cloud/Automations = runs **séparées** (clone/sandbox, résultats à revoir). La session IDE locale, une fois idle, attend un **nouveau message utilisateur** (ou un wake `/loop` tant que la session + shell tournent encore).

### Implication pour le relais Claude ↔ Cursor

Compter sur un poll `HANDOFF-CLAUDE.md` **sans** message utilisateur **n’est pas supporté nativement** côté Agent IDE. Options produit réelles : (1) ping humain / message court, (2) Automation cloud séparée (autre run), (3) `/loop` local tant que la session Agent est vivante — fragile, pas un daemon global.

---

## 2026-08-29 — G1-E terminé (legacy deleted)

- Supprimé : `lib/framework/{engine,entity,registry,index}.ts`, `lib/auth/entity-registry.ts`, `lib/of/qualiopi-compliance-item-entity.ts`, `runtime-flag.ts`.
- `/api/entities` + users/roles list + `protectRoute` → ResourceService / PermissionEngine uniquement.
- Controllers IAM (`buildListQuery`) pour parité filtres RH / include roles.
- Tests doctype 6/6 + smoke Prisma User OK avant cut.
- **FundingCase Prisma désormais débloqué** (gate G1-E).

À surveiller : UI formulaires génériques `/schema` (shape legacy mappée depuis DocMeta) ; listes users/roles avec includes.

---

## 2026-08-29 — ack settings.local.json + départ G1-E

Oui : c’est bien **Cursor** qui a écrit `.claude/settings.local.json` (même logique allow/deny que `.cursor/permissions.json`, pas YOLO). Pas besoin de révoquer si tu es OK avec le contenu ; pour restreindre davantage, retire des `allow` ou ajoute des `deny` — je ne retoucherai ce fichier que si tu le demandes explicitement.

UI restante pour Samir : **Auto-review** (pas Run Everything).

Enchaîne **G1-E** (delete legacy `lib/framework` + chemins dual-flag) après smoke/tests verts.

---

## 2026-08-29 — permissions Auto-run (pas YOLO)

Configurée allowlist raisonnable (pas Run Everything) :

- Cursor IDE : `.cursor/permissions.json` — `terminalAllowlist` (pnpm/npm/node + git safe subcommands) + `autoRun.block_instructions` (rm -rf, force-push, ssh/prod, DROP…).
- Claude Code : `.claude/settings.local.json` — `permissions.allow` / `deny` style `Bash(pnpm:*)`.

À faire côté UI Cursor (je ne peux pas le forcer en JSON) : **Agents → Approvals & Execution → Auto-review** (pas Run Everything). Reload si l’allowlist UI reste figée.

---

## 2026-08-29 — mécanisme relais + G1-D en cours

### Relais fichiers (réponse produit)

**Pas d’équivalent natif** au poll 5s Claude côté Cursor Agent.

- `alwaysApply` sur `.cursor/rules/handoff-claude.mdc` = texte réinjecté **à chaque tour agent** ≈ **chaque message utilisateur** (pas un daemon idle).
- Idle entre deux messages : Claude peut écrire `HANDOFF-CLAUDE.md` → **Cursor ne se réveille pas tout seul**.
- Best-effort session : `scripts/watch-handoff-claude.ps1` + shell monitoré (`AGENT_LOOP_WAKE_handoff_claude`) — uniquement tant que le chat Agent + le process tournent. Règle mise à jour en ce sens.

Donc pour coller au flux Claude→Cursor sans coller de message : **soit** l’utilisateur envoie un ping court (« check handoff »), **soit** on arme le watcher dans la session Cursor.

### G1-D (état)

- Flag `DOCTYPE_V2_RUNTIME` **défaut ON** (rollback = `=0`).
- `pnpm test:doctype` : 6/6 (dont smoke wave1 7 entités).
- `pnpm smoke:doctype` : fix loader `tsx` (retour Claude traité) ; Prisma list User OK chez Claude (55 users).
- `pnpm build` @lms-crm : compile OK puis **TS fail** sur `PersistenceOrderBy` circulaire — **fix appliqué**, rebuild à rejouer.
- Suite : rebuild vert → G1-E (delete legacy). FundingCase toujours bloqué post G1-E.
