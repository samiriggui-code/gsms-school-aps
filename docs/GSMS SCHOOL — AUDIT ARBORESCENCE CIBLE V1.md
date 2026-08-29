# GSMS SCHOOL — AUDIT & ARBORESCENCE CIBLE V1

> **Date :** 29 août 2026  
> **Nature :** projection produit/architecture (pas un inventaire code-only)  
> **Sources croisées :** cartographie CRM · workflows OF · Qualiopi/preuves · Funding Engine · matrice connecteurs · regulatory-sources · recherche OPCO/KAIROS · EVE · images VF (circuits)  
> **App :** `apps/lms-crm` (port 3001) · monorepo `gsms-school`

---

## 0. Comment lire ce document

| Couche | Rôle |
|--------|------|
| **A. Vision système** | Qui est le cerveau, qui orchestre, qui observe |
| **B. Écart aujourd’hui → cible** | Ce qui existe vs ce qui manque |
| **C. Arborescence front** | Menu inchangé + pages/enrichissements projetés |
| **D. Moteurs** | Domain engines (pas des pages) |
| **E. API** | Routes sections + interne n8n + connectors |
| **F. Données** | Prisma cible |
| **G. Connexions externes** | EDOF / OPCO / FT / storage / LLM |
| **H. Docs & preuves réglementaires** | Carte des MD + regulatory-sources |
| **I. Roadmap de construction** | Ordre sans tout mélanger |

**Doctrine figée :**

```text
Métier GSMS (Prisma) = source de vérité
n8n = bras (délais, relances, fichiers, callbacks)
Evidence → Qualiopi → Audit = observation
Funding connectors = abstraction (souvent MANUAL_PORTAL)
EVE = orbe conversationnelle (dernier)
Jamais inventer une API financeur
Menu : ne pas créer de section « Qualiopi workflow » / « Evidence » / « EVE »
```

---

