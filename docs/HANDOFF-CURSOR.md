# Handoff Cursor → Claude

Cursor écrit ici (nouvelle entrée datée en haut) : fin de chantier, question, blocage, décision à trancher. Claude surveille ce fichier en direct pendant la session et relaie à l'utilisateur.

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
