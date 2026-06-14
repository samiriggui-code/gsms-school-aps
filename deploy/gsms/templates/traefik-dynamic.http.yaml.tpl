# Routage Traefik — HTTP seul (tests / LAN)
http:
  routers:
    landing:
      rule: Host(`{{DOMAIN}}`) || Host(`www.{{DOMAIN}}`)
      entryPoints: [web]
      service: landing
      priority: 10

    crm:
      rule: Host(`{{CRM_HOST}}`) || Host(`app.{{DOMAIN}}`) || Host(`api.{{DOMAIN}}`)
      entryPoints: [web]
      service: crm
      priority: 10

    docs:
      rule: Host(`{{DOCS_HOST}}`)
      entryPoints: [web]
      service: docs

    monitoring:
      rule: Host(`{{MONITORING_HOST}}`)
      entryPoints: [web]
      service: homepage

    portainer:
      rule: Host(`{{PORTAINER_HOST}}`)
      entryPoints: [web]
      service: portainer

    uptime:
      rule: Host(`{{UPTIME_HOST}}`)
      entryPoints: [web]
      service: uptime

    netdata:
      rule: Host(`{{NETDATA_HOST}}`)
      entryPoints: [web]
      service: netdata

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
