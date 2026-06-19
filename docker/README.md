# Dossier `docker/` — historique

**Ne plus ajouter de Dockerfiles ici.**

| Besoin | Fichier à utiliser |
|--------|-------------------|
| **Prod VPS** (app + worker + postgres…) | `deploy/gsms/docker-compose.yml` |
| **Image app Next.js** | `deploy/gsms/Dockerfile.app` |
| **Worker Playwright / Chromium** (rapports PDF) | `deploy/gsms/Dockerfile.worker` |
| **Dev local — worker seul en Docker** | `docker-compose.workers.yml` (racine) → build via `deploy/gsms/Dockerfile.worker` |

Le worker **n’est pas** dans l’image Next.js : c’est un conteneur séparé basé sur `mcr.microsoft.com/playwright` (Chromium pour générer les PDF).

```bash
# Dev : CRM sur la machine (pnpm dev:crm) + worker en Docker
pnpm dev:crm
docker compose -f docker-compose.workers.yml up -d --build

# Prod sur VPS
SKIP_GIT=1 bash /opt/gsms-school/deploy/gsms/deploy.sh
```

L’ancien `docker/Dockerfile.workers` a été retiré (doublon de `deploy/gsms/Dockerfile.worker`).
