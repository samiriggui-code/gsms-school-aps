# Support OS — scripts déploiement GSMS

## Aujourd’hui (production)

| OS | Pipeline GSMS | Inventaire / reset |
|----|---------------|-------------------|
| **Ubuntu** 22.04+ | ✅ Complet (`apt`, dépôt Docker officiel) | ✅ |
| **Debian** 11+ | ✅ Même branche `debian` que Ubuntu | ✅ |
| CentOS / Rocky / Alma / RHEL | ❌ Non implémenté | Lecture seule possible |
| Autres | ❌ | Bloqué côté prérequis cockpit |

Les scripts `prepare-vps.sh`, `install-docker-vps.sh` et la purge Docker du reset utilisent **apt** et le dépôt `download.docker.com/linux/ubuntu`.

## Détection

Sourcer `lib/os-detect.sh` :

```bash
source "$(dirname "$0")/lib/os-detect.sh"
gsms_os_id        # ubuntu, debian, rocky, …
gsms_os_family    # debian | rhel | unknown
gsms_pkg_refresh_cache   # apt update ou dnf makecache
gsms_docker_supported    # true seulement si debian
```

Le cockpit enregistre `osFamily` sur l’hôte (`ubuntu` / `debian`) après analyse SSH.

## Adapter pour CentOS / Rocky (futur)

1. **prepare-vps** : `dnf install` — `firewalld` au lieu de UFW, `fail2ban` EPEL.
2. **install-docker** : dépôt Docker `linux/centos` ou `moby-engine` — pas le script Ubuntu actuel.
3. **reset** : `dnf remove` / pas de `/etc/apt/sources.list.d/docker.list`.
4. **Cockpit** : refuser le déploiement si `gsms_docker_supported` est false, ou branche dédiée dans la recette.

Principe : **une fonction par action** (`gsms_pkg_install`, `gsms_firewall_enable`) — pas de `if centos` dispersé dans 10 fichiers.

## Inventaire VPS

Trois blocs dans le cockpit (onglet Détails) :

1. **Hébergeur** — nginx/Apache/PHP, certbot, `/etc/letsencrypt`, MySQL hôte, ports 80/443
2. **Fichiers GSMS** — `docker-compose.yml`, `caddy/Caddyfile`, `.env`, `homepage/config`, réseau `gsms`
3. **Conteneurs** — `gsms-caddy` (TLS, pas Let’s Encrypt hôte), postgres, redis, minio, portainer, netdata, uptime-kuma, homepage, apps

GSMS ne modifie pas le système hors `/opt/gsms` (sauf volumes Docker et `prepare-vps` : UFW/fail2ban).

Ajouter une brique = clé dans `vps-inventory-probe.ts` + entrée dans `vps-inventory.config.ts`.
