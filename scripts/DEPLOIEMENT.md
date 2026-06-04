# Déploiement VPS — flux officiel (app-prisma)

> **Moteur réel** : scripts Bash ci-dessous + `deploy/deploy-lms.sh`.  
> **Cockpit** (`gsms-deploy`, port 3010) : lance les mêmes fichiers via `DEPLOY_REPO_ROOT` — pas de logique parallèle.  
> **Shell deploiement** : `DEPLOY_PTY_SHELL=bash` sur le terminal-server ; modes non-wizard via `deploy.config.json` + `LMS_DEPLOY_UI_CONFIRM=1`.

## Ordre obligatoire (3 étapes + option rebuild)

| # | Script | Où | Prérequis |
|---|--------|-----|-----------|
| 0 | `0-aide-deploiement.sh` | PC | — |
| 0b | `0-reset-tout.sh` | PC + VPS | optionnel, destructif |
| **1** | `1-etape-preparer-fichiers.sh` | PC seul | — |
| **2** | `2-etape-infra-vps.sh` | PC → SSH VPS | `scripts/.deploy-staging/.env` |
| **3** | `3-etape-apps-vps.sh` | PC → SSH VPS | `scripts/deploy.config.json` + infra sur VPS |
| **R** | `4-etape-rebuild-images.sh` | PC → SSH VPS | infra OK ; sync code + rebuild Docker (pas une 4e étape du stepper) |

```bash
cd /c/laragon/www/app-prisma
./scripts/1-etape-preparer-fichiers.sh
./scripts/2-etape-infra-vps.sh
./scripts/3-etape-apps-vps.sh
# après correctif code (OpenSSL, Prisma, etc.) :
./scripts/4-etape-rebuild-images.sh
```

## Fichiers générés (ne pas supprimer avant fin étape 2)

| Chemin | Contenu |
|--------|---------|
| `scripts/.deploy-staging/` | `.env`, `SECRETS.txt`, `docker-compose.yml`, Caddyfile |
| `scripts/deploy.config.json` | SSH, domaines, chemins VPS — **sans** mots de passe |

## Moteur (`deploy/` — ne pas lancer à la main)

| Fichier | Rôle |
|---------|------|
| `deploy-lms.sh` | `--prepare-only` · `--infra-only` · `--apps-only` · `--rebuild-only` |
| `run-ui-wrapper` | Sortie PTY pour le cockpit (interne) |
| `deploy-lms-remote.sh` | Exécuté **sur** le VPS |
| `deploy-gsms-apps.sh` | Build images + `compose up` (étape 3) |
| `deploy-rebuild-images.sh` | Rebuild images seulement |
| `gsms-db-init.sh` | Migrations Prisma (`packages/database`) |
| `deploy-pm2-apps.sh` | Runtime PM2 générique (non-Docker) |
| `deploy-systemd-apps.sh` | Runtime systemd générique (non-Docker) |
| `deploy-python-apps.sh` | Runtime Python générique (non-Docker) |
| `deploy-php-fpm-apps.sh` | Runtime PHP-FPM générique (non-Docker) |
| `deploy-go-apps.sh` | Runtime Go générique (non-Docker) |
| `deploy-static-apps.sh` | Runtime static générique (non-Docker) |


## Runtime PM2 (non-Docker)

Exemple:

```bash
PM2_APP_NAME=gsms-crm \
PM2_APP_DIR=/opt/app-prisma/apps/lms-crm \
PM2_START_COMMAND="pnpm start" \
./scripts/deploy/deploy-lms.sh --apps-only --runtime pm2
```

## Runtime systemd (non-Docker)

Exemple:

```bash
SYSTEMD_SERVICE_NAME=gsms-crm \
SYSTEMD_APP_DIR=/opt/app-prisma/apps/lms-crm \
SYSTEMD_START_COMMAND="pnpm start" \
./scripts/deploy/deploy-lms.sh --apps-only --runtime systemd
```

## Runtime Python (non-Docker)

Exemple:

```bash
PY_APP_DIR=/opt/app-prisma/apps/api \
PY_START_COMMAND="gunicorn app:app -b 0.0.0.0:8000" \
./scripts/deploy/deploy-lms.sh --apps-only --runtime python
```

## Runtime PHP-FPM (non-Docker)

Exemple:

```bash
PHP_APP_DIR=/opt/app-prisma/apps/php-app \
PHPFPM_POOL_NAME=gsms-php-app \
./scripts/deploy/deploy-lms.sh --apps-only --runtime php-fpm
```

## Runtime Go (non-Docker)

Exemple:

```bash
GO_APP_DIR=/opt/app-prisma/apps/go-api \
GO_BUILD_COMMAND="go build -o app ./cmd/api" \
GO_SERVICE_NAME=gsms-go-api \
./scripts/deploy/deploy-lms.sh --apps-only --runtime go
```

## Runtime Static (non-Docker)

Exemple:

```bash
STATIC_SOURCE_DIR=/opt/app-prisma/apps/landing \
STATIC_BUILD_COMMAND="pnpm build" \
STATIC_BUILD_OUTPUT_DIR=out \
STATIC_TARGET_DIR=/var/www/gsms-landing \
./scripts/deploy/deploy-lms.sh --apps-only --runtime static
```

## Structure monorepo attendue sur le VPS

```
/opt/app-prisma/          ← sync tar depuis le PC (étapes 3 / rebuild)
  packages/database/      ← prisma migrate
  deploy/gsms/            ← Dockerfiles
/opt/gsms/                ← stack (.env, compose, Caddy)
```

## Cockpit vs scripts

- `packages/deploy-engine/docs/MIGRATION-LIB-DEPLOY.md` (dans **gsms-deploy**) = feuille de route TypeScript cockpit uniquement.
- Ce fichier = **vérité** pour le déploiement LMS sur VPS.
