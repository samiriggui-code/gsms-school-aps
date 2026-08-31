# Cartographie CRM GSMS — sections · modules · pages · interconnexions

> **Pour Claude / Cursor** — source de vérité navigation + périmètre métier.  
> Menu code : `apps/lms-crm/config/menu.config.tsx`  
> Layouts : `.cursor/rules/gestion-ressources-layout.mdc` (3 niveaux)  
> API : `apps/lms-crm/app/api/sections/{section}/...` (miroir URL UI)  
> Accueil cartes : `app/(protected)/accueil/components/menu-cards-section.tsx`  
> **Date :** 29 août 2026 · **Statuts Qualiopi/Financeurs/BPF/Factures/IA revérifiés et corrigés le 31 août 2026** (voir notes "vérifié 31/08" inline)

---

## 0. Règles de lecture

| Niveau | URL typique | UI | Rôle |
|--------|-------------|-----|------|
| **Section** | `/gestion-ressources` | Stats + welcome + **cartes Accéder → modules** | Entrée domaine |
| **Module (hub)** | `/gestion-ressources/compagnie` | **3 rangées** 1/3+2/3 : stats+welcome → alertes+table → charts/panels | Pilotage du domaine |
| **Feuille** | `/…/rh/collaborateurs` | Toolbar + **KPI row** + DataGrid/fiche | Travail opérationnel |

**Interdit :** inventer un hub « Accéder-only » sans data. Scaffolds Type A (`LeafScaffoldPage`) OK pour figer l’arbre.

**Statuts page :** `OK` = métier branché · `HUB` = dashboard module · `SCAFFOLD` = KPI + liste vide (chantier) · `REDIRECT` = legacy.

---

## 1. Flux métier global (qui parle à qui)

```
Landing / Marketing leads
        │
        ▼
Communication (leads, CMS) ──► Académique Vie scolaire (étudiants, formations, sessions)
        │                              │
        │                              ├─► Suivi formations (tableau, émargement, satisfaction, circuits n8n)
        │                              │
        ▼                              ▼
Admin Finance (devis ← leads) ──► Factures / Paiements / Financeurs / BPF
        │
Ressources (Compagnie, RH, Formateurs, Salles, Matériel, Qualiopi)
        │
        ├─► Sécurité (users/roles, GED, conformité docs)
        ├─► Pilotage (alertes, KPI transverses) + IA (brouillons AiArtifact)
        └─► Support (tickets / incidents)
```

**Prisma / packages :** un seul schema `packages/database` · stats lourdes `@repo/api-core` · fichiers `@repo/storage` · jobs `packages/workers` · n8n via `app/api/internal/n8n/`.

---

## 2. Accueil

| Path | Statut | Affiche | Liens |
|------|--------|---------|-------|
| `/accueil` | OK | Dashboard CRM + **7 cartes sections** (puces = modules cliquables) | → chaque section / hub module |

---

## 3. Pilotage supervision

**Section** `/pilotage-supervision` — cartes : Pilotage · IA.

### Module Pilotage — `/pilotage-supervision/pilotage` · HUB

| Page | Path | Statut | Doit traiter / afficher | Relations |
|------|------|--------|-------------------------|-----------|
| Hub | `…/pilotage` | HUB | Synthèse multi-modules | Lit notifications / stats agrégées |
| Alertes | `…/alertes` | OK | Registre alertes (= cloche header) | Tous modules via `moduleKey` |
| Indicateurs | `…/indicateurs` | OK | KPI consolidés par section | APIs stats sections |
| Rapports | `…/rapports` | OK | Exports CSV/PDF, historique | Workers exports |
| Risques | `…/risques` | OK | Registre risques opérationnels | Support incidents, conformité |

### Module IA — `/pilotage-supervision/ia` · HUB

| Page | Path | Statut | Doit traiter / afficher | Relations |
|------|------|--------|-------------------------|-----------|
| Hub | `…/ia` | HUB | Stats AiArtifact/AiRun, aperçu artefacts | Prisma `AiRun`, `AiArtifact` |
| Brouillons | `…/brouillons` | SCAFFOLD | File PROPOSED → Approuver / Rejeter / Appliquer | **Écrit** formations / sessions après apply |
| Historique | `…/historique` | SCAFFOLD | Journal AiRun (provider, statut, erreurs sans secrets) | Même modèles |

