# Déploiement production

Stack Docker : application Next.js, worker, PostgreSQL, Redis, stockage S3-compatible.

## Lancer depuis votre poste

```powershell
.\deploy\gsms\deploy.ps1
```

Configuration mémorisée dans `config/deploy.local.json` (fichier local, **hors Git**).

## Prérequis serveur

- Docker + Docker Compose
- Reverse proxy HTTPS (ex. Traefik) si exposition publique
- Répertoires suggérés : `/opt/gsms-school` (code), `/opt/gsms` (compose + `.env`)

## Première installation

1. Copier `deploy/gsms/.env.example` → `deploy/gsms/.env` et renseigner **tous** les secrets.
2. Copier `config/deploy.local.json.example` → `config/deploy.local.json` avec **votre** hôte SSH et domaine.
3. Transférer `.env` sur le serveur (chemin défini dans votre procédure interne).
4. Déployer le code (archive ou `git pull`) puis exécuter `install.sh` ou `deploy.sh` sur le VPS.

## Mise à jour

```powershell
.\deploy\gsms\deploy.ps1
```

Ou sur le serveur, après `git pull` :

```bash
bash /opt/gsms-school/deploy/gsms/deploy.sh
```

## Variables utiles (`deploy.sh`)

| Variable | Description |
|----------|-------------|
| `SKIP_GIT=1` | Code déjà présent (archive) |
| `SKIP_DB_INIT=1` | Pas de migration/seed |
| `RESET_DB=1` | Réinitialise PostgreSQL (**destructif**) |

## Vérification

```bash
bash /opt/gsms/verify.sh
curl -s http://127.0.0.1:3001/api/common/health
```

## Dépannage

```bash
docker logs gsms-app --tail 80
docker logs gsms-worker --tail 50
bash /opt/gsms/docker-cleanup.sh
```

## Sécurité

- Les domaines, IP, clés API et comptes de service **ne doivent pas** figurer dans ce dépôt public.
- Utilisez uniquement les fichiers `.example` comme modèles.
