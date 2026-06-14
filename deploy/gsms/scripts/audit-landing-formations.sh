#!/bin/bash
# Vérifie slugs catalogue vs préinscriptions landing sans formationId.
set -euo pipefail
docker exec -i gsms-postgres psql -U lms -d lms_app -v ON_ERROR_STOP=1 <<'SQL'
\echo '=== Formations ACTIVE avec slug ==='
SELECT slug, name, status FROM "Formation" WHERE status = 'ACTIVE' ORDER BY slug LIMIT 30;

\echo ''
\echo '=== Candidatures landing sans formation (30 derniers) ==='
SELECT c.id, u.email, c.source, c."createdAt"::date
FROM "Candidature" c
JOIN "User" u ON u.id = c."userId"
WHERE c."formationId" IS NULL
  AND c.source IN ('LANDING_SESSION', 'LEAD')
ORDER BY c."createdAt" DESC
LIMIT 30;

\echo ''
\echo '=== Comptage ==='
SELECT
  count(*) FILTER (WHERE "formationId" IS NULL) AS sans_formation,
  count(*) FILTER (WHERE "formationId" IS NOT NULL) AS avec_formation
FROM "Candidature"
WHERE source IN ('LANDING_SESSION', 'LANDING');
SQL
