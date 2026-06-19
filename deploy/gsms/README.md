# Déploiement production GSMS

## Lancer depuis ton PC (recommandé)

```powershell
.\deploy\gsms\deploy.ps1
# ou
pnpm deploy:vps
```

Script **interactif** : connexion VPS, assistant `.env`, choix d’action, puis pack → SCP → `deploy.sh` → verify.

La config VPS est mémorisée dans `deploy/gsms/config/deploy.local.json` (hors Git).

---

Source de vérité pour le VPS Hostinger. Deux répertoires sur le serveur :

| Chemin | Rôle |
|--------|------|
| `/opt/gsms-school` | Code monorepo (git ou tar) |
| `/opt/gsms` | Stack Docker + `.env` prod (secrets, **hors Git**) |

Repo : `git@github.com:samiriggui-code/gsms-school-final.git`

## Stack Docker

| Conteneur | Image | Port hôte | Rôle |
|-----------|-------|-----------|------|
| `gsms-app` | `Dockerfile.app` | 3001 | Next.js standalone (site + CRM + portails) |
| `gsms-worker` | `Dockerfile.worker` | — | Jobs async + PDF Playwright/Chromium |
| `gsms-postgres` | postgres:16 | — | Base `lms_app` |
| `gsms-redis` | redis:7 | — | Cache / files |
| `gsms-minio` | minio | — | Stockage S3 |
| `gsms-homepage` | gethomepage | 3005 | Monitoring interne |

Traefik externe (déjà sur le VPS) route HTTPS vers `3001` et `3005` via labels Docker **et** fichier `traefik/dynamic/routers.yaml` (domaines lus depuis `.env`).

## Fichiers importants

```
deploy/gsms/
├── deploy.ps1        # ★ Script interactif Windows (point d'entrée)
├── pack.ps1          # Archive tar.gz seule
├── deploy.sh         # Orchestration VPS (Docker)
├── install.sh        # premier install (RESET_DB=1)
├── verify.sh         # healthcheck post-deploy
├── pack.ps1          # archive + scp depuis Windows
├── db-init.sh        # migrate + push + seed
└── traefik/dynamic/routers.yaml
```

## Premier déploiement

### 1. Secrets sur le VPS

```powershell
# En local : copier le template et renseigner les secrets
cp deploy/gsms/.env.example deploy/gsms/.env
# Éditer deploy/gsms/.env (POSTGRES_PASSWORD_ENCODED = URL-encodé)

scp -i $env:USERPROFILE\.ssh\id_ed25519 deploy/gsms/.env root@187.77.166.124:/opt/gsms/.env
ssh root@187.77.166.124 "mkdir -p /opt/gsms && chmod 600 /opt/gsms/.env"
```

### 2. Code sur le VPS

**Option A — tar (recommandé si pas de clé deploy GitHub)**

```powershell
.\deploy\gsms\pack.ps1 -Scp -Extract -Deploy
# Envoie aussi deploy/gsms/.env si déjà présent en local (scp séparé avant -Deploy)
```

**Option B — git sur le VPS**

```bash
git clone git@github.com:samiriggui-code/gsms-school-final.git /opt/gsms-school
bash /opt/gsms-school/deploy/gsms/install.sh
```

### 3. Vérification

```bash
bash /opt/gsms/verify.sh
curl -s http://127.0.0.1:3001/api/common/health
# HTML / doit faire > 20 Ko (16384 = bug stream → rebuild app)
```

## Mise à jour

```powershell
# Depuis Windows
.\deploy\gsms\pack.ps1 -Scp -Extract -Deploy
```

```bash
# Sur le VPS (git)
cd /opt/gsms-school && git pull origin main
SKIP_GIT=1 REBUILD_WORKER=1 bash /opt/gsms-school/deploy/gsms/deploy.sh
```

### Variables deploy.sh

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SKIP_GIT=1` | — | Code déjà présent (tar) |
| `REBUILD_WORKER=1` | 1 | Rebuild image Playwright |
| `DOCKER_BUILD_NO_CACHE=1` | — | Build sans cache |
| `SKIP_DB_INIT=1` | — | Pas de migrate/seed |
| `RESET_DB=1` | — | Drop volume postgres (**destructif**) |

## Worker Chromium (rapports PDF)

- **Pas** dans l'image app — conteneur `gsms-worker` séparé
- Image : `mcr.microsoft.com/playwright:v1.52.0-jammy`
- Code : `packages/workers/src/report-generator.ts`
- Rendu HTML : `apps/lms-crm/app/reports/render/[jobId]/page.tsx`
- `REPORT_APP_BASE_URL=http://gsms-app:3001` (réseau Docker interne)

## URLs (exemple prod actuelle)

| Service | URL |
|---------|-----|
| App | https://hosting-global-it-ss.com |
| Connexion CRM | https://hosting-global-it-ss.com/signin |
| Docs | https://hosting-global-it-ss.com/docs |
| Formateur | https://hosting-global-it-ss.com/formateur |
| E-formation | https://hosting-global-it-ss.com/e-formation |
| Monitoring | https://monitoring.hosting-global-it-ss.com |

`CRM_HOST` = domaine seul (`hosting-global-it-ss.com`), sans chemin.

## Variables métier notables

- `LMS_CONTENT_REVIEW_REQUIRED=false` → publication directe des cours formateur
- `MUX_SIGNING_KEY_ID` + `MUX_SIGNING_PRIVATE_KEY` → lecteur vidéo Mux (dashboard Mux → Signing Keys)
- `SENTRY_DSN` vide → Sentry désactivé (évite injection headers en prod)

## Dev local (sans VPS)

```bash
pnpm dev:crm
pnpm dev:workers
# ou Docker worker seul :
docker compose -f docker-compose.workers.yml up -d --build
```

## Dépannage

```bash
docker logs gsms-app --tail 80
docker logs gsms-worker --tail 50
docker ps | grep gsms
df -h /
bash /opt/gsms/docker-cleanup.sh   # libère espace disque Docker
```

**Stream HTML bloqué à 16 384 octets** : rebuild `gsms-app` (`Dockerfile.app` utilise `next build --webpack`).
