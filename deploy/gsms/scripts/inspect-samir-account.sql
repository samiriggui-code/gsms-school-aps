SELECT
  u.id,
  u.email,
  u."proEmail",
  u.name,
  u.status,
  u."isTrashed",
  u."isProtected",
  u."roleId",
  r.slug AS role_slug,
  r.name AS role_name,
  u."userCategory",
  u."createdAt",
  u."updatedAt"
FROM "User" u
LEFT JOIN "UserRole" r ON r.id = u."roleId"
WHERE u.id = '29b90c9f-6094-449d-b072-3b5f2c09d90f'
   OR u.email ILIKE '%samir%'
   OR u."proEmail" ILIKE '%samir%'
   OR u.name ILIKE '%samir%';

SELECT
  c.id AS candidature_id,
  c."userId",
  c.status AS candidature_status,
  c.source,
  c."createdAt"
FROM "Candidature" c
WHERE c."userId" = '29b90c9f-6094-449d-b072-3b5f2c09d90f'
   OR c.id = '944f5299-c974-48e5-8d28-5d76f91cc6b7';
