#!/bin/bash
set -euo pipefail
AR=/opt/gsms-school
GD=/opt/gsms

echo "==> 1. Monorepo"
mkdir -p "$AR"
if [[ -f /tmp/lms-monorepo.tar.gz ]]; then
  tar -xzf /tmp/lms-monorepo.tar.gz -C "$AR"
  rm -f /tmp/lms-monorepo.tar.gz
fi
find "$AR/scripts/deploy" -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true

echo "==> 2. PM2 legacy"
pm2 delete all 2>/dev/null || true
pm2 save 2>/dev/null || true

echo "==> 3. Infra recreate (labels Traefik)"
cd "$GD"
docker compose up -d maintenance postgres redis minio homepage portainer uptime-kuma netdata

echo "==> 4. Wait postgres"
for i in $(seq 1 30); do
  docker exec gsms-postgres pg_isready -U lms >/dev/null 2>&1 && break
  sleep 2
done

echo "==> 5. Build CRM + landing"
source "$AR/scripts/deploy/_free-app-ports.sh"
free_app_ports
cd "$AR"
docker build -f deploy/gsms/Dockerfile.crm -t gsms-crm:latest .
docker build -f deploy/gsms/Dockerfile.landing -t gsms-landing:latest .

echo "==> 6. Apps up"
cd "$GD"
docker compose --profile apps up -d --force-recreate crm landing
docker stop gsms-docs gsms-worker 2>/dev/null || true
docker rm gsms-docs gsms-worker 2>/dev/null || true

echo "==> 7. DB migrate"
export APP_ROOT="$AR" GSMS_ENV="$GD/.env"
bash "$AR/scripts/deploy/gsms-db-init.sh"

echo "==> 8. Labels"
docker inspect gsms-landing 2>/dev/null | grep 'gsms-landing.rule' | head -1 || echo "WARN: no traefik label"

echo "==> 9. HTTPS test"
sleep 4
curl -sk -o /dev/null -w 'landing:%{http_code}\n' --resolve hosting-global-it-ss.com:443:127.0.0.1 https://hosting-global-it-ss.com/ || true
curl -sk -o /dev/null -w 'crm:%{http_code}\n' --resolve crm.hosting-global-it-ss.com:443:127.0.0.1 https://crm.hosting-global-it-ss.com/ || true
curl -sk -o /dev/null -w 'monitoring:%{http_code}\n' --resolve monitoring.hosting-global-it-ss.com:443:127.0.0.1 https://monitoring.hosting-global-it-ss.com/ || true

docker ps --format 'table {{.Names}}\t{{.Status}}' | grep gsms || true
echo OK_DONE
