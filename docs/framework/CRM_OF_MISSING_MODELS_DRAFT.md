# Draft Prisma — CRM OF manquants (G3) — **PAS mergé**

> Auteur : Cursor · 2026-08-29  
> Contexte : G3 demande Contact / Company / Learner / TrainingRequest.  
> **Aucun de ces 4 noms n’existe dans `schema.prisma` aujourd’hui.**  
> Gate merge : ack Claude dans `HANDOFF-CLAUDE.md` (comme Funding). **Pas de `tenantId`.**

## Mapping actuel (code DocType, zéro nouveau modèle)

| Cible V2 §76 | Prisma actuel | DocType enregistré |
|--------------|---------------|--------------------|
| Lead | `Lead` | `Lead` ✅ |
| Quote | `FinanceDevis` | `FinanceDevis` ✅ |
| Learner (dossier OF) | `Candidature` (User + formation/session) | `Candidature` ✅ (alias `learner`) |
| Contact | — | **draft ci-dessous** |
| Company | — (proche : `ClientSite` = site client, pas société CRM) | **draft** |
| TrainingRequest | — | **draft** |
| NeedsAnalysis / Positioning | — | hors P0 G3 |

## Proposition P0 (papier seulement)

```prisma
enum CrmCompanyKind {
  EMPLOYER
  OPCO_CLIENT
  PARTNER
  OTHER
}

model Company {
  id        String         @id @default(uuid())
  name      String
  siret     String?
  kind      CrmCompanyKind @default(EMPLOYER)
  email     String?
  phone     String?
  address   String?        @db.Text
  isActive  Boolean        @default(true)
  notes     String?        @db.Text
  contacts  Contact[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@index([name])
  @@index([siret])
}

model Contact {
  id          String   @id @default(uuid())
  companyId   String?
  company     Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  firstName   String
  lastName    String
  email       String?
  phone       String?
  jobTitle    String?
  /// Lien optionnel vers un Lead marketing
  leadId      String?  @unique
  lead        Lead?    @relation(fields: [leadId], references: [id], onDelete: SetNull)
  notes       String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([email])
  @@index([companyId])
}

enum TrainingRequestStatus {
  DRAFT
  SUBMITTED
  QUALIFIED
  ACCEPTED
  REJECTED
  CANCELLED
}

/// Demande de formation (B2B / employeur) — distincte du Lead individuel landing.
model TrainingRequest {
  id              String                @id @default(uuid())
  reference       String?               @unique
  companyId       String?
  company         Company?              @relation(fields: [companyId], references: [id], onDelete: SetNull)
  contactId       String?
  contact         Contact?              @relation(fields: [contactId], references: [id], onDelete: SetNull)
  formationId     String?
  formation       Formation?            @relation(fields: [formationId], references: [id], onDelete: SetNull)
  status          TrainingRequestStatus @default(DRAFT)
  headcount       Int?
  notes           String?               @db.Text
  ownerUserId     String?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  @@index([status])
  @@index([companyId])
  @@index([formationId])
}
```

### Relations à ajouter (si merge)

- `Lead.contact Contact?`
- `Formation.trainingRequests TrainingRequest[]`
- `Company` / `Contact` relations croisées comme ci-dessus

### Learner dédié ?

**Recommandation Cursor :** ne pas créer de table `Learner` séparée tant que `Candidature` + `User` couvrent le dossier apprenant OF. Si Claude veut un DocType `Learner` virtuel ou une table 1:1 `LearnerProfile`, à trancher en review — **pas dans ce merge**.

## Checklist Claude

- [ ] Company vs `ClientSite` — garder distinct ?
- [ ] TrainingRequest vs Lead landing — OK séparés ?
- [ ] Learner = alias Candidature OK, ou table neuve ?
- [ ] Go / no-go merge Prisma
