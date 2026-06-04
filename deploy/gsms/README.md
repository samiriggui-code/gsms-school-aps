# Stack Docker GSMS / LMS (Traefik)

Déploiement production du monorepo sur VPS (Hostinger, etc.).

## Contenu

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Traefik, Postgres, Redis, MinIO, monitoring, apps |
| `templates/` | `.env`, Traefik, Homepage (générés par `scripts/1-etape-preparer-fichiers.ps1`) |
| `Dockerfile.crm` / `.landing` / `.worker` / `.docs` | Images Next.js / worker / Mintlify |
| `traefik/` | Config statique HTTP de secours |

## Préparation (PC Windows)

```powershell
cd c:\laragon\www\app-prisma
.\scripts\1-etape-preparer-fichiers.ps1
```

Génère `scripts\.deploy-staging\` avec secrets **aléatoires** (Postgres, MinIO, `NEXTAUTH_SECRET`, `AUTH_SECRET`) et URLs selon vos domaines.

SMTP Hostinger par défaut : `smtp.hostinger.com:465` — saisir le mot de passe boîte mail à l’étape 1 ou dans `/opt/gsms/.env` sur le VPS.

## Déploiement VPS

```powershell
.\scripts\2-etape-infra-vps.ps1   # Docker, infra, Traefik, Postgres
.\scripts\3-etape-apps-vps.ps1   # Build images + CRM + landing + worker
```

Chemins VPS par défaut : `/opt/gsms` (stack), `/opt/app-prisma` (code pour build).

## DNS (exemple)

Tous les enregistrements **A** vers l’IP du VPS :

| Hôte | Service |
|------|---------|
| `@` / `www` | Landing |
| `crm` | CRM |
| `app` / `api` | Alias → CRM |
| `docs` | Documentation Mintlify |
| `monitoring` | Homepage ops |
| `portainer` | Portainer |
| `uptime` | Uptime Kuma |
| `netdata` | Netdata |

## Build manuel (sur le VPS)

```bash
cd /opt/app-prisma
docker build -f deploy/gsms/Dockerfile.crm -t gsms-crm:latest .
docker build -f deploy/gsms/Dockerfile.landing -t gsms-landing:latest .
docker build -f deploy/gsms/Dockerfile.worker -t gsms-worker:latest .
cd /opt/gsms
docker compose --profile apps up -d
```

Migrations : `scripts/deploy/gsms-db-init.sh` (via étape 3).

## HTTPS

Traefik + Let's Encrypt (`TRAEFIK_EMAIL` dans les templates). Ports **80** et **443** ouverts vers le VPS.
