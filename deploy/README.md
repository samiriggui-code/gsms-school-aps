# Déploiement production — point d'entrée

**Lancer le script interactif (Windows) :**

```powershell
.\deploy\gsms\deploy.ps1
# ou
pnpm deploy:vps
```

Le script pose les questions (VPS, secrets `.env`, options) puis enchaîne automatiquement :
pack → envoi SCP → extraction → `deploy.sh` sur le VPS → vérification.

## Arborescence

```
deploy/
└── gsms/                    # Stack prod (source de vérité)
    ├── deploy.ps1           # ★ Script interactif (à lancer depuis ton PC)
    ├── pack.ps1             # Archive seule (appelé par deploy.ps1)
    ├── deploy.sh            # Orchestration sur le VPS (Docker build + compose)
    ├── install.sh           # Première install (reset DB)
    ├── verify.sh            # Healthcheck post-deploy
    ├── docker-compose.yml
    ├── Dockerfile.app
    ├── Dockerfile.worker    # Playwright / Chromium (PDF)
    ├── .env.example
    ├── .env                 # Secrets locaux (hors Git) → copiés vers /opt/gsms/.env
    ├── config/
    │   └── deploy.local.json   # Config VPS sauvegardée (hors Git)
    └── lib/                 # Helpers PowerShell (prompts, .env)
```

Sur le VPS :

| Chemin | Rôle |
|--------|------|
| `/opt/gsms-school` | Code monorepo |
| `/opt/gsms` | Docker compose + `.env` prod |

Détails stack : `deploy/gsms/README.md`
