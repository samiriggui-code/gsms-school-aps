# Monorepo Agent Rules

## Database Source of Truth

- The Prisma source of truth is `packages/database/prisma`.
- Never recreate a local Prisma schema/seed/migrations under `apps/lms-crm/prisma`.
- For DB operations, always use centralized paths/scripts:
  - `pnpm db:push`
  - `pnpm db:generate`
  - `pnpm db:seed`

## Seed Policy

- All demo users must use the domain `@ecole.local`.
- `demo@kt.com` and `owner@kt.com` are deprecated and must not be recreated.
- The reference distribution is managed in `packages/database/prisma/seed.js`.
