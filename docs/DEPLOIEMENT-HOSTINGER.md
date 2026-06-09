# Déploiement Hostinger VPS — FORM'SSI LMS

Stack : **Docker** + **Traefik** (HTTPS Let's Encrypt) + **Postgres** + **Redis** + **MinIO** + monitoring (Homepage, Portainer, Uptime Kuma, Netdata).

## Prérequis Hostinger

- VPS KVM **4 Go RAM** minimum
- Ubuntu 22/24, accès **SSH root**
- DNS **A** vers l’IP du VPS (ex. `187.77.166.124`) :
  - `@`, `www` → landing
  - `crm`, `app`, `api` → CRM
  - `docs`, `monitoring`, `portainer`, `uptime`, `netdata`

## 1. Préparer les fichiers (PC)

```powershell
cd c:\laragon\www\gsms-school
.\scripts\1-etape-preparer-fichiers.ps1
```

Réponses typiques (FORM'SSI / `hosting-global-it-ss.com`) :

| Question | Valeur |
|----------|--------|
| IP VPS | IP Hostinger (panneau VPS) |
| Domaine | `hosting-global-it-ss.com` |
| Dossier code VPS | `/opt/gsms-school` |
| SMTP | `smtp.hostinger.com` / `465` / `true` |
| Email SMTP | boîte Hostinger du domaine + mot de passe |
| HTTPS | Oui (Traefik + Let's Encrypt) |

Sortie : `scripts\.deploy-staging\` (`.env`, secrets générés, Traefik, compose).

Modèles config : `scripts\deploy.config.hostinger-global-it.example.json`

## 2. Infra sur le VPS

```powershell
.\scripts\2-etape-infra-vps.ps1
```

Installe Docker, envoie la stack vers `/opt/gsms`, démarre Postgres / Redis / Traefik / monitoring.

## 3. Applications

```powershell
.\scripts\3-etape-apps-vps.ps1
```

Sync le code, build les images `gsms-crm`, `gsms-landing`, `gsms-worker`, migrations Prisma.

## URLs générées (exemple)

| Service | URL |
|---------|-----|
| Landing | `https://hosting-global-it-ss.com` |
| CRM | `https://crm.hosting-global-it-ss.com` |
| Docs | `https://docs.hosting-global-it-ss.com` |
| Monitoring | `https://monitoring.hosting-global-it-ss.com` |
| Portainer | `https://portainer.hosting-global-it-ss.com` |
| Uptime | `https://uptime.hosting-global-it-ss.com` |
| Netdata | `https://netdata.hosting-global-it-ss.com` |

## Secrets

- Générés automatiquement : Postgres, MinIO, `NEXTAUTH_SECRET`, `AUTH_SECRET`
- Fichier local : `scripts\.deploy-staging\SECRETS.txt`
- Sur le VPS : `/opt/gsms/SECRETS.txt` et `/opt/gsms/.env`
- **SMTP_PASS** : à compléter si non saisi à l’étape 1

## Manuel sur le VPS (secours)

```bash
git clone https://github.com/samiriggui-code/gsms-school.git /opt/gsms-school
# Copier scripts/.deploy-staging/* vers /opt/gsms/
cd /opt/gsms && docker compose up -d
cd /opt/gsms-school && docker build -f deploy/gsms/Dockerfile.crm -t gsms-crm:latest .
docker compose -f /opt/gsms/docker-compose.yml --profile apps up -d
```

Voir aussi `deploy/gsms/README.md` et `DOCKER_DEPLOIEMENT.md`.
