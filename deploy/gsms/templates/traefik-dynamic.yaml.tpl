# Routage Traefik — HTTPS (Let's Encrypt)
http:
  routers:
    landing:
      rule: Host(`{{DOMAIN}}`) || Host(`www.{{DOMAIN}}`)
      entryPoints: [websecure]
      service: landing
      tls:
        certResolver: letsencrypt
      priority: 10

    crm:
      rule: Host(`{{CRM_HOST}}`)
      entryPoints: [websecure]
      service: crm
      tls:
        certResolver: letsencrypt
      priority: 10

    app-alias:
      rule: Host(`app.{{DOMAIN}}`)
      entryPoints: [websecure]
      service: crm
      tls:
        certResolver: letsencrypt
      priority: 10

    api-alias:
      rule: Host(`api.{{DOMAIN}}`)
      entryPoints: [websecure]
      service: crm
      tls:
        certResolver: letsencrypt
      priority: 10

    docs:
      rule: Host(`{{DOCS_HOST}}`)
      entryPoints: [websecure]
      service: docs
      tls:
        certResolver: letsencrypt
      priority: 10

    monitoring:
      rule: Host(`{{MONITORING_HOST}}`)
      entryPoints: [websecure]
      service: homepage
      tls:
        certResolver: letsencrypt

    portainer:
      rule: Host(`{{PORTAINER_HOST}}`)
      entryPoints: [websecure]
      service: portainer
      tls:
        certResolver: letsencrypt

    uptime:
      rule: Host(`{{UPTIME_HOST}}`)
      entryPoints: [websecure]
      service: uptime
      tls:
        certResolver: letsencrypt

    netdata:
      rule: Host(`{{NETDATA_HOST}}`)
      entryPoints: [websecure]
      service: netdata
      tls:
        certResolver: letsencrypt

  services:
    landing:
      loadBalancer:
        servers:
          - url: http://gsms-landing:3000
    crm:
      loadBalancer:
        servers:
          - url: http://gsms-crm:3001
    docs:
      loadBalancer:
        servers:
          - url: http://gsms-docs:3004
    homepage:
      loadBalancer:
        servers:
          - url: http://gsms-homepage:3000
    portainer:
      loadBalancer:
        servers:
          - url: http://gsms-portainer:9000
    uptime:
      loadBalancer:
        servers:
          - url: http://gsms-uptime-kuma:3001
    netdata:
      loadBalancer:
        servers:
          - url: http://gsms-netdata:19999
