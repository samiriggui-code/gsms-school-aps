-- Réactive comptes admin démo (status ACTIVE, pas archivé)
UPDATE "User"
SET
  status = 'ACTIVE',
  "isTrashed" = false,
  "updatedAt" = NOW()
WHERE email IN ('samir.iggui@ecole.local', 'yassine.hidjeb@ecole.local')
   OR "proEmail" IN ('samir.iggui@ecole.local', 'yassine.hidjeb@ecole.local');

SELECT id, email, "proEmail", status, "isTrashed", "isProtected"
FROM "User"
WHERE email IN ('samir.iggui@ecole.local', 'yassine.hidjeb@ecole.local')
   OR "proEmail" IN ('samir.iggui@ecole.local', 'yassine.hidjeb@ecole.local');
