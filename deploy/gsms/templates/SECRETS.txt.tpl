# {{PROJECT_NAME}} — secrets generes le {{GENERATED_AT}}
# Conserver hors Git. Sur le VPS : /opt/gsms/SECRETS.txt (chmod 600)

Postgres utilisateur : {{POSTGRES_USER}}
Postgres base       : {{POSTGRES_DB}}
Postgres mot de passe : {{POSTGRES_PASSWORD}}

MinIO utilisateur   : {{MINIO_ROOT_USER}}
MinIO mot de passe  : {{MINIO_ROOT_PASSWORD}}

NEXTAUTH_SECRET     : {{NEXTAUTH_SECRET}}
AUTH_SECRET         : {{AUTH_SECRET}}

SMTP (Hostinger)    : {{SMTP_USER}} @ {{SMTP_HOST}}:{{SMTP_PORT}}
SMTP_PASS           : (voir .env SMTP_PASS — saisi a l etape 1 ou sur le VPS)

URLs production :
  Landing  : {{SCHEME}}://{{DOMAIN}}
  CRM      : {{SCHEME}}://{{CRM_HOST}}
  Docs     : {{SCHEME}}://{{DOCS_HOST}}
  Monitoring : {{SCHEME}}://{{MONITORING_HOST}}
  Portainer  : {{SCHEME}}://{{PORTAINER_HOST}}
  Uptime     : {{SCHEME}}://{{UPTIME_HOST}}
  Netdata    : {{SCHEME}}://{{NETDATA_HOST}}

VPS IP : {{SERVER_IP}}