## 1. Vision système (cible)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR CRM (+ EVE orbe)                    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ UI Command Bus / apiFetch / WS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ apps/lms-crm  — INTERFACE MÉTIER (sections menu actuelles)              │
│  Accueil · Pilotage · Ressources · Académique · Finance · Comm · …      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ REST /api/sections/* + /api/internal/*
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ DOMAIN ENGINES (packages + lib lms-crm + workers)                       │
│                                                                         │
│  Session Engine │ Document Engine │ Funding Engine │ Quality Engines    │
│  (parcours)     │ (états docs)     │ + Connectors   │ Evidence→Qualiopi  │
│                 │                  │                │ → Audit            │
└───────┬─────────────────┬──────────────────┬────────────────────────────┘
        │                 │                  │
        ▼                 ▼                  ▼
   PostgreSQL         Event Bus         n8n Workflows
   (@repo/database)   (CrmEventOutbox)  (orchestrate only)
        │                                    │
        │              ┌─────────────────────┼─────────────────────┐
        │              ▼                     ▼                     ▼
        │         MANUAL_PORTAL         XML EDOF              REST*
        │         (OPCO/KAIROS)         (catalogue)      (Convergence CFA
        │                                                     si produit)
        ▼
   @repo/storage · Redis · mail · report-engine · OpenRouter (IA/EVE)
```

`*` REST financeur **uniquement** si `connector-capabilities.json` dit `api_available: true` + source VERIFIED.

---

## 2. Audit d’écart (honête)

### 2.1 Ce qui est déjà solide

| Domaine | État |
|---------|------|
| Menu 3 niveaux + cartographie | Aligné (Qualiopi sous Ressources, Suivi sous Académique, Financeurs/BPF sous Finance) |
| Vie scolaire (formations, sessions, étudiants, planning) | Opérationnel |
| Suivi tableau (émargement, docs, exam, sat, circuits n8n) | Cœur OF partiel — **à renforcer** en Evidence/Funding |
| Qualiopi classeur 32 | Template audit manuel (Compliance*) — **pas encore moteur de couverture** |
| Finance devis → facture/paiement | Présent ; Financeurs/BPF = scaffold |
| n8n SessionAutomationRun + outbox | Base circuits |
| Packages monorepo | database, api-core, storage, workers, auth, redis |

### 2.2 Trous critiques (bloquent la doctrine docs)

| Trou | Impact |
|------|--------|
| Pas de modèles `FundingCase` / `Evidence` / `ExternalExchange` | Impossible de brancher connecteurs + Qualiopi sur des faits |
| Qualiopi = saisie manuelle classeur | Pas de recalcul depuis preuves session/finance |
| Docs session sans state machine unifiée CONFIRMÉ→ENVOYÉ→SIGNÉ | Relances VF non industrialisables |
| Financeurs page vide de moteur | OPCO/CPF/FT = champs participant seulement |
| Pas de checklist couverture session / ZIP preuves | Audit blanc impossible |
| EVE / tool registry | Absent (volontairement **dernier**) |
| Guide Qualiopi PDF ministère | Téléchargement manuel restant |

### 2.3 Ce qu’on ne doit **pas** faire

- Nouvelle section menu « Moteur Qualiopi », « Connecteurs », « EVE »
- `IF OPCO_A` dans n8n
- API EDOF / KAIROS / OPCO inventées
- Scraper portails
- Qualiopi sous Support (déjà migré)
- Second schema Prisma

---

## 3. Arborescence front cible (menu inchangé + enrichissements)

Les **sections / modules restent**. Les `+` = pages ou onglets à ajouter quand le moteur existe.

```text
/accueil
│
├── /pilotage-supervision
│   ├── /pilotage
│   │   ├── alertes          ← consomme readiness, funding, findings
│   │   ├── indicateurs
│   │   ├── rapports
│   │   └── risques
│   └── /ia                  ← brouillons programmes (≠ preuves Qualiopi)
│       ├── brouillons
│       └── historique
│
├── /gestion-ressources
│   ├── /compagnie           ← preuves org (identité, docs)
│   ├── /qualiopi            ★ CONSOMMATEUR moteur
│   │   ├── (hub)            couverture globale, alertes indicateurs
│   │   ├── /classeur        32 ind. + liens Evidence
│   │   ├── /historique
│   │   ├── + /couverture    matrice indicateur × sessions (échantillon)
│   │   ├── + /audit-blanc   lancement Audit Engine
│   │   └── + /packs         ZIP preuves session (export)
│   ├── /rh
│   │   ├── formateurs       ← WF compétences / docs formateur
│   │   └── …                (+ sous-traitants plus tard dans formateurs)
│   └── /equipements
│
├── /gestion-academique
│   ├── /vie-scolaire        ★ PRODUCTEUR amont
│   │   ├── formations
│   │   ├── sessions         state DRAFT→…→ARCHIVED + events
│   │   ├── planning
│   │   └── etudiants        besoin / positionnement / handicap
│   └── /suivi-formations    ★ PRODUCTEUR preuves session
│       ├── (hub)
│       ├── /tableau         ★ cœur : onglets stagiaires, journal, docs,
│       │                    émargement, exam, e-formation, funding,
│       │                    + readiness checklist, findings
│       ├── /satisfaction
│       ├── /circuits        n8n J-N→J+N (observer runs)
│       └── + /readiness     optionnel (sinon panneau dans tableau)
│
├── /administration-facturation
│   └── /finance             ★ FUNDING ENGINE UI
│       ├── devis / factures / paiements
│       ├── /financeurs      ★ FundingCase + tâches manuelles + liens portail
│       │   └── + /cases/[id]
│       │   └── + /catalog-export-edof   (export XML catalogue)
│       ├── /bpf
│       └── rapports
│
├── /communication-contenu   ★ leads → WF-01
│   ├── cms / marketing / seo
│
├── /support-qualite         tickets / incidents → réclamations / findings
│
└── /securite-configuration  RBAC · GED · conformité docs

EVE (pas dans le menu)
└── Orbe globale AppShell + chat drawer + voice (dernier)
```

### Layout UI (règle existante)

| Niveau | Pattern |
|--------|---------|
| Section | Stats + welcome + cartes Accéder |
| Module hub | 3 rangées type Compagnie |
| Feuille | KPI + DataGrid / fiche |

---

## 4. Arborescence moteurs (cible code)

Pas exposés comme menu — packages / `lib/` / workers.

```text
packages/database/prisma/
  + FundingProvider, FundingCase, FundingCaseEvent, FundingDocument
  + ExternalEntityMapping, ExternalStatusMapping, ExternalExchange
  + Evidence, EvidenceIndicatorLink
  + QualiopiIndicator, QualiopiIndicatorRule, QualiopiCoverageSnapshot
  + AuditRun, AuditFinding
  + DocumentLifecycle (ou états sur FileAsset / session docs)
  + (existants) FormationSession*, SatisfactionSurvey, SessionAutomationRun,
                Compliance*, FinanceDevis*, CrmEventOutbox

packages/api-core/   (ou apps/lms-crm/lib/engines/)
  ├── session/          state machine + readiness
  ├── documents/        CONFIRMÉ → ENVOYÉ → SIGNÉ + relances
  ├── funding/
  │   ├── funding-case.ts
  │   ├── state-machine.ts
  │   ├── connector-registry.ts
  │   └── connectors/
  │       ├── base/
  │       ├── edof/          XML catalog + assisted dossier
  │       ├── opco/          adapters MANUAL_PORTAL × 11
  │       ├── france-travail/
  │       ├── agefiph/
  │       └── company/       interne
  ├── evidence/
  ├── qualiopi/             coverage recalculate (jamais fabrique preuve)
  ├── audit/                blanc / sample / risk-based
  └── events/               emit + idempotency keys

packages/workers/
  ├── stats-aggregator (existant)
  ├── funding-catalog-export (EDOF XML jobs)
  ├── evidence-reindex / qualiopi-recalc (si lourd)
  └── exports packs ZIP

apps/lms-crm/lib/eve/       ★ DERNIER
  ├── core, policy, tools, voice, ui-command-bus
  └── tools → session.* funding.* qualiopi.* ui.*  (jamais Prisma direct)
```

---

## 5. Arborescence API cible

Convention : miroir UI sous `app/api/sections/…`

```text
app/api/
├── auth/
├── _shared/http/response.ts          ok / fail
├── common/files|health|stats
├── internal/
│   └── n8n/
│       ├── automation/*              (existant circuits)
│       └── funding/
│           ├── cases/[id]/events
│           ├── cases/[id]/status
│           ├── callback
│           └── connector-execute     (n8n appelle GSMS, pas l’inverse métier)
│
└── sections/
    ├── gestion-academique/
    │   ├── vie-scolaire/sessions|etudiants|formations|…
    │   └── suivi-formations/
    │       ├── tableau/…             (émargement, docs, …)
    │       ├── satisfaction/
    │       ├── circuits/
    │       └── + readiness/
    │
    ├── gestion-ressources/
    │   └── qualiopi/
    │       ├── classeur (existant)
    │       ├── + coverage
    │       ├── + audit-runs
    │       └── + evidence-links
    │
    ├── administration-facturation/
    │   └── finance/
    │       ├── devis|factures|paiements (existants)
    │       ├── + financeurs/providers
    │       ├── + financeurs/cases
    │       ├── + financeurs/cases/[id]/manual-tasks
    │       ├── + financeurs/edof/catalog/export
    │       └── bpf
    │
    ├── pilotage-supervision/…
    ├── communication-contenu/…
    ├── support-qualite/…
    └── securite-configuration/…
```

### Contrats réponses

Toujours `{ success, data | error }` + session NextAuth sur routes protégées.

### n8n

```text
GSMS event → n8n WF-FUNDING-ROUTER / circuits session
  → execute transport (XML | MANUAL_TASK | API si capability)
  → callback GSMS
  → FundingCase / ExternalExchange / Evidence
```

Briques : `FUNDING_MANUAL_TASK`, `FUNDING_XML_VALIDATE`, `FUNDING_FILE_EXPORT`, `FUNDING_CALLBACK_GSMS`, `EVIDENCE_REGISTER` — **pas** de if métier par OPCO.

---

## 6. Connexions externes (réalité 2026-08-29)

```text
GSMS
 ├─ EDOF          [VERIFIED] XML catalogue export/import
 │                [ASSISTED]  dossiers / DSF / facture portail
 ├─ OPCO ×11      [ASSISTED]  MANUAL_PORTAL (myAtlas, MyA, M-Gestion, …)
 ├─ Kairos portail [ASSISTED]  devis AIF/POEI MANUAL
 ├─ API Kairos    [PARTIAL]   Zéro Saisie / Parcours / Individu / Open Formation
 ├─ Convergence   [PARTIAL]   CFA apprentissage only — off V1 OF continue
 ├─ Anotéa        [PARTIAL]   avis sat — hors FundingCase
 ├─ Agefiph/TP/Régions [ASSISTED/UNVERIFIED]
 ├─ S3/@repo/storage
 ├─ Redis / workers
 ├─ SMTP / mail
 ├─ OpenRouter + ElevenLabs     (EVE / IA brouillons)
 └─ n8n instance
```

Source de vérité capabilities :  
`docs/regulatory-sources/connector-matrix/connector-capabilities.json`

---

## 7. Arborescence documentation (complète)

```text
docs/
├── CARTOGRAPHIE-CRM.md                          # menu + pages + liens
├── GSMS SCHOOL — WORKFLOWS OF COMPLETS.md       # ~50 WF métier
├── GSMS SCHOOL — ARCHITECTURE QUALIOPI…md       # Evidence→Qualiopi→Audit
├── GSMS SCHOOL — FUNDING CONNECTOR ARCHITECTURE V1.md
├── GSMS SCHOOL — FUNDING CONNECTORS MATRIX V1.md
├── GSMS SCHOOL — EVE.md                         # orbe / tools / dernier
├── AUDIT & ARBORESCENCE CIBLE V1.md             # ← CE FICHIER
├── regulatory-sources/                          # sources officielles
│   ├── README.md · DOWNLOADS.md
│   ├── qualiopi/          RNQ + mappings (+ PDF guide MANUAL)
│   ├── cpf-edof/          kit XML 062026 + guides CDC
│   ├── france-travail/    KAIROS ≠ abondement EDOF
│   ├── opco/{11}/         fiches ASSISTED
│   ├── agefiph/ · transitions-pro/ · regions/
│   └── connector-matrix/
│       ├── source-registry.json
│       ├── connector-capabilities.json
│       ├── document-requirements.json
│       ├── external-status-mappings.json
│       └── RESEARCH-OPCO-KAIROS-2026-08-29.md
└── (réf. UX) circuit-automatisation-*.png · vf-platform-*.png · …
```

Chaîne traçabilité :

```text
CODE règle → Connector/EvidenceRule → source_id → PDF/URL officielle
```

---

## 8. Projection UX « à quoi ressemble l’app »

### Parcours type (utilisateur école)

1. **Lead** (Communication) → Étudiant + FundingCase DRAFT  
2. **Session** planifiée (Vie scolaire) → circuits n8n J-30…J0  
3. **Suivi tableau** : émargements, docs signés, sat — chaque fait → Evidence  
4. **Financeurs** : case CPF/OPCO — checklist + « Ouvrir portail » + statut saisi  
5. **Qualiopi hub** : indicateur 12 → sessions couvertes / gaps (calculé, pas ressaisi)  
6. **Audit blanc** : échantillon sessions → findings → actions correctives (Support/Pilotage)  
7. **EVE** (plus tard) : « Eve, readiness session de demain » → tools READ + navigate  

### Ce que l’utilisateur **ne** voit pas

Event bus, connector registry, ExternalExchange, recalcul Qualiopi, idempotency keys — sauf via journal admin / audit technique.

---

## 9. Roadmap construction (ordre)

| Phase | Livrable | Front touché | API / data |
|-------|----------|--------------|------------|
| **P0** | Event model + Document states + Session readiness | Suivi tableau | Prisma + APIs suivi |
| **P0** | `FundingCase` + state machine + UI Financeurs | Financeurs | sections/…/financeurs |
| **P1** | Evidence Engine + links indicateurs | Qualiopi classeur enrichi | evidence APIs |
| **P1** | EDOF catalog XML export | Financeurs + Formations | connector edof |
| **P1** | n8n MANUAL_TASK + callback | Circuits / Financeurs | internal/n8n/funding |
| **P2** | Qualiopi coverage + audit blanc + ZIP pack | Qualiopi + feuilles | Qualiopi Engine |
| **P2** | OPCO adapters (liens portail + checklists) | Financeurs | capabilities JSON |
| **P3** | Réclamations → Finding → Corrective | Support + Pilotage | quality |
| **P∞** | EVE (Jarvis core) | Orbe AppShell | tools registry |
| **P∞** | Convergence CFA | seulement si produit apprentissage | |

---

## 10. Matrice « qui touche quel moteur »

| Page / surface | Session | Docs | Funding | Evidence | Qualiopi | Audit | n8n | EVE |
|----------------|---------|------|---------|----------|----------|-------|-----|-----|
| Sessions / Étudiants | ● | ○ | ○ | ○ | — | — | ○ | ○ |
| Suivi Tableau | ● | ● | ● | ● | ○ | ○ | ● | ○ |
| Satisfaction / Circuits | ○ | ○ | — | ● | ○ | — | ● | ○ |
| Qualiopi * | — | — | ○ | ● | ● | ● | — | ○ |
| Financeurs / Devis | — | ○ | ● | ○ | ○ | — | ● | ○ |
| Formateurs / Compagnie | ○ | ○ | — | ○ | ○ | — | — | ○ |
| Support tickets | — | — | — | ○ | ○ | ○ | ○ | ○ |
| Pilotage alertes | ○ | ○ | ○ | ○ | ○ | ○ | — | ○ |
| EVE orbe | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |

● = cœur · ○ = consomme / déclenche · — = hors scope

---

## 11. Checklist « rien qui traîne »

- [x] Menu : pas de restructuration requise  
- [x] Doctrine API financeurs documentée + recherche OPCO/KAIROS  
- [x] regulatory-sources + kit EDOF  
- [ ] Prisma Funding/Evidence/ExternalExchange  
- [ ] Financeurs UI branchée moteur  
- [ ] Qualiopi coverage (pas seulement classeur manuel)  
- [ ] Doc states + ZIP pack session  
- [ ] Guide Qualiopi PDF manuel dans repo  
- [ ] EVE après tool registry stable  
- [ ] Convergence CFA : explicitement hors V1 OF  

---

## 12. Framework DocType (NAF) — V2 Frappe-like

**Source de vérité :** `docs/GSMS SCHOOL — FRAMEWORK DOCTYPE V2.md`  
**Audits :** `docs/framework/` (ANSWERS_15, INVENTORY, PERMISSION, LMS_DRIFT, QUALIOPI_DRIFT, MIGRATION_PLAN)

- DocType = metadata + Document runtime + perms + lifecycle + workflow + API — **pas** un form lab LMS  
- framework ↛ training/lms/qualiopi · domaines s’enregistrent auprès du core  
- Freeze LMS jusqu’à réparation socle (Phase 0–11)  
- État code actuel = pont `EntityDefinition` / `/api/entities` (insuffisant vs DoD §77)

---

## 13. Une phrase

**GSMS School cible = CRM OF où chaque page métier produit des faits ; le framework DocType (V2 Frappe-like) porte le document métier ; Funding Engine + Evidence + Qualiopi observent ; n8n orchestre ; EVE assiste — le menu actuel est la bonne coque.**
