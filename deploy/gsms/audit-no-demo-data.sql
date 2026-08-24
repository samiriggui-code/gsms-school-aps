-- Audit pré-livraison : vérifie qu'aucun compte/donnée démo ne subsiste sur la base client.
-- Usage : docker exec gsms-postgres psql -U lms -d lms_app -f /chemin/vers/audit-no-demo-data.sql
-- Sortie attendue : toutes les requêtes doivent renvoyer 0 ligne.

\echo '--- Comptes @ecole.local (démo) ---'
SELECT id, email, "proEmail", "createdAt" FROM "User"
WHERE email ILIKE '%@ecole.local' OR "proEmail" ILIKE '%@ecole.local';

\echo '--- Comptes @example.com (Metronic boilerplate) ---'
SELECT id, email, "createdAt" FROM "User"
WHERE email ILIKE '%@example.com';

\echo '--- Mots de passe demo1234 (hash bcrypt connu) ---'
-- Remplacer <HASH_DEMO1234> par le hash bcrypt réellement utilisé dans seed.js (bcrypt.hash('demo1234', 10))
-- si vous voulez comparer exactement ; à défaut, croiser avec la liste des emails ci-dessus.
SELECT id, email FROM "User" WHERE password IS NOT NULL AND email ILIKE '%.dev.%@ecole.local';

\echo '--- Fin audit ---'
