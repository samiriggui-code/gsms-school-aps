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

### Rebuild complet VPS (tar + Docker app/worker + Prisma migrate, sans seed par défaut)

Depuis le poste Windows (archive sans `node_modules`, `.env` sauvegardé sur le VPS) :

```powershell
.\scripts\vps-rebuild-complete.ps1
```

Options :

| Paramètre | Effet |
|-----------|--------|
| `-WithSeed` | Relance aussi `pnpm db:seed` |
| `-SkipTar` | Pas d’archive — rebuild Docker + DB sur le code déjà sur le VPS |
| `-DbOnly` | Migrations Prisma uniquement (`SKIP_SEED=1` par défaut) |

Sur le VPS directement (après extraction du tar) :

```bash
# migrate + push, pas de seed (recommandé prod)
SKIP_SEED=1 bash /opt/gsms-school/deploy/gsms/vps-rebuild-complete.sh

# avec seed
SKIP_SEED=0 bash /opt/gsms-school/deploy/gsms/vps-rebuild-complete.sh

# db-init seul
SKIP_TAR_EXTRACT=1 SKIP_DEPLOY=1 RUN_DB_INIT=1 SKIP_SEED=1 \
  bash /opt/gsms-school/deploy/gsms/vps-rebuild-complete.sh
```

Ou sur le serveur, après `git pull` :

```bash
bash /opt/gsms-school/deploy/gsms/deploy.sh
```

## Variables utiles (`deploy.sh` / `vps-rebuild-complete.sh`)

| Variable | Description |
|----------|-------------|
| `SKIP_GIT=1` | Code déjà présent (archive) |
| `SKIP_DB_INIT=1` | `deploy.sh` seul : pas de migration (utiliser `vps-rebuild-complete.sh` pour migrate après rebuild) |
| `RUN_DB_INIT=1` | `vps-rebuild-complete.sh` : migrate + db push après Docker |
| `SKIP_SEED=1` | Migrate/push sans seed (défaut rebuild complet) |
| `RESET_DB=1` | Réinitialise PostgreSQL (**destructif**) |
| `SKIP_DISK_CLEANUP=1` | Pas de nettoyage disque en fin de deploy/rebuild |

Le nettoyage post-rebuild (`vps-disk-cleanup.sh`) supprime archives `/tmp`, vieux `.env.backup.*`, cache Docker et journaux > 7j — exécuté automatiquement après chaque `deploy.sh` et `vps-rebuild-complete.sh`.

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
