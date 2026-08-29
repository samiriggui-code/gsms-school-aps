# Draft Prisma — Evidence Engine (G8, Vague 2) — **PAS mergé**

> Auteur draft : Claude, papier, comme assigné (`PLAN-ACTION-GLOBAL-GSMS.md` ligne 118/190).
> Gate : merge **seulement** après lock de `SD-06-EVENT-CATALOG-DRAFT.md` (ce draft en dépend — `Evidence.event_id` référence le catalogue SD-06) **et** ack explicite dans `HANDOFF-CLAUDE.md`, même pattern que `FUNDING_CASE_PRISMA_DRAFT.md`.
> Source : formalisé depuis `docs/GSMS SCHOOL — ARCHITECTURE QUALIOPI, PREUVES, SESSIONS ET AUDIT.md` §7 (shape déjà écrite dans la doctrine, pas inventée ici — juste traduite en Prisma).
> Single-tenant : pas de `tenantId`. Doctrine clé (§8 du doc source) : **1 preuve peut couvrir N indicateurs** — jamais forcer `1 preuve = 1 indicateur`.

## Enums proposés

```prisma
enum EvidenceSourceType {
  DOCUMENT
  EVENT
  SIGNATURE
  DATABASE_RECORD
  EMAIL
  QUESTIONNAIRE
  EVALUATION
  MESSAGE
  LOG
  STATISTIQUE
  HISTORIQUE
  VALIDATION
  RELATION
}

enum EvidenceStatus {
  PENDING
  VALID
  EXPIRED
  DISPUTED
  SUPERSEDED
}
```

`EvidenceSourceType` = traduction directe de la liste §6 du doc source ("Une preuve peut être : DOCUMENT / EVENT / SIGNATURE / DATABASE RECORD / EMAIL / QUESTIONNAIRE / EVALUATION / MESSAGE / LOG / STATISTIQUE / HISTORIQUE / VALIDATION / RELATION"). Pas de `type` métier libre en V1 (ex. "convention", "bilan formateur") — proposé comme `String` libre sur `Evidence.category` plutôt qu'un enum fermé, vu la longueur de la liste catégories (~20 valeurs) et son évolutivité probable. **Point à trancher en review.**

## Modèle (socle P0)

```prisma
model Evidence {
  id                 String              @id @default(uuid())
  category           String              // "convention" | "emargement" | "bilan_formateur" | ... (libre, pas enum fermé)
  sourceType         EvidenceSourceType
  sourceId           String              // id de l'enregistrement source (polymorphe, pas de FK stricte — cf. note ci-dessous)
  status             EvidenceStatus      @default(PENDING)
  validUntil         DateTime?
  immutableReference String?             @unique // hash/checksum une fois VALID, pour intégrité — calcul différé, pas dans ce draft

  sessionId    String?
  session      FormationSession? @relation(fields: [sessionId], references: [id])
  formationId  String?
  formation    Formation?        @relation(fields: [formationId], references: [id])
  learnerUserId String?
  learner      User?             @relation("EvidenceLearner", fields: [learnerUserId], references: [id])
  trainerUserId String?
  trainer      User?             @relation("EvidenceTrainer", fields: [trainerUserId], references: [id])
  companyId    String?
  company      Company?          @relation(fields: [companyId], references: [id])

  eventName    String?  // référence SD-06 event_name (String libre — pas de table SystemEvent dans ce draft, cf. hors-scope)

  metadata     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  indicatorLinks EvidenceIndicatorLink[]

  @@index([sessionId])
  @@index([formationId])
  @@index([learnerUserId])
  @@index([companyId])
  @@index([category])
  @@index([status])
  @@index([sourceType, sourceId])
}

/// N:N Evidence ↔ indicateur Qualiopi — une preuve peut couvrir plusieurs indicateurs (doctrine §8, explicite).
model EvidenceIndicatorLink {
  id          String   @id @default(uuid())
  evidenceId  String
  evidence    Evidence @relation(fields: [evidenceId], references: [id], onDelete: Cascade)
  indicatorCode String // code indicateur Qualiopi V9 — référentiel statique `apps/lms-crm/lib/of/qualiopi-indicators.ts` (`QUALIOPI_INDICATORS_V9`, vérifié présent), pas de FK Prisma
  createdAt   DateTime @default(now())

  @@unique([evidenceId, indicatorCode])
  @@index([indicatorCode])
}
```

