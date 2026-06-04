http:
  routers:
    maint-landing:
      rule: Host(`{{DOMAIN}}`) || Host(`www.{{DOMAIN}}`)
      entryPoints: [web]
      service: maintenance
      priority: 100
    maint-crm:
      rule: Host(`{{CRM_HOST}}`) || Host(`app.{{DOMAIN}}`) || Host(`api.{{DOMAIN}}`)
      entryPoints: [web]
      service: maintenance
      priority: 100
    maint-docs:
      rule: Host(`{{DOCS_HOST}}`)
      entryPoints: [web]
      service: maintenance
      priority: 100
  services:
    maintenance:
      loadBalancer:
        servers:
          - url: http://gsms-maintenance:80
