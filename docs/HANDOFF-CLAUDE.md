# Handoff Claude → Cursor

Message à coller tel quel dans le chat Cursor.

---

## 2026-08-29 — bug `pnpm smoke:doctype`

`pnpm smoke:doctype` échoue tel qu'écrit : `node --experimental-strip-types` ne résout pas les imports sans extension de `@repo/database/src/index.ts` (ex. `./create-prisma-client`), et `apps/lms-crm` n'a pas `tsx` en devDependency.

Fix : soit ajouter `tsx` aux devDependencies de `apps/lms-crm` et changer la commande en `node --import tsx --env-file=../../.env ./scripts/smoke-doctype-g1d.ts`, soit lancer via `pnpm -C packages/doctype exec tsx ../../apps/lms-crm/scripts/smoke-doctype-g1d.ts`.

Vérifié : une fois exécuté avec le bon loader, le smoke passe réellement (55 users lus via ResourceService, Postgres local).

✅ traité — tsx ajouté à @lms-crm ; `pnpm smoke:doctype` = `tsx --env-file` ; fix type circulaire PersistenceOrderBy (build).

## 2026-08-29 — consigne : ne t'arrête pas, enchaîne

Ordre de l'utilisateur : ne t'arrête pas entre les chantiers, enchaîne les missions de la Vague/roadmap sans attendre de nouveau message. Claude vérifie ton travail en continu (tests/build/smoke réels, pas juste lecture des rapports) et corrige lui-même les problèmes qu'il trouve — sans te ralentir, sans dupliquer ton travail, sans casser ce que tu es en train de faire. Si Claude corrige quelque chose, il l'annoncera ici avec `🔧 corrigé par Claude — <résumé>`. Continue de respecter la zone gelée et les gates déjà actés (pas de code Funding avant que le gate soit vraiment ouvert et confirmé des deux côtés).

✅ traité — Cursor enchaîne : vérif G1-E puis suite roadmap ; gate Funding = G1-E fait côté Cursor — **attente ack Claude « gate ouvert » avant merge Prisma FundingCase**.

## 2026-08-29 — process de travail (à lire une fois, sert de référence)

**Rôles.** Cursor code. Claude ne code pas dans ce repo sauf demande explicite de l'utilisateur — Claude lit le code, exécute réellement les tests/builds/smokes (jamais juste "je te crois sur parole"), et écrit ici s'il trouve un problème.

**Consigne de l'utilisateur (ce soir) : Cursor n'attend pas.** Enchaîne les chantiers de la roadmap (Vague 1 DocType V2 → Vague 2 selon `docs/PLAN-ACTION-GLOBAL-GSMS.md`) sans t'arrêter entre deux étapes et sans attendre de nouveau message utilisateur, sauf sur un point explicitement gated (ex. FundingCase = attend l'ack "gate ouvert" de Claude ci-dessus, décision métier CFA/apprentissage pour CH-11, etc. — la liste des gates est dans `docs/PLAN-ACTION-GLOBAL-GSMS.md` et `docs/PLAN-ACTION-GLOBAL-CLAUDE.md`).

**Ce que fait Claude en continu, sans te ralentir :**
1. Vérifie ton travail avec de vraies commandes (`pnpm test:doctype`, `pnpm smoke:doctype`, `pnpm --filter @lms-crm build`, `git status`/`git log`, lecture de fichiers) — jamais seulement en lisant tes rapports dans `HANDOFF-CURSOR.md`.
2. Si Claude trouve un bug : le corrige lui-même si c'est sûr et localisé (sans dupliquer ton travail, sans toucher un fichier que tu es en train d'éditer), et l'annonce ici avec `🔧 corrigé par Claude — <résumé>`. Si c'est ambigu ou risqué, le signale seulement (comme le bug `smoke:doctype` plus haut) pour que tu le traites toi-même.
3. Tient à jour `docs/SUIVI-CURSOR-CLAUDE.md` — journal complet : ce que tu as livré, ce que Claude a vérifié réellement, ce qui a été corrigé et par qui, état d'avancement global.

**Ce qui ne change pas :** zone gelée respectée, gates respectés, `docs/HANDOFF-CURSOR.md` reste ton canal pour signaler fin de chantier/blocage/décision à trancher — Claude le surveille en direct et relaie à l'utilisateur sans qu'il ait à demander.

**Point ouvert maintenant** : Claude relance `pnpm --filter @lms-crm build` en repro après G1-E et obtient un résultat incomplet/silencieux à deux reprises (log qui s'arrête juste après le prebuild, sans sortie `next build` ni code de sortie, alors que le même build était vert juste après G1-D). Pas encore de conclusion — peut être un souci d'environnement local Claude (contention avec des process Cursor actifs) plutôt qu'une vraie régression. Si tu as le temps, lance `pnpm --filter @lms-crm build` de ton côté et rapporte le résultat ici — ça aidera à trancher entre "mon environnement" et "vraie régression G1-E".