### Notes de design (à trancher en review)

- **`sourceId` sans FK stricte** : une Evidence peut référencer n'importe quelle table source (Emargement, ComplianceDossierItem, SatisfactionSurvey, FundingCaseEvent, un email envoyé...). Une FK Prisma classique forcerait une seule table cible. Deux options : (a) `sourceId` en String libre + `sourceType`/`category` comme discriminant applicatif (ce draft), ou (b) une table de jonction polymorphe par type source. (a) est plus simple, cohérent avec le principe "ne pas fabriquer une usine à gaz avant d'avoir des vrais besoins" déjà appliqué à Funding — proposé par défaut, à confirmer.
- **`eventName` en String libre, pas de FK vers une table `SystemEvent`** : ce draft ne crée pas de table d'événements runtime (`SystemEvent`/outbox) — c'est explicitement hors scope de SD-06 aussi (§4). `eventName` sert juste de traçabilité/filtrage vers le catalogue SD-06 documenté en papier.
- **`immutableReference`** : mentionné dans la doctrine source ("immutable_reference") pour l'intégrité d'audit — le calcul réel (hash de quoi, à quel moment) n'est pas défini dans ce draft, juste le champ réservé.

## Hors scope ce draft

- Table `SystemEvent`/outbox runtime (appartient à l'implémentation SD-06, pas à ce draft Evidence).
- `ExternalExchange` (connecteurs externes) — vague suivante.
- Qualiopi Engine (recalcul automatique de couverture à partir des `EvidenceIndicatorLink`) — ce draft pose juste les données, pas le moteur de calcul.
- Migration des `ComplianceDossierItem` Qualiopi existants vers `Evidence` — c'est un futur refactor (le classeur Qualiopi actuel reste un "checklist manuel", pas encore branché sur Evidence ; documenté comme drift connu depuis `QUALIOPI_DRIFT.md`).

## Checklist review

- [x] `category` en String libre vs enum fermé — **OK V1** (Cursor) : enum fermé trop tôt, resserrable plus tard.
- [x] `sourceId` sans FK stricte — **OK** (Cursor), cohérent avec le pattern déjà utilisé pour `FileAsset`. Index composite `@@index([sourceType, sourceId])` ajouté (suggestion Cursor, appliqué ci-dessus).
- [x] FKs `session/formation/learner/trainer/company` toutes optionnelles — **OK** (Cursor).
- [x] Dépend de SD-06 LOCKED avant merge — **confirmé**, SD-06 est maintenant LOCKED (voir `SD-06-EVENT-CATALOG-DRAFT.md`).
- [x] `programId` renommé en **`formationId`** (convention monorepo, Cursor) — appliqué ci-dessus.
- [x] `indicatorCode` référentiel cité explicitement (`apps/lms-crm/lib/of/qualiopi-indicators.ts`, vérifié présent) — appliqué ci-dessus.
- [ ] **Au merge (Cursor)** : ajouter les reverse relations sur `User`/`Company`/`Formation`/`FormationSession` (sinon `db:push` échoue) — action d'implémentation, pas un point de design, à faire par Cursor au moment du merge.

## ✅ Gate Evidence ouvert (29/08/2026)

SD-06 LOCKED + tous les points de design ci-dessus tranchés. Cursor peut merger ce schéma Prisma (avec les reverse relations nécessaires) et enregistrer les DocTypes `Evidence`/`EvidenceIndicatorLink`.
