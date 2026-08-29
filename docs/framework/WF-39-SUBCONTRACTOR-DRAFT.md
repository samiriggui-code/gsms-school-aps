# WF-39 — Sous-traitants : mini-draft (avant merge Prisma)

> Cursor → Claude · 2026-08-29 · suite SD-06 famille B

## Verdict réutilisation `ComplianceDossier`

| Besoin WF-39 | Compliance existant | Fit ? |
|---|---|---|
| Pièces (Kbis, assurances, contrat, évaluations…) | `ComplianceDossier` + items + templates | **Oui** |
| State machine `PENDING_VALIDATION → APPROVED → ACTIVE → REVIEW_REQUIRED → SUSPENDED` | `ComplianceDossierStatus` = `INCOMPLETE\|COMPLETE\|EXPIRED\|WAIVED\|ARCHIVED` ; items = `MISSING…VALIDATED` | **Non** — sémantique « dossier pièces » ≠ cycle de vie prestataire |

Forcer la SM dans `metadata` ou détourner `COMPLETE`/`ARCHIVED` créerait de la dette et brouillerait Qualiopi / onboarding.

**Décision proposée** : hybride

1. **Nouveau** (petit) : statut de qualification sous-traitant  
2. **Réutiliser** : dossier pièces via nouveau `ComplianceDossierKind`

## Draft Prisma (à valider avant `db:push`)

```prisma
enum SubcontractorQualificationStatus {
  PENDING_VALIDATION
  APPROVED
  ACTIVE
  REVIEW_REQUIRED
  SUSPENDED
}

model SubcontractorRecord {
  id        String                           @id @default(uuid())
  /// Structure / société (Company CRM) si connue
  companyId String?
  company   Company?                         @relation(fields: [companyId], references: [id], onDelete: SetNull)
  label     String
  siret     String?
  status    SubcontractorQualificationStatus @default(PENDING_VALIDATION)
  notes     String?                          @db.Text
  /// Lien optionnel vers le dossier pièces (créé à l’activation du template)
  complianceDossierId String?                @unique
  createdAt DateTime                         @default(now())
  updatedAt DateTime                         @updatedAt

  events SubcontractorStatusEvent[]

  @@index([status])
  @@index([companyId])
}

model SubcontractorStatusEvent {
  id                 String                           @id @default(uuid())
  subcontractorId    String
  subcontractor      SubcontractorRecord              @relation(fields: [subcontractorId], references: [id], onDelete: Cascade)
  fromStatus         SubcontractorQualificationStatus?
  toStatus           SubcontractorQualificationStatus
  source             String                           // manual | system
  actorUserId        String?
  payload            Json?
  createdAt          DateTime                         @default(now())

  @@index([subcontractorId, createdAt])
}
```

### Enums Compliance (additifs)

```prisma
enum ComplianceDossierKind {
  // ...existants
  SUBCONTRACTOR_QUALIFICATION
}

enum ComplianceSubjectType {
  // ...existants
  SUBCONTRACTOR  // subjectId = SubcontractorRecord.id
}
```

## Seed template (réutilise le moteur)

`kind: SUBCONTRACTOR_QUALIFICATION` — items P0 suggérés :

| code | label |
|---|---|
| KBIS | Extrait Kbis |
| ASSURANCE_RC | Assurance RC pro |
| CONTRAT | Contrat de sous-traitance |
| QUALIOPI_ATTEST | Attestation conformité Qualiopi (si applicable) |
| COMPETENCES | Preuves compétences / habilitations |

## Evidence / SD-06

Sur transition statut → `recordStatusEvidence` avec `eventName: SUBCONTRACTOR_STATUS_CHANGED` (déjà catalogué §5 famille B).

## UI / API (après ack)

- Section : `gestion-ressources` (RH ou partenaires) — page liste + transitions  
- API : `sections/gestion-ressources/.../sous-traitants`  
- Pas d’agent / pas d’ExternalExchange

## Question gate Claude

1. OK pour **nouveau modèle** `SubcontractorRecord` + kind Compliance (hybride) ?  
2. Ou préfères-tu **uniquement** `SubcontractorRecord` sans Compliance au P0 (pièces en `FundingDocument`-like plus tard) ?  
3. Lien `Company` obligatoire ou optionnel au create ?

**Pas de `db:push` / merge schema tant que tu n’as pas ack ce draft.**
