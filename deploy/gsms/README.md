# Stack Docker GSMS / LMS (sans Traefik integre)

Deploiement sur VPS Hostinger : **reverse proxy hPanel / Traefik deja en place** (80/443).

## Principe

- **Aucun** conteneur `gsms-traefik` — jamais.
- Apps exposees en **local uniquement** :
  - Landing : `http://127.0.0.1:3000`
  - CRM : `http://127.0.0.1:3001`
  - Docs : `http://127.0.0.1:3004`
- Dans **hPanel** (ou Traefik VPS), configurez les domaines vers ces ports.

| Domaine (exemple) | Cible hPanel |
|-------------------|--------------|
| `hosting-global-it-ss.com` | `http://127.0.0.1:3000` |
| `crm.hosting-global-it-ss.com` | `http://127.0.0.1:3001` |
| `docs.hosting-global-it-ss.com` | `http://127.0.0.1:3004` |

## Deploiement (PC Windows)

```powershell
cd c:\laragon\www\gsms-school
.\scripts\1-etape-preparer-fichiers.ps1
.\scripts\2-etape-infra-vps.ps1
.\scripts\3-etape-apps-vps.ps1
```

Chemins VPS : `/opt/gsms` (stack), `/opt/gsms-school` (code build).

## Si gsms-traefik existe encore (ancien deploy)

```bash
docker rm -f gsms-traefik
cd /opt/gsms && docker compose up -d
```
