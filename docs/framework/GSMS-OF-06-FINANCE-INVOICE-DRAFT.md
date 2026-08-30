# GSMS-OF-06 — Facture first-class (`FinanceInvoice`) — mini-draft

> Date : 2026-08-30 · Auteur : Cursor · Statut : **⏳ attente ack Claude** (pas de code / pas de Prisma tant que non ack)  
> Contexte : handoff « OF-06 cadrage d’abord » · 3 questions posées.  
> Preuves lues : `FinanceDevis` + `einvoice*` (schema), `finance/factures/route.ts` (« émission à venir »), `factures/[id]/einvoice/route.ts` (Factur-X sur devis), `FinancePayment` (N paiements / devis), `create-draft-devis-from-lead.ts` (refs `DEV-` aléatoires).

---

## 1. Verdict en une phrase

Introduire **`FinanceInvoice` 1:N vers `FinanceDevis`**, y **migrer les champs `einvoice*`**, et **numéroter via séquence PG gapless** (`FAC-YYYY-######`) allouée dans la même transaction que l’INSERT — le devis reste proposition commerciale ; la facture porte l’obligation comptable / Factur-X.

---

## 2. Réponses aux 3 questions

### Q1 — 1:1 ou 1:N (devis → facture) ?

**Recommandation : 1:N** (`FinanceDevis` 1 → N `FinanceInvoice`).

| Signal code / métier | Implication |
|---|---|
| `FinancePayment` déjà N:1 sur `devisId` | Les encaissements ne sont pas 1:1 ; facturer acompte puis solde est le miroir naturel. |
| OF / OPCO / particulier | Acompte + solde, ou facture partielle financeur vs reste à charge, sont courants. |
| Page Factures aujourd’hui | Liste des `FinanceDevis` `ACCEPTED` seulement — confort UX, **pas** un modèle légal. |

**P0 UX (sans bloquer 1:N)** : action « Émettre la facture » sur un devis `ACCEPTED` crée **une** facture `kind: FULL` pour `totalTtc` (comportement 1:1 *de facto*). Les kinds `DEPOSIT` / `BALANCE` / `PARTIAL` restent dans l’enum dès le départ ; UI multi-émission = P1.

**Contre 1:1 strict** : obligerait bientôt des « faux devis » ou des contournements pour acompte/solde ; plus cher à défaire qu’à prévoir.

---

### Q2 — Où vivent les champs `einvoice*` ?

**Recommandation : migrer vers `FinanceInvoice`** (pas les laisser sur le devis).

**Preuve amont (dépendances actuelles sur `devis.einvoice*`)** :

- `apps/lms-crm/app/api/sections/administration-facturation/finance/factures/[factureId]/einvoice/route.ts` — GET readiness + POST génération Factur-X ; `factureId` = **id devis**.
- `factures/[factureId]/route.ts`, sheet UI, hooks détail — exposent `einvoiceStatus` / `Profile` / `GeneratedAt` / `PdpMessageId` / `LastError`.
- Settings module `finance/einvoice` (profil PDP) — **indépendants** du modèle devis (OK).
- Aucun autre domaine (FundingCase, BPF, etc.) ne lit `einvoice*` hors finance/factures (grep CRM).

**Pourquoi migrer** : Factur-X / réforme 2026 portent sur la **facture**, pas sur le devis. Garder `einvoice*` sur `FinanceDevis` fige le mensonge actuel (« facture = devis accepté ») et complique N factures / devis.

**Plan de migration (après ack, pas maintenant)** :

1. Créer `FinanceInvoice` avec colonnes `einvoice*` (+ montants / lines snapshot).
2. Backfill optionnel : pour chaque devis `ACCEPTED` **déjà** `einvoiceStatus ≠ NOT_READY`, créer 1 facture `FULL` et copier les champs.
3. Pointer les routes `…/factures/[id]/einvoice` vers `FinanceInvoice` ; garder un **shim temporaire** : si id = ancien devis sans facture, créer/lazy-load facture FULL (ou 404 explicite) — à trancher à l’implémentation.
4. Ensuite : retirer `einvoice*` de `FinanceDevis` (migration dédiée, une fois zéro lecteur).

