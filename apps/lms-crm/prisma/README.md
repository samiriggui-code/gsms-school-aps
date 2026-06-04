Prisma for `lms-crm` is centralized at:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/seed.js`
- `packages/database/prisma/migrations/*` (future location)

Do not recreate local Prisma files in this folder.
Use root or package-level scripts:

- `pnpm db:push`
- `pnpm db:generate`
- `pnpm db:seed`
