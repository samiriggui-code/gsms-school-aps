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
cd c:\laragon\www\app-prisma
.\scripts\1-etape-preparer-fichiers.ps1
```

Réponses typiques :

| Question | Valeur |
|----------|--------|
| IP VPS | `187.77.166.124` |
| Domaine | `gsms-security.com` |
| SMTP | `smtp.hostinger.com` / `465` / `true` |
| Email SMTP | `admin@gsms-security.com` + mot de passe boîte Hostinger |
| HTTPS | Oui (Traefik + Let's Encrypt) |

Sortie : `scripts\.deploy-staging\` (`.env`, secrets générés, Traefik, compose).

Modèle config : `scripts\deploy.config.hostinger.example.json`

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
| Landing | `https://gsms-security.com` |
| CRM | `https://crm.gsms-security.com` |
| Docs | `https://docs.gsms-security.com` |
| Monitoring | `https://monitoring.gsms-security.com` |
| Portainer | `https://portainer.gsms-security.com` |
| Uptime | `https://uptime.gsms-security.com` |
| Netdata | `https://netdata.gsms-security.com` |

## Secrets

- Générés automatiquement : Postgres, MinIO, `NEXTAUTH_SECRET`, `AUTH_SECRET`
- Fichier local : `scripts\.deploy-staging\SECRETS.txt`
- Sur le VPS : `/opt/gsms/SECRETS.txt` et `/opt/gsms/.env`
- **SMTP_PASS** : à compléter si non saisi à l’étape 1

## Manuel sur le VPS (secours)

```bash
git clone https://github.com/samiriggui-code/gsms-school.git /opt/app-prisma
# Copier scripts/.deploy-staging/* vers /opt/gsms/
cd /opt/gsms && docker compose up -d
cd /opt/app-prisma && docker build -f deploy/gsms/Dockerfile.crm -t gsms-crm:latest .
docker compose -f /opt/gsms/docker-compose.yml --profile apps up -d
```

Voir aussi `deploy/gsms/README.md` et `DOCKER_DEPLOIEMENT.md`.
