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
- **absences RH → statuts User** : chaque heure + quotidien a 00h10 (debut/fin de periode)
- **rapports PDF + Excel** : toutes les 30 s (`ReportGenerationJob` → Playwright / exceljs → storage)

Prerequis PDF local : `pnpm exec playwright install chromium` (depuis `packages/workers`).

Production Docker :
```bash
# Image prod (VPS) — deploy/gsms/deploy.sh
docker build -f deploy/gsms/Dockerfile.worker -t gsms-worker:latest .

# Dev local
docker compose -f docker-compose.workers.yml up -d --build
```
Image basée sur `mcr.microsoft.com/playwright` (Chromium préinstallé). `REPORT_APP_BASE_URL` doit pointer vers le CRM (`http://gsms-app:3001` en prod, `http://host.docker.internal:3001` en dev Docker).
