This is the active LMS monorepo for a single school (single-tenant execution).

Current target:
- `apps/lms-crm`: single Next.js app — public landing `(site)/`, CRM `(protected)/`, docs `/docs`, APIs

Core architecture constraints:
- Authentication: NextAuth only (no Clerk)
- Database: Prisma + PostgreSQL
- Single shared DB: `lms_app` for app + crm
- Shared schema + seed: `packages/database/prisma`
- Shared auth logic: `packages/auth`

Current product constraints:
- Landing is the public entrypoint at `/` in `lms-crm`
- Signup/prospect flow will live on the landing (not CRM backoffice signup)
- Keep reset-password and harden it (rate limit + logs)
- Keep role-based redirection and app access controls as priority work

UI layout (CRM) :
- Section / module / sous-module : voir `.cursor/rules/gestion-ressources-layout.mdc`
- Référence canonique : `apps/lms-crm/app/(protected)/gestion-ressources/`

Workflow technique (obligatoire avant feature) :
- Lire `packages/database/prisma/schema.prisma` puis API `apps/lms-crm/app/api/sections/*`
- Packages : `database`, `api-core`, `auth`, `redis`, `storage`, `workers`
- Règle détaillée : `.cursor/rules/monorepo-feature-workflow.mdc`
