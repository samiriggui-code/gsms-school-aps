# Guide de déploiement Docker — LMS Monorepo & stack GSMS

> **Source de vérité VPS / NUC :** dossier [`deploy/gsms/`](deploy/gsms/)  
> **Déploiement recommandé :** [`scripts/deploy-lms.ps1`](scripts/deploy-lms.ps1) (`-InfraOnly` puis `-AppsOnly`)  
> Détail : [`deploy/gsms/README-DEPLOY.md`](deploy/gsms/README-DEPLOY.md)

## Table des matières

1. [Vue d’ensemble](#vue-densemble)
2. [Stack tout-en-un GSMS (NUC / VPS)](#stack-tout-en-un-gsms-nuc--vps)
3. [État du déploiement NUC](#état-du-déploiement-nuc)
4. [URLs et DNS local](#urls-et-dns-local)
5. [Copier et démarrer sur le serveur](#copier-et-démarrer-sur-le-serveur)
6. [Apps LMS (profile Docker `apps`)](#apps-lms-profile-docker-apps)
7. [Netdata](#netdata)
8. [Variables d’environnement](#variables-denvironnement)
9. [Build des images Next.js](#build-des-images-nextjs)
10. [Développement local vs production](#développement-local-vs-production)
11. [Dépannage](#dépannage)
12. [Checklist](#checklist)
13. [Référence — compose local (historique)](#référence--compose-local-historique)

---

## Vue d’ensemble

| Environnement | Outil | Rôle |
|---------------|--------|------|
| **PC Cursor (dev)** | `pnpm dev` | Monorepo LMS — pas obligatoire de tout dockeriser en local |
| **NUC / VPS (test & prod)** | `deploy/gsms/docker-compose.yml` | **Un seul stack** : Caddy, monitoring, Postgres, Redis, apps |

**Principe :** le monorepo reste sur ta machine de dev ; le NUC exécute les **images Docker** + l’infra admin (Netdata, Portainer, etc.).

---

## Stack tout-en-un GSMS (NUC / VPS)

```
                    Internet / LAN (192.168.1.37)
                              │
                    ┌─────────▼─────────┐
                    │   gsms-caddy      │  :80 / :443
                    └─────────┬─────────┘
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   gsms-security.com    monitoring.*         netdata.*
          │                   │                   │
    ┌─────▼─────┐      ┌──────▼──────┐    ┌─────▼─────┐
    │ landing   │      │ homepage    │    │ netdata   │
    │ crm       │      │ /portainer  │    │ :19999    │
    │ (profile) │      │ /uptime     │    └───────────┘
    └─────┬─────┘      └─────────────┘
          │
    ┌─────▼─────────────────────────────┐
    │ postgres · redis · minio           │
    │ worker (profile apps)              │
    └────────────────────────────────────┘
```

### Services (`deploy/gsms/docker-compose.yml`)

| Service | Conteneur | Rôle |
|---------|-----------|------|
| `caddy` | `gsms-caddy` | Reverse proxy |
| `homepage` | `gsms-homepage` | Page de liens admin |
| `netdata` | `gsms-netdata` | Métriques VPS / Docker / (Postgres & Redis si configuré) |
| `portainer` | `gsms-portainer` | UI Docker |
| `uptime-kuma` | `gsms-uptime-kuma` | Disponibilité HTTP des sites |
| `postgres` | `gsms-postgres` | Base Prisma `lms_app` |
| `redis` | `gsms-redis` | Cache + files workers |
| `minio` | `gsms-minio` | Stockage S3-compatible |
| `crm` | `gsms-crm` | App CRM (**profile `apps`**) |
| `landing` | `gsms-landing` | App landing (**profile `apps`**) |
| `worker` | `gsms-worker` | Jobs cache stats (**profile `apps`**) |

Fichiers associés :

| Chemin | Contenu |
|--------|---------|
| `deploy/gsms/templates/` | Modèles `.env`, Caddyfile, Homepage (générés par `deploy-lms.ps1`) |
| `deploy/gsms/homepage/config/` | Homepage (YAML) |
| `deploy/gsms/netdata/go.d/*.example` | Exemples collectors Postgres / Redis |
| `deploy/gsms/Dockerfile.crm` / `.landing` / `.worker` | Build images apps |
| `deploy/gsms/.env.example` | Modèle variables |
| `scripts/deploy-lms.ps1` | **Déploiement interactif** (PC → VPS) |
| `scripts/sync-gsms-stack-to-nuc.ps1` | Copie brute du dossier (sans `.env` généré) |

---

## URLs et DNS local

Ajoute sur ton PC (`C:\Windows\System32\drivers\etc\hosts`) :

```text
192.168.1.37 monitoring.gsms-security.com netdata.gsms-security.com
192.168.1.37 crm.gsms-security.com gsms-security.com server.gsms-security.com
```

| URL | Service |
|-----|---------|
| http://192.168.1.37 | Homepage (accès direct LAN) |
| http://monitoring.gsms-security.com | Homepage |
| http://monitoring.gsms-security.com/portainer/ | Portainer |
| http://monitoring.gsms-security.com/uptime/ | Uptime Kuma |
| http://netdata.gsms-security.com | Netdata |
| http://server.gsms-security.com | Cockpit (hôte, port 9090) |
| http://crm.gsms-security.com | CRM (après profile `apps`) |
| http://gsms-security.com | Landing (après profile `apps`) |

**HTTPS public :** Let's Encrypt bloqué tant que les ports 80/443 ne sont pas ouverts côté FAI — Caddy est en HTTP + `tls internal` pour tests. Voir Freebox / Cloudflare Tunnel dans la doc infra.

---

## Copier et démarrer sur le serveur

### 1. Copie depuis Windows (PowerShell, racine monorepo)

```powershell
.\scripts\sync-gsms-stack-to-nuc.ps1
# ou manuellement :
scp -i $env:USERPROFILE\.ssh\id_ed25519 -r deploy\gsms\* root@192.168.1.37:/opt/gsms/
scp -i $env:USERPROFILE\.ssh\id_ed25519 deploy\gsms\.env.example root@192.168.1.37:/opt/gsms/.env.example
```

> **Important :** `scp ...\*` ne copie **pas** les fichiers cachés (`.env.example`). Toujours copier `.env.example` explicitement.

### 2. Configuration sur le NUC

```bash
ssh -i ~/.ssh/id_ed25519 root@192.168.1.37
cd /opt/gsms
cp .env.example .env
nano .env   # mots de passe forts, URLs HTTP en test
```

Exemple `.env` (NUC en HTTP) :

```env
POSTGRES_PASSWORD=<mot-de-passe-fort>
MINIO_ROOT_PASSWORD=<mot-de-passe-fort>
DATABASE_URL=postgresql://lms:<meme-mot-de-passe>@postgres:5432/lms_app
REDIS_URL=redis://redis:6379

NEXTAUTH_URL=http://crm.gsms-security.com
NEXT_PUBLIC_CRM_URL=http://crm.gsms-security.com
NEXT_PUBLIC_LANDING_URL=http://gsms-security.com
NEXTAUTH_SECRET=<openssl rand -hex 32>
AUTH_SECRET=<openssl rand -hex 32>

HOMEPAGE_ALLOWED_HOSTS=monitoring.gsms-security.com,192.168.1.37,localhost
NETDATA_HOSTNAME=gsms-nuc
NODE_ENV=production
```

### 3. Démarrage

```bash
cd /opt/gsms
docker compose pull
docker compose up -d              # infra + monitoring
docker compose ps
```

### 4. Recharger Caddy après modification du Caddyfile

```bash
docker exec gsms-caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## Apps LMS (profile Docker `apps`)

### Prérequis Next.js

Les apps doivent avoir `output: 'standalone'` dans `next.config` :

- `apps/lms-crm/next.config.mjs` — déjà configuré  
- `apps/lms-landing/next.config.ts` — déjà configuré  

### Build des images (machine avec le monorepo)

```bash
cd /chemin/vers/app-prisma
docker build -f deploy/gsms/Dockerfile.crm -t gsms-crm:latest .
docker build -f deploy/gsms/Dockerfile.landing -t gsms-landing:latest .
docker build -f deploy/gsms/Dockerfile.worker -t gsms-worker:latest .
```

Sur le NUC : charger les images (registry, `docker save` / `scp`, ou build direct sur le serveur si le repo y est copié).

### Démarrer les apps

```bash
cd /opt/gsms
docker compose --profile apps up -d
# Migrations (si Prisma disponible dans l’image CRM) :
docker compose exec crm npx prisma migrate deploy
```

---

## Netdata

### Rôle

- CPU, RAM, disque, réseau du NUC  
- Métriques par conteneur Docker  
- Alertes (config dans le volume `netdata_config`)  
- Postgres / Redis : activer les collectors (voir ci-dessous)

**Ne remplace pas :** Sentry (erreurs app), Homepage (liens), Uptime (ping HTTP).

### Session ID (claim Netdata Cloud)

Le conteneur s’appelle **`gsms-netdata`** (pas `netdata`) :

```bash
docker exec gsms-netdata cat /var/lib/netdata/netdata_random_session_id
```

Si la commande échoue : le fichier est dans le volume Docker `gsms_netdata_lib` — utiliser `docker exec` comme ci-dessus.

### Collectors Postgres & Redis

```bash
cd /opt/gsms/netdata/go.d
cp postgres.conf.example postgres.conf
cp redis.conf.example redis.conf
# Éditer les DSN (mot de passe = POSTGRES_PASSWORD du .env)
docker compose restart netdata
```

**Ne pas** monter `go.d` en lecture seule au premier démarrage (voir [Dépannage](#dépannage)).

### UI custom

Limitée dans Netdata. Pour dashboards métier 100 % sur mesure → Grafana ou module admin dans le CRM plus tard.

---

## Variables d’environnement

| Fichier | Usage |
|---------|--------|
| `deploy/gsms/.env.example` | Modèle pour le serveur → copier en `/opt/gsms/.env` |
| `.env` (racine monorepo) | Dev local Prisma / apps |
| `.env.docker` | *(historique)* — préférer `deploy/gsms/.env` sur le VPS |

Ne jamais committer `.env` ni `/opt/gsms/.env` sur le serveur dans Git.

---

## Build des images Next.js

Dockerfiles officiels du projet :

| Image | Dockerfile |
|-------|------------|
| `gsms-crm:latest` | `deploy/gsms/Dockerfile.crm` |
| `gsms-landing:latest` | `deploy/gsms/Dockerfile.landing` |
| `gsms-worker:latest` | `deploy/gsms/Dockerfile.worker` |

Build depuis la **racine du monorepo** (contexte pnpm workspace).

Scripts racine :

```bash
pnpm build:landing   # vérifie le build avant image Docker
pnpm build:crm
```

---

## Développement local vs production

| | Local (Cursor) | NUC / VPS |
|--|----------------|-----------|
| Apps LMS | `pnpm dev:crm`, `pnpm dev:landing` | Images Docker + profile `apps` |
| Base de données | Laragon / Postgres local | Conteneur `gsms-postgres` |
| Monitoring | Optionnel | Netdata, Homepage, Portainer, Uptime |
| Reverse proxy | Ports directs | Caddy |

Le dossier `apps/netdata-master` dans le repo est le **code source** de Netdata — **ne pas** le compiler pour le déploiement ; utiliser l’image `netdata/netdata`.

Le dépôt [netdata/dashboard](https://github.com/netdata/dashboard) (React v1) est **archivé** — ne pas l’utiliser.

---

## Dépannage

### Netdata redémarre en boucle (`Read-only file system` sur `go.d`)

**Cause :** montage `./netdata/go.d:/etc/netdata/go.d:ro` avant la première initialisation.

**Solution :** ne pas monter `go.d` en RO au premier `up` ; utiliser les fichiers `.example` puis copier la config dans le volume, ou activer les collectors après premier démarrage (compose actuel corrigé).

### `docker exec netdata` → Error: No such container

Utiliser le nom réel :

```bash
docker exec gsms-netdata ...
```

### `.env.example` absent sur le serveur après `scp`

Les fichiers commençant par `.` ne sont pas inclus dans `scp ...\*`. Copier explicitement :

```bash
scp deploy/gsms/.env.example root@192.168.1.37:/opt/gsms/
```

### CRM / Landing 502 via Caddy

Les conteneurs ne sont pas démarrés :

```bash
docker compose --profile apps up -d
docker compose ps
```

### Postgres : connexion refusée

```bash
docker compose logs postgres
docker compose exec postgres pg_isready -U lms
```

### Ports déjà utilisés en local

Ne pas exposer 80/443 en local si Laragon les utilise — le stack GSMS est prévu pour le **NUC**, pas pour remplacer Laragon sur Windows.

---

## Checklist

### Sécurité (avant prod réelle)

- [ ] Mots de passe forts dans `/opt/gsms/.env` (pas les valeurs de test du premier déploiement)
- [ ] `NEXTAUTH_SECRET` / `AUTH_SECRET` générés (`openssl rand -hex 32`)
- [ ] Postgres / Redis **non** exposés sur Internet (pas de `ports:` publics)
- [ ] Netdata / Portainer / Cockpit non accessibles sans auth ou tunnel sécurisé
- [ ] `.env` jamais versionné dans Git

### Stack NUC

- [x] `deploy/gsms` copié dans `/opt/gsms`
- [x] `docker compose up -d` (infra + monitoring)
- [ ] Collectors Netdata Postgres / Redis activés
- [ ] Images CRM / landing buildées
- [ ] `docker compose --profile apps up -d`
- [ ] Migrations Prisma appliquées
- [ ] Uptime Kuma : monitors pour landing + CRM
- [ ] Sauvegarde Postgres planifiée

### Observabilité

- [ ] Netdata : alertes disque / RAM
- [ ] Sentry configuré dans le CRM (erreurs applicatives)
- [ ] Logs : `docker compose logs -f crm`

---

## Référence — compose local (historique)

Les sections ci-dessous décrivaient un `docker-compose.yml` à la **racine** du monorepo avec Nginx — **non déployé** aujourd’hui. Le déploiement réel passe par **`deploy/gsms/`** uniquement.

Pour un compose local expérimental (Postgres + apps sans Caddy/Netdata), s’inspirer de l’ancien modèle :

- Postgres `postgres:16-alpine`
- `output: 'standalone'` sur les apps Next
- Réseau Docker dédié
- Volumes nommés pour persistance

Commandes utiles (tous environnements) :

```bash
docker compose ps
docker compose logs -f <service>
docker compose --profile apps up -d
docker compose down          # arrêt (volumes conservés)
docker compose down -v       # WARNING : supprime les volumes
docker stats
```

---

## Commandes rapides (NUC)

```bash
ssh root@192.168.1.37
cd /opt/gsms

docker compose ps
docker compose logs -f netdata
docker compose logs -f caddy
docker compose --profile apps up -d
docker exec gsms-netdata cat /var/lib/netdata/netdata_random_session_id
```

---

*Dernière mise à jour : déploiement via `deploy-lms.ps1` — Caddy (LE), Postgres, Redis, MinIO, monitoring, apps en profile `apps`.*
