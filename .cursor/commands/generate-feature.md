Generate a complete feature for this LMS monorepo (single-tenant).

Context:
- Single app: `apps/lms-crm` (landing `(site)/`, CRM `(protected)/`, docs `/docs`, APIs)
- Shared packages:
  - `packages/database` (Prisma schema/seed/client)
  - `packages/auth` (NextAuth shared logic)

Must include (when relevant):
- database impact on shared schema `packages/database/prisma/schema.prisma`
- API routes under `apps/lms-crm/app/api/` (`sections/*` for CRM, short public routes at root)
- server actions
- UI pages/components
- integration (menu, permissions, navigation between route groups)

Strict constraints:
- **Step 0**: Read `packages/database/prisma/schema.prisma` — reuse or extend schema before UI/API (see `.cursor/rules/monorepo-feature-workflow.mdc`)
- API only under `apps/lms-crm/app/api/sections/{section}/...` mirroring UI paths; use `ok`/`fail`, `StatService` from `@repo/api-core`, `@repo/storage` for files, `@repo/workers` for async jobs
- Use NextAuth (never Clerk)
- Keep architecture single-tenant (no tenantId/tenantUserId reintroduction)
- Prefer adapting existing project structure over new stack additions
- Avoid unnecessary new dependencies

Output format:
1) Goal and scope
2) Implementation plan by steps
3) Files created/updated
4) Environment changes (if any)
5) Validation steps (lint/typecheck/tests/manual)
6) README roadmap update checklist

Production-ready only.
