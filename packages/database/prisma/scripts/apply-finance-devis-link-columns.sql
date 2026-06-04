-- À exécuter manuellement si `prisma migrate deploy` n’est pas possible (ex. DIRECT_URL manquant en CLI).
-- Idempotent : ignore si les colonnes existent déjà (PostgreSQL ≥ 9.1 pour IF NOT EXISTS sur ADD COLUMN : utiliser bloc DO).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'FinanceDevis' AND column_name = 'candidatureId'
  ) THEN
    ALTER TABLE "FinanceDevis" ADD COLUMN "candidatureId" TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'FinanceDevis' AND column_name = 'formationSessionId'
  ) THEN
    ALTER TABLE "FinanceDevis" ADD COLUMN "formationSessionId" TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "FinanceDevis_candidatureId_idx" ON "FinanceDevis"("candidatureId");
CREATE INDEX IF NOT EXISTS "FinanceDevis_formationSessionId_idx" ON "FinanceDevis"("formationSessionId");

DO $$
BEGIN
  ALTER TABLE "FinanceDevis"
    ADD CONSTRAINT "FinanceDevis_candidatureId_fkey"
    FOREIGN KEY ("candidatureId") REFERENCES "Candidature"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "FinanceDevis"
    ADD CONSTRAINT "FinanceDevis_formationSessionId_fkey"
    FOREIGN KEY ("formationSessionId") REFERENCES "FormationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
