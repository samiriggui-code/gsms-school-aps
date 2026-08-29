# Draft Prisma — FundingCase (Vague 2 / G5) — **PAS encore mergé dans schema.prisma**

> Auteur draft : Cursor (post G1-E) pour review Claude.  
> Gate : merge **seulement** après `✅ gate Funding ouvert` de Claude dans `HANDOFF-CLAUDE.md`.  
> Single-tenant : **pas de `tenantId`**. Identité doc = `id` (UUID) ; naming DocType = `UUID_INTERNAL` / SERIES plus tard.  
> Doctrine : connecteurs n8n = orchestration ; état métier = FundingCase.

## Enums proposés

```prisma
enum FundingFunderType {
  CPF
  OPCO
  FRANCE_TRAVAIL
  AGEFIPH
  REGION
  ENTREPRISE
  TRANSITIONS_PRO
  OTHER
}

enum FundingTransport {
  MANUAL_PORTAL
  PARTIAL_API
  VERIFIED_API
  INTERNAL
}

enum FundingCaseStatus {
  DRAFT
  DOCUMENTS_REQUIRED
  READY_TO_SUBMIT
  SUBMITTED
  PENDING
  APPROVED
  PARTIALLY_APPROVED
  REJECTED
  SERVICE_IN_PROGRESS
  SERVICE_COMPLETED
  JUSTIFICATION_REQUIRED
  READY_TO_INVOICE
  INVOICED
  PAYMENT_PENDING
  PAID
  CLOSED
  CANCELLED
}
```

## Modèles (socle P0)

```prisma
model FundingProvider {
  id          String   @id @default(uuid())
  code        String   @unique // EDOF, ATLAS, FT_KAIROS_PORTAL, …
  label       String
  funderType  FundingFunderType
  transport   FundingTransport
  isActive    Boolean  @default(true)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cases       FundingCase[]
}

model FundingCase {
  id                 String            @id @default(uuid())
  /// Affichage type FUND-000882 (SERIES naming DocType plus tard)
  reference          String?           @unique
  providerId         String
  provider           FundingProvider   @relation(fields: [providerId], references: [id])
  learnerUserId      String?
  learnerUser        User?             @relation("FundingCaseLearner", fields: [learnerUserId], references: [id])
  sessionId          String?
  session            FormationSession? @relation(fields: [sessionId], references: [id])
  participantId      String?
  participant        FormationSessionParticipant? @relation(fields: [participantId], references: [id])
  funderType         FundingFunderType
  transport          FundingTransport
  status             FundingCaseStatus @default(DRAFT)
  externalReference  String?
  requestedAmount    Decimal?          @db.Decimal(12, 2)
  approvedAmount     Decimal?          @db.Decimal(12, 2)
  currency           String            @default("EUR")
  notes              String?
  ownerUserId        String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  events             FundingCaseEvent[]
  documents          FundingDocument[]

  @@index([status])
  @@index([providerId])
  @@index([sessionId])
  @@index([learnerUserId])
}

model FundingCaseEvent {
  id           String   @id @default(uuid())
  caseId       String
  case         FundingCase @relation(fields: [caseId], references: [id], onDelete: Cascade)
  fromStatus   FundingCaseStatus?
  toStatus     FundingCaseStatus
  source       String   // ui | n8n | connector | system
  payload      Json?
  actorUserId  String?
  createdAt    DateTime @default(now())

  @@index([caseId, createdAt])
}

model FundingDocument {
  id          String   @id @default(uuid())
  caseId      String
  case        FundingCase @relation(fields: [caseId], references: [id], onDelete: Cascade)
  code        String   // checklist item code
  label       String
  status      String   // MISSING | UPLOADED | VALIDATED | REJECTED
  fileAssetId String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([caseId, code])
  @@index([caseId])
}
```

## Relations à ajouter sur modèles existants

- `User.fundingCasesAsLearner FundingCase[] @relation("FundingCaseLearner")`
- `FormationSession.fundingCases FundingCase[]`
- `FormationSessionParticipant.fundingCases FundingCase[]`

## Hors scope ce draft

`ExternalExchange`, `Evidence`, `ExternalStatusMapping` — Vague suivante (après FundingCase live).

## Checklist Claude

- [ ] Gate ouvert post G1-E ?
- [ ] Enums / statuts OK vs architecture V1 ?
- [ ] FKs session/participant/user OK single-tenant ?
- [ ] OK merge → Cursor `pnpm db:push` + DocType `FundingCase` register ?
