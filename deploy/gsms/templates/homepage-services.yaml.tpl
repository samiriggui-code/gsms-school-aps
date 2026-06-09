---
# Homepage — supervision GSMS (généré {{GENERATED_AT}})

- Applications FORM'SSI:
    - Landing publique:
        href: {{SCHEME}}://{{DOMAIN}}
        description: Acquisition, catalogue & préinscriptions
        icon: mdi-web
        siteMonitor: {{SCHEME}}://{{DOMAIN}}
        statusStyle: dot
        server: local
        container: gsms-landing
        showStats: true
        target: _blank

    - CRM école:
        href: {{SCHEME}}://{{CRM_HOST}}
        description: Administration, inscriptions & vie scolaire
        icon: mdi-school
        siteMonitor: {{SCHEME}}://{{CRM_HOST}}/api/common/health
        statusStyle: dot
        server: local
        container: gsms-crm
        showStats: true
        target: _blank

    - Documentation:
        href: {{SCHEME}}://{{DOCS_HOST}}
        description: Mintlify — guides CRM, landing & déploiement
        icon: mdi-book-open-page-variant
        siteMonitor: {{SCHEME}}://{{DOCS_HOST}}
        statusStyle: dot
        server: local
        container: gsms-docs
        showStats: true
        target: _blank

- Données & cache:
    - PostgreSQL:
        href: {{SCHEME}}://{{NETDATA_HOST}}
        description: Base lms_app · conteneur gsms-postgres
        icon: si-postgresql-#336791
        server: local
        container: gsms-postgres
        showStats: true
        statusStyle: dot

    - Redis:
        href: {{SCHEME}}://{{NETDATA_HOST}}
        description: Cache sessions & stats api-core
        icon: si-redis-#DC382D
        server: local
        container: gsms-redis
        showStats: true
        statusStyle: dot

    - MinIO S3:
        href: {{SCHEME}}://{{NETDATA_HOST}}
        description: Stockage fichiers & uploads CRM
        icon: si-minio-#C72E49
        server: local
        container: gsms-minio
        showStats: true
        statusStyle: dot

    - Worker async:
        href: {{SCHEME}}://{{MONITORING_HOST}}
        description: Jobs agrégations Redis & tâches planifiées
        icon: mdi-cog-sync
        server: local
        container: gsms-worker
        showStats: true
        statusStyle: dot

- Supervision ops:
    - Portainer:
        href: {{SCHEME}}://{{PORTAINER_HOST}}
        description: Gestion conteneurs Docker
        icon: si-portainer-#13BEF9
        siteMonitor: {{SCHEME}}://{{PORTAINER_HOST}}
        statusStyle: dot
        server: local
        container: gsms-portainer
        showStats: true
        target: _blank

    - Netdata:
        href: {{SCHEME}}://{{NETDATA_HOST}}
        description: Métriques temps réel CPU, RAM, disque, réseau
        icon: si-netdata-#00AB44
        siteMonitor: {{SCHEME}}://{{NETDATA_HOST}}
        statusStyle: dot
        server: local
        container: gsms-netdata
        showStats: true
        target: _blank

    - Uptime Kuma:
        href: {{SCHEME}}://{{UPTIME_HOST}}
        description: Disponibilité & alertes HTTP
        icon: mdi-heart-pulse
        siteMonitor: {{SCHEME}}://{{UPTIME_HOST}}
        statusStyle: dot
        server: local
        container: gsms-uptime-kuma
        showStats: true
        target: _blank

    - Homepage:
        href: {{SCHEME}}://{{MONITORING_HOST}}
        description: Ce cockpit — liens ops & état stack
        icon: mdi-view-dashboard-variant
        siteMonitor: {{SCHEME}}://{{MONITORING_HOST}}
        statusStyle: dot
        server: local
        container: gsms-homepage
        showStats: true

- Automatisation & IA:
    - n8n workflows:
        href: {{SCHEME}}://{{N8N_HOST}}
        description: Automatisations LMS · webhooks GSMS & scénarios ops
        icon: si-n8n-#EA4B71
        siteMonitor: {{SCHEME}}://{{N8N_HOST}}
        statusStyle: dot
        target: _blank

    - Open WebUI (IA):
        href: {{SCHEME}}://{{OPEN_WEBUI_HOST}}
        description: Interface chat LLM · Ollama local sur le VPS
        icon: mdi-robot-outline
        siteMonitor: {{SCHEME}}://{{OPEN_WEBUI_HOST}}
        statusStyle: dot
        target: _blank

- Réseau & sécurité:
    - Traefik TLS:
        href: {{SCHEME}}://{{DOMAIN}}
        description: Reverse proxy Hostinger · Let's Encrypt
        icon: si-traefikproxy-#24A1C1
        siteMonitor: {{SCHEME}}://{{DOMAIN}}
        statusStyle: dot
        target: _blank

    - Page maintenance:
        href: {{SCHEME}}://{{DOCS_HOST}}
        description: Fallback nginx (docs hors ligne)
        icon: mdi-wrench-clock
        server: local
        container: gsms-maintenance
        showStats: true
        statusStyle: dot

    - Stack GSMS:
        href: {{SCHEME}}://{{MONITORING_HOST}}
        description: "VPS {{SERVER_IP}} · monorepo /opt/gsms-school"
        icon: mdi-server-network
        siteMonitor: {{SCHEME}}://{{CRM_HOST}}/api/common/health
        statusStyle: dot