**API :** `sections/pilotage-supervision/ia/stats`, `…/artifacts`.

---

## 4. Gestion ressources

**Section** `/gestion-ressources` — cartes : Compagnie · Qualiopi · RH · Équipements.

### Compagnie — HUB

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Hub | `…/compagnie` | HUB | Stats OF, conformité, overview | Branding docs / PDF |
| Profil | `…/profil` | OK | Identité légale, SIRET, contacts | Landing, factures, BPF |
| Structure | `…/structure` | OK | Organigramme / entités | RH équipes |
| Documents | `…/documents` | OK | Docs admin société | GED FileAsset |

### Qualiopi — HUB *(ex Support — ne plus créer sous support-qualite)*

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Hub | `…/qualiopi` | HUB | Complétude 32 ind., alertes, overview | `ComplianceItem` SCHOOL_QUALIOPI |
| Classeur | `…/classeur` | OK | 32 indicateurs : statut, commentaire, preuve | Storage preuves |
| Historique | `…/historique` | OK (vérifié 31/08) | Timeline écarts (`ComplianceItemEvent`) — DataGrid réel, pas un scaffold | OF-11′ |

**API :** `sections/gestion-ressources/qualiopi` · redirects legacy `support-qualite/qualiopi` → ici.

### RH — HUB

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Hub | `…/rh` | HUB | Effectifs, alertes conformité collab. | — |
| Collaborateurs | `…/collaborateurs` | OK | Staff CRM + dossiers | Users IAM, conformité |
| Équipes | `…/equipes` | OK | Affectations | Structure compagnie |
| Formateurs | `…/formateurs` | OK | Externes / missions | Sessions, planning |
| Absences | `…/absences` | OK | Congés / absences | Planning |

### Équipements — HUB

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Hub | `…/equipements` | HUB | Parc, maintenance | — |
| Inventaire | `…/inventaire` | OK | Catalogue matériel | Affectations |
| Affectations | `…/affectations` | OK | Résa session / formateur | Sessions académiques |
| Maintenance | `…/maintenance` | OK | Atelier | Support incidents matériel |
| Salles | `…/salles` | OK | Locaux formation | Planning sessions |

---

## 5. Gestion académique

**Section** `/gestion-academique` — cartes : Vie scolaire · Suivi formations.

### Vie scolaire — HUB

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Hub | `…/vie-scolaire` | HUB | Alertes pédagogiques + overview | — |
| Formations | `…/formations` | OK | Catalogue programmes | CMS catalogue vitrine, devis, IA brouillons |
| Sessions | `…/sessions` | OK | Sessions planifiées, inscriptions | Suivi tableau, finance, n8n circuits |
| Planning | `…/planning` | OK | Calendrier lun–sam | Formateurs, salles |
| Étudiants | `…/etudiants` | OK | Dossiers apprenants / pipeline | Leads marketing, devis, suivi |
| *(hors menu sidebar mais existants)* Examens, Certifications, Contenu e-formation | `…/examens` etc. | OK / partiel | Résultats, attestations, LMS content | Ouverts depuis **Suivi → Tableau** onglets |

`/vie-scolaire/suivi-formations` → **REDIRECT** vers `/suivi-formations/tableau`.

### Suivi formations — HUB *(ex docs-circuits Support)*

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Hub | `…/suivi-formations` | HUB | Stats enquêtes + circuits, tables aperçu | n8n, SatisfactionSurvey |
| Tableau | `…/tableau` | OK | Par session : stagiaires, journal jours, émargement, docs, e-learning, examens, certifications, funding | **Cœur opérationnel OF** ; APIs encore sous `vie-scolaire/suivi-formations/…` |
| Satisfaction | `…/satisfaction` | OK | HOT J0 / COLD J+45 | Sessions, emails |
| Circuits | `…/circuits` | OK | Runs n8n J-N → J+N | `api/internal/n8n/automation/*` |

**API UI sat/circuits/stats :** `sections/gestion-academique/suivi-formations/…`  
**API tableau (legacy path OK) :** `sections/gestion-academique/vie-scolaire/suivi-formations/…`

