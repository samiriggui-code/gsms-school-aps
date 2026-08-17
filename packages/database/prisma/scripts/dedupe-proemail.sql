-- Déduplique User.proEmail (case-insensitive) puis crée l’index unique.
-- PostgreSQL : plusieurs NULL restent autorisés sous UNIQUE.
-- Exécuter avant `pnpm db:push` / migrate si des doublons existent.

WITH ranked AS (
  SELECT
    id,
    lower("proEmail") AS pro_key,
    ROW_NUMBER() OVER (
      PARTITION BY lower("proEmail")
      ORDER BY "isProtected" DESC, "createdAt" ASC, id ASC
    ) AS rn
  FROM "User"
  WHERE "proEmail" IS NOT NULL
    AND btrim("proEmail") <> ''
    AND "isTrashed" = false
)
UPDATE "User" u
SET "proEmail" = split_part(u."proEmail", '@', 1)
  || '.u'
  || ranked.rn::text
  || '@'
  || COALESCE(NULLIF(split_part(u."proEmail", '@', 2), ''), 'ecole.local')
FROM ranked
WHERE u.id = ranked.id
  AND ranked.rn > 1;

UPDATE "User"
SET "proEmail" = NULL
WHERE "proEmail" IS NOT NULL AND btrim("proEmail") = '';

CREATE UNIQUE INDEX IF NOT EXISTS "User_proEmail_key" ON "User" ("proEmail");
