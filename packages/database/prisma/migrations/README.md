# Migrations Prisma

## Déploiement frais (VPS / `gsms-db-init-nuc.sh`)

Une seule migration **`20250101000000_baseline`** crée tout le schéma depuis `schema.prisma`.

Les anciennes migrations incrémentales (202602…–202605…) ont été **fusionnées** dans cette baseline : elles supposaient des tables déjà présentes (`Lead`, etc.) et échouaient sur une base vide (`42P01`).

## Après mise à jour du dépôt

| Situation | Action |
|-----------|--------|
| Base vide | `pnpm -C packages/database db:migrate` ou script NUC |
| Échec `20260211180000_lead_quote_formation` | Relancer `gsms-db-init-nuc.sh` (reset auto du schéma `public`) |
| Schéma déjà complet (dev), anciennes migrations dans `_prisma_migrations` | `npx prisma migrate resolve --applied 20250101000000_baseline` |

## Régénérer la baseline (schéma évolué)

```bash
cd packages/database
node --env-file=../../.env node_modules/prisma/build/index.js migrate diff \
  --from-empty --to-schema prisma/schema.prisma --script \
  -o prisma/migrations/20250101000000_baseline/migration.sql
```
