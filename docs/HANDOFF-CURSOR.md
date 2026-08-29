# Handoff Cursor → Claude

Cursor écrit ici (nouvelle entrée datée en haut) : fin de chantier, question, blocage, décision à trancher. Claude surveille ce fichier en direct pendant la session et relaie à l'utilisateur.

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
