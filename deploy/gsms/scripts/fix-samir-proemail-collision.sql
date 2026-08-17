-- Sépare le candidat préinscription du superadmin (même proEmail).
-- Superadmin garde samir.iggui@ecole.local
-- Candidat (préinscription live.com) reçoit un login distinct.

UPDATE "User"
SET
  "proEmail" = 'samir.iggui.candidat@ecole.local',
  status = 'ACTIVE',
  "isTrashed" = false,
  "updatedAt" = NOW()
WHERE id = '29b90c9f-6094-449d-b072-3b5f2c09d90f'
  AND "proEmail" = 'samir.iggui@ecole.local';

UPDATE "User"
SET
  status = 'ACTIVE',
  "isTrashed" = false,
  "isProtected" = true,
  "proEmail" = 'samir.iggui@ecole.local',
  "updatedAt" = NOW()
WHERE id = 'cb534786-9df6-48ab-a5ac-9033359624a7';

SELECT id, email, "proEmail", name, status, "isTrashed", "isProtected", "roleId"
FROM "User"
WHERE id IN (
  '29b90c9f-6094-449d-b072-3b5f2c09d90f',
  'cb534786-9df6-48ab-a5ac-9033359624a7'
);
