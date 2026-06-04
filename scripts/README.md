# Scripts du projet

Guide détaillé : **[DEPLOIEMENT.md](./DEPLOIEMENT.md)**

## Interface cockpit (optionnel)

```bash
# Depuis gsms-deploy (pas app-prisma) :
pnpm dev:deploy   # http://127.0.0.1:3010
```

`DEPLOY_REPO_ROOT` doit pointer vers ce dossier (`app-prisma`). Le cockpit exécute les mêmes scripts Bash que ci-dessous.

## Déploiement VPS (ordre)

| Script | Rôle |
|--------|------|
| `0-aide-deploiement.sh` | Affiche le guide |
| `0-reset-tout.sh` | Remise à zéro PC + VPS |
| `1-etape-preparer-fichiers.sh` | **PC** : `.deploy-staging/` + `deploy.config.json` |
| `2-etape-infra-vps.sh` | **VPS** : stack, Docker, Postgres, Caddy |
| `3-etape-apps-vps.sh` | **VPS** : build images, migrations Prisma |
| `4-etape-rebuild-images.sh` | **VPS** : rebuild Docker après correctifs code (hors stepper) |

```bash
cd /c/laragon/www/app-prisma
./scripts/1-etape-preparer-fichiers.sh
./scripts/2-etape-infra-vps.sh
./scripts/3-etape-apps-vps.sh
```

## Fichiers générés

- `scripts/.deploy-staging/` — `.env`, `SECRETS.txt`, `docker-compose.yml`, Caddyfile
- `scripts/deploy.config.json` — paramètres sans mots de passe

## Dossier `deploy/` (moteur)

| Fichier | Usage |
|---------|--------|
| `deploy-lms.sh` | Moteur (`--prepare-only`, `--infra-only`, `--apps-only`, `--rebuild-only`) |
| `run-ui-wrapper` | Wrapper PTY cockpit (interne, hors parcours scripts Bash) |
| `deploy-lms-remote.sh` | Exécuté sur le VPS |
| `deploy-gsms-apps.sh` | Build + démarrage apps |
| `deploy-rebuild-images.sh` | Rebuild images seul |
| `gsms-db-init.sh` | Migrations + seed |
| `deploy-pm2-apps.sh` | Runtime PM2 générique (non-Docker) |
| `deploy-systemd-apps.sh` | Runtime systemd générique (non-Docker) |
| `deploy-python-apps.sh` | Runtime Python générique (non-Docker) |
| `deploy-php-fpm-apps.sh` | Runtime PHP-FPM générique (non-Docker) |
| `deploy-go-apps.sh` | Runtime Go générique (non-Docker) |
| `deploy-static-apps.sh` | Runtime static générique (non-Docker) |


## Dossier `dev/`

Scripts de maintenance locale — sans lien avec le déploiement VPS.

## Exemple de config

`deploy.config.example.json` — modèle pour `deploy.config.json`.
