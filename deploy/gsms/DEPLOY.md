# Déploiement production GSMS

## URLs

| Service | URL |
|---------|-----|
| App LMS | https://hosting-global-it-ss.com |
| Monitoring | https://monitoring.hosting-global-it-ss.com |

Traefik externe Hostinger (host network) — ports hôte `3001` (app) et `3005` (homepage).

## Stack Docker (`/opt/gsms`)

- `gsms-app` — Next.js lms-crm (standalone)
- `gsms-worker` — rapports PDF, stats Redis, sync RH
- `gsms-postgres` — volume `gsms_postgres_data`
- `gsms-redis` — volume `gsms_redis_data`
- `gsms-minio` — volume `gsms_minio_data`
- `gsms-homepage` — gethomepage (CPU/RAM/disque + état conteneurs)

Conservés hors stack : **n8n**, **traefik**.

## Premier déploiement (VPS vide)

```bash
mkdir -p /opt/gsms
git clone https://github.com/samiriggui-code/gsms-school-final.git /opt/gsms-school
cp /opt/gsms-school/deploy/gsms/.env /opt/gsms/.env   # ou créer depuis .env.example
chmod 600 /opt/gsms/.env
bash /opt/gsms-school/deploy/gsms/install.sh
```

## Mise à jour

```bash
cd /opt/gsms-school
git pull origin main
bash deploy/gsms/deploy.sh
```

Sans reset DB : `SKIP_DB_INIT=1 bash deploy/gsms/deploy.sh`

## Variables critiques

Voir `deploy/gsms/.env.example` — Postgres, MinIO, SMTP, Pusher, n8n, `REPORT_APP_BASE_URL`.

Le fichier `.env` réel est dans `/opt/gsms/.env` (jamais commité).