---

## 6. Admin facturation

**Section** `/administration-facturation` — cartes = **feuilles Finance** (1 module Finance).

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Module Finance | `…/finance` | HUB / landing | Accès rapide pages | — |
| Budget | `…/budget` | OK | Lignes budgétaires | — |
| Devis | `…/devis` | OK | Pipeline `FinanceDevis`, plaquettes | Leads, étudiants, sessions |
| Factures | `…/factures` | OK (vérifié 31/08) | `FinanceInvoice` 1:N dédiée (OF-06) — numérotation légale gapless, émission = acte staff explicite, plus le devis ACCEPTED réutilisé | Devis, Paiements, Factur-X migré |
| Paiements | `…/paiements` | OK | Encaissements | Factures |
| Financeurs | `…/financeurs` | OK (vérifié 31/08) | Registre `FundingCase` réel + checklists EDOF/OPCO/FT + agent IA — **OF-04** clos | Sessions, BPF |
| BPF | `…/bpf` | 🟡 Partiel (vérifié 31/08) | Agrégats déterministes réels (`bpf-aggregates.ts`) branchés ; **pas d'export Cerfa PDF** ni pilote garde-fous — **OF-07** | Financeurs, sessions |
| Rapports | `…/rapports` | OK | Synthèses finance | Stats |

---

## 7. Communication contenu

**Section** `/communication-contenu` — CMS · Marketing · SEO.

| Module / page | Path | Statut | Affiche / rôle | Relations |
|---------------|------|--------|----------------|-----------|
| CMS hub | `…/cms` | HUB | — | — |
| Pages landing | `…/pages-landing` | OK | Ordre / publication one-page | Site public |
| Équipe landing | `…/equipe-landing` | OK | #trainers | RH / mon-profil |
| Catalogue vitrine | `…/contenus` | OK | #pricing sync | Formations académiques |
| Formulaires leads | `…/formulaires-leads` | OK | Pipeline acquisition | → Étudiants / devis |
| Campagnes | `…/campagnes` | OK | UTM / canaux (pas d’envoi mail) | Leads |
| Meta / Redirections | `…/seo/…` | OK | SEO technique | Landing |

---

## 8. Support *(helpdesk only)*

**Section** `/support-qualite` — **1 module** Support. Qualiopi / docs-circuits **déplacés** (redirects `next.config.mjs`).

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Hub | `…/support` | HUB | Tickets + incidents overview | — |
| Tickets | `…/tickets` | OK | Helpdesk | Users, alertes Pilotage |
| Incidents | `…/incidents` | OK | Matériel / process | Équipements, risques |

---

## 9. Sécurité configuration

**Section** `/securite-configuration` — Accès · Paramètres · Gouvernance.

| Page | Path | Statut | Affiche / rôle | Relations |
|------|------|--------|----------------|-----------|
| Users / Roles / Permissions / Logs | `…/acces/…` | OK | IAM CRM | Toutes sections via `permissionSlug` |
| Settings | `…/parametres/settings` | OK | Réglages école, layouts modules | Accueil cards visibility |
| Santé système | `…/sante-systeme` | OK | Postgres / Redis / Node | Ops |
| Conformité | `…/conformite` | OK | Docs manquants tous profils | RH, étudiants, Qualiopi preuves |
| Storage / Demandes / Corbeille / Audit | `…/gouvernance-donnees/…` | OK | GED FileAsset | Upload partout |

---

## 10. Matrice d’interconnexions (où développer quoi)