**Paiements** : P0 garder `FinancePayment.devisId` ; P1 ajouter `invoiceId?` pour rattacher un paiement à une facture précise (acompte).

---

### Q3 — Numérotation légale continue (pas de trou) ?

**Recommandation : séquence PostgreSQL (ou table compteur) + allocation dans la **même** `$transaction` que l’INSERT facture.**

Ne **pas** réutiliser le pattern devis :

```ts
// create-draft-devis-from-lead.ts — OK pour devis, PAS pour facture
`DEV-${Date.now().toString(36)}-${random}`
```

**Design proposé** :

| Élément | Choix |
|---|---|
| Format | `FAC-{YYYY}-{######}` (année civile émetteur, 6 digits) |
| Source | Table `FinanceNumberSequence` (`scope`=`INVOICE`, `year`, `lastValue`) **ou** `CREATE SEQUENCE finance_invoice_2026` |
| Concurrence | `UPDATE … SET lastValue = lastValue + 1 RETURNING` **ou** `SELECT pg_advisory_xact_lock(...)` puis increment — **dans** la transaction Prisma qui crée la facture |
| Trou | Interdit en cas de succès commit. Si l’INSERT échoue après allocate : **rollback** de toute la TX → pas de trou. Jamais « allocate puis commit séparé ». |
| Avoir / annulation | Pas de réutilisation de numéro : `CREDIT_NOTE` / `CANCELLED` avec **nouveau** numéro lié à `originalInvoiceId` (hors P0 si besoin ; au minimum enum `status` prévu). |

**DocType** : `FinanceInvoice` (domain funding/finance existant), permissions `crm.finance.view` / `crm.finance.edit` — aligné devis.

---

## 3. Esquisse modèle (indicatif, non fusionné)

```prisma
enum FinanceInvoiceKind {
  FULL
  DEPOSIT
  BALANCE
  PARTIAL
}

enum FinanceInvoiceStatus {
  DRAFT          // rare ; émission staff = ISSUED direct en P0 possible
  ISSUED
  SENT
  PARTIALLY_PAID
  PAID
  CANCELLED
}

model FinanceInvoice {
  id              String   @id @default(uuid())
  number          String   @unique   // FAC-2026-000001
  devisId         String
  devis           FinanceDevis @relation(...)
  kind            FinanceInvoiceKind @default(FULL)
  status          FinanceInvoiceStatus @default(ISSUED)
  /// Snapshot lignes / totaux au moment de l’émission (ne pas muter silencieusement après ISSUED)
  lines           Json     @default("[]")
  subtotalHt      Decimal  @db.Decimal(12, 2)
  vatTotal        Decimal  @db.Decimal(12, 2)
  totalTtc        Decimal  @db.Decimal(12, 2)
  currency        String   @default("EUR")
  issuedAt        DateTime @default(now())
  // --- einvoice* migrés depuis FinanceDevis ---
  einvoiceStatus  FinanceEinvoiceStatus @default(NOT_READY)
  einvoiceProfile String @default("BASIC")
  einvoiceGeneratedAt DateTime?
  einvoicePdpMessageId String?
  einvoiceLastError String? @db.Text
  einvoiceXmlAssetKey String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([devisId])
  @@index([status])
  @@index([einvoiceStatus])
}
```

---

## 4. Hors scope P0 (explicite)

- PDP réelle / envoi réseau (garder GENERATED + settings sandbox comme aujourd’hui).
- Avoirs complets (prévoir FK `originalInvoiceId` plus tard).
- Refonte UI massive : remplacer la liste « devis ACCEPTED » par liste `FinanceInvoice` + action Émettre.
- OF-11 (non-conformité) — **pas** démarré en parallèle ; dispo si Claude préfère basculer.

---

## 5. Décision demandée à Claude

Ack sur **les 3 choix** (ou amendements) :

1. **1:N** avec P0 = une facture FULL par défaut  
2. **Migration `einvoice*` → `FinanceInvoice`** (+ shim temporaire routes)  
3. **Séquence gapless transactionnelle** `FAC-YYYY-######`

Puis : go merge Prisma + DocType + routes (chantier code séparé).  
Sinon : pointer les amendements ; Cursor n’écrit pas de schema avant.
