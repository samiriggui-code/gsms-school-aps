This is the active LMS monorepo for a single school (single-tenant execution).

Current target:
- `apps/lms-landing`: public landing and acquisition entrypoint

- `apps/lms-crm`: CRM/admin operations (administratif, suivi, facturation)
- `apps/docs-lms`: internal team documentation

Core architecture constraints:
- Authentication: NextAuth only (no Clerk)
- Database: Prisma + PostgreSQL
- Single shared DB: `lms_app` for app + crm
- Shared schema + seed: `packages/database/prisma`
- Shared auth logic: `packages/auth`

Current product constraints:
- No public signup in `lms-crm` (landing = acquisition only)
- Landing is the public entrypoint; signup/prospect flow will live there
- Keep reset-password and harden it (rate limit + logs)
- Keep role-based redirection and app access controls as priority work

UI layout (CRM) :
- Section / module / sous-module : voir `.cursor/rules/gestion-ressources-layout.mdc`
- Référence canonique : `apps/lms-crm/app/(protected)/gestion-ressources/`

Workflow technique (obligatoire avant feature) :
- Lire `packages/database/prisma/schema.prisma` puis API `apps/lms-crm/app/api/sections/*`
- Packages : `database`, `api-core`, `auth`, `redis`, `storage`, `workers`
- Règle détaillée : `.cursor/rules/monorepo-feature-workflow.mdc`