| Besoin | Où coder UI | Où coder API | Modèles / packages clés |
|--------|-------------|--------------|-------------------------|
| Catalogue formation | Académique → Formations | `gestion-academique/vie-scolaire/formations` | Formation* |
| Session + inscrits | Sessions + Suivi tableau | `…/sessions` + `…/suivi-formations/*` | FormationSession* |
| Émargement / PDF jour | Suivi → Tableau | `vie-scolaire/suivi-formations/.../emargement` | FormationSessionDay, Emargement |
| Satisfaction HOT/COLD | Suivi → Satisfaction | `suivi-formations/satisfaction` | SatisfactionSurvey |
| Circuit n8n session | Suivi → Circuits | `suivi-formations/circuits` + `api/internal/n8n` | automation runs |
| Qualiopi 32 ind. | Ressources → Qualiopi | `gestion-ressources/qualiopi` | Compliance* |
| Devis → facture | Finance | `administration-facturation/finance/*` | FinanceDevis |
| Financeurs / BPF | Finance (scaffold) | à créer sous `…/finance/` | **à ajouter Prisma** OF-04/07 |
| Brouillon IA programme | Pilotage → IA | `pilotage-supervision/ia` | AiRun, AiArtifact |
| Lead landing | Communication → Leads | marketing + public quote APIs | Lead / QuoteRequest |
| Tickets | Support | `support-qualite/support` | Ticket / Incident |
| Permissions menu | Sécurité → Accès | `securite-configuration/acces` | Role, Permission |

---

## 11. Redirects / chemins morts à ne pas réintroduire

| Ancien | Nouveau |
|--------|---------|
| `/support-qualite/qualiopi` | `/gestion-ressources/qualiopi` |
| `/support-qualite/docs-circuits` | `/gestion-academique/suivi-formations` |
| `/qualite-organisme/*` | mêmes cibles |
| `/gestion-academique/vie-scolaire/suivi-formations` | `/…/suivi-formations/tableau` |

**Deploy VPS :** `tar` seul ne purge pas les fichiers supprimés → utiliser `vps-rebuild-complete.sh` (purge `apps/` + extract).

---

## 12. Chantiers scaffolds prioritaires (collab Claude)

**Tous vérifiés construits au 31/08** (cette liste datait du 29/08, plus à jour) :

1. ~~**IA brouillons**~~ — ✅ DataGrid AiArtifact PROPOSED + apply métier (190 lignes, réel)
2. ~~**IA historique**~~ — ✅ DataGrid AiRun (167 lignes, réel)
3. ~~**Qualiopi historique**~~ — ✅ timeline ComplianceItemEvent (OF-11′)
4. ~~**Financeurs**~~ — ✅ `FundingCase` réel + checklists (OF-04)
5. **BPF** — 🟡 agrégats déterministes réels, export Cerfa PDF encore manquant (OF-07 partiel)

Reste ouvert et non couvert par cette liste, trouvé lors du croisement doc du 31/08 : `docs/framework/QUALIOPI_DRIFT.md` Q3/Q4 (double chemin d'écriture `complianceDossierItem` — route bespoke `qualiopi/items/[itemId]` en Prisma brut, à côté du DocType enregistré, avec la logique de recalcul de complétude hors du moteur Evidence/DocType) — architecture dette réelle, pas un simple scaffold vide.

Ne pas : recréer Qualiopi sous Support · hub Accéder vide · second schema Prisma · copier code AGPL Formacoop/Frappe.

---

## 13. Fichiers d’ancrage rapides

| Sujet | Fichier |
|-------|---------|
| Sources réglementaires / connecteurs | `docs/regulatory-sources/README.md` · matrice funding `docs/GSMS SCHOOL — FUNDING CONNECTORS MATRIX V1.md` |
| **Audit & arborescence cible** | `docs/GSMS SCHOOL — AUDIT ARBORESCENCE CIBLE V1.md` |
| **Plan d’action global** | `docs/PLAN-ACTION-GLOBAL-GSMS.md` — chantiers Cursor↔Claude · phases G0–G12 |
| **Framework DocType V2** | `docs/GSMS SCHOOL — FRAMEWORK DOCTYPE V2.md` · audits `docs/framework/` |
| Menu | `apps/lms-crm/config/menu.config.tsx` |
| Permissions path | `apps/lms-crm/config/menu-crm-access.ts` |
| Labels i18n path | `apps/lms-crm/i18n/menu-by-path.ts` |
| Descriptions toolbar | `apps/lms-crm/i18n/page-descriptions.ts` |
| Accueil cards | `…/accueil/components/menu-cards-section.tsx` |
| Layout rule | `.cursor/rules/gestion-ressources-layout.mdc` |
| Workflow monorepo | `.cursor/rules/monorepo-feature-workflow.mdc` |
| Bilan chantiers | `docs/BILAN-CHANTIERS-GLOBAL.md` |
