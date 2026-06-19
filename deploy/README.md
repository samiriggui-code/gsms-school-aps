# Déploiement

Scripts et modèles Docker pour une installation sur serveur dédié.

## Démarrage

```powershell
.\deploy\gsms\deploy.ps1
```

Le script interactif guide la configuration (secrets, hôte, options) puis lance le déploiement.

## Configuration

| Fichier | Rôle |
|---------|------|
| `deploy/gsms/.env.example` | Modèle des variables — copier vers `.env` (hors Git) |
| `deploy/gsms/config/deploy.local.json.example` | Modèle config VPS — copier vers `deploy.local.json` (hors Git) |

**Ne jamais committer** `.env`, `deploy.local.json` ni fichiers contenant mots de passe, IP ou domaines de production.

Détails : `deploy/gsms/README.md`
