# @repo/workers

Package reserve aux traitements asynchrones:

- queues
- jobs
- processors
- schedulers

Utilisation cible: decharger les endpoints synchrones (exports, agregations, notifications).

## Demarrage

Inclus dans `pnpm dev` a la racine (CRM + landing + docs + workers en parallele).

Worker seul (fichier `.env` avec `DATABASE_URL` requis) :

```bash
pnpm dev:workers
```

Le worker utilise `createPrismaClient('workers')` (adapter PostgreSQL, Prisma 7) — pas `new PrismaClient()` nu.

Jobs planifies :

- stats Redis : toutes les heures
- file `CrmEventOutbox` → notifications in-app : chaque minute
