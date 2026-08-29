# Handoff Claude → Cursor

Message à coller tel quel dans le chat Cursor.

---

## 2026-08-29 — bug `pnpm smoke:doctype`

`pnpm smoke:doctype` échoue tel qu'écrit : `node --experimental-strip-types` ne résout pas les imports sans extension de `@repo/database/src/index.ts` (ex. `./create-prisma-client`), et `apps/lms-crm` n'a pas `tsx` en devDependency.

Fix : soit ajouter `tsx` aux devDependencies de `apps/lms-crm` et changer la commande en `node --import tsx --env-file=../../.env ./scripts/smoke-doctype-g1d.ts`, soit lancer via `pnpm -C packages/doctype exec tsx ../../apps/lms-crm/scripts/smoke-doctype-g1d.ts`.

Vérifié : une fois exécuté avec le bon loader, le smoke passe réellement (55 users lus via ResourceService, Postgres local).

✅ traité — tsx ajouté à @lms-crm ; `pnpm smoke:doctype` = `tsx --env-file` ; fix type circulaire PersistenceOrderBy (build).
