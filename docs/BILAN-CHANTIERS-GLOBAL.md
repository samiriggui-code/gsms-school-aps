# Bilan de chantiers — GSMS

## ✅ Mise à jour 30 août 2026 — rattrapage workflows Qualiopi + framework IAM

Session marathon (29-30/08) centrée sur l'audit exhaustif des 50 workflows de doctrine (`docs/GSMS SCHOOL — WORKFLOWS OF COMPLETS.md`) et la fermeture du framework DocType V2/IAM. Chaque item ci-dessous a été **vérifié indépendamment** (code relu en entier, `test:doctype`/`harden`/`tsc --noEmit`/`migrate diff --exit-code` relancés), pas accepté sur parole — détail complet dans `docs/AUDIT-WORKFLOWS-50-COMPLET.md` et `docs/SUIVI-CURSOR-CLAUDE.md`.

**Nouveaux ✅ Fait (repris ci-dessous item par item) :**
- **SEC-03** (permissions CRM, pas session seule) — moteur `PermissionEngine`/`DocPermission` par action (read/write/create/delete), audit P1-P10 clos, legacy `ENTITY_REGISTRY` supprimé (G1-E).
- **NAF-00…03** (framework DocType-like) — Vague 1 (G1-A→G1-E) terminée, `@repo/doctype` seul moteur en prod, plus de double source.
- **NAF-12** (notifications J±N) — J-30/J-15/J-10 (contrôles readiness), J-5 (WF-14), J+45/J0 satisfaction (WF-27/31), tous avec cron réel.
- **GSMS-OF-04** (financeur + registre légal) — `FundingCase`/`FundingProvider` complet, checklists EDOF/OPCO/FT (WF-42/43/44), `SELF_FUNDED`/`APPRENTICESHIP` ajoutés (WF-06).
- **50 workflows de la doctrine** (WF-01 à WF-45 + 46-50) : **37✅ / 9🟡 / 4❌** (parti de 20/15/15). Détail : `docs/AUDIT-WORKFLOWS-50-COMPLET.md`.
- **Front rattrapé** : 8 workflows qui étaient API-only ont maintenant leur UI staff (fiche candidature + onglets stagiaire) — commit `5343ead`.

**Nuancé (pas ✅, vérifié partiel — ne pas survendre)** :
- **GSMS-OF-07** (BPF Cerfa) : agrégats déterministes réels (`bpf-aggregates.ts`), mais **pas d'export Cerfa PDF** — reste 🟡.
- **GSMS-OF-11** (non-conformité) : moteur Qualiopi utilise toujours le vocabulaire simple (`VALIDATED`/`REJECTED`/`REQUESTED`/`WAIVED`), pas le vocabulaire étendu de la doctrine (`TO_FIX`/`AT_RISK`/etc.) — reste **Ouvert**.

**Reste ouvert, bloqué pour de vraies raisons (pas des oublis)** : WF-35-37 (veille réglementaire — aucune source externe branchée), WF-45 (autres financeurs — AGEFIPH/Transitions Pro/Régions non vérifiés officiellement, sauf IDF Transitions Pro vérifié).

**Non touché cette session** : AI-02/03/04, NAF-04…14 (hors 00-03/11/12), OPS-*, LMS-01/02, EVE (explicitement dernière priorité, non démarré).

## ✅ Mise à jour 31 août 2026 — OF-06 clos

**GSMS-OF-06 (facture first-class)** : ✅ Fait — `FinanceInvoice` 1:N vers `FinanceDevis`, numérotation légale gapless (`FAC-YYYY-######`, séquence PG en transaction), `einvoice*`/Factur-X migrés hors devis, émission = acte staff explicite (jamais de lazy-create sur GET). Commits `05eb846`/`81deadc`. Un trou de permission trouvé sur les routes bespoke (aucune ne vérifiait `financeEdit`/`financeView`) et corrigé le jour même. Détail complet : `docs/SUIVI-CURSOR-CLAUDE.md`.

Seul P1 encore ouvert et non bloqué : **GSMS-OF-11** (non-conformité étendue).

---

**Date mise à jour :** 29 août 2026 (menu arbre + cartographie CRM + deploy purge)  
**Périmètre :** VisioFormation · GSMS · ERPNext/Frappe · exports Qualiopi/satisfaction · Frappe Learning · **Formacoop/OPAGA**  
**Principe :** plusieurs gisements d’idées, **un seul produit exécuté** — ne pas tout démarrer en parallèle.  
**Pour Claude :** lire **`docs/CARTOGRAPHIE-CRM.md`** (arbre menu + interconnexions) puis §0 bis + §4 — trajectoire corrigée (docs/circuits/BPF/financeurs > pas de module Qualiopi audit depuis OPAGA).

---

## Avancement récent (28/08)

| ID | Statut | Preuve |
|----|--------|--------|
| **GSMS-SEC-01** + **SEC-02** | **Fait** (commité + déployé) | `286f6d8` — FileAsset / storage verrouillés |
| **GSMS-OF-01** | **Fait** | `ca884e3` — pack PDF session |
| **GSMS-OF-03** | **Fait** | `cee0c09` — circuit email réel |
| **GSMS-AI-01** | **Fait** (Claude) | `f1c15b4` — AiRun / AiArtifact + client serveur |
| **Auth /signin hang** | **Fait** | `db496da` — i18n init synchrone ; prod `/signin` 200 |
| Build / landing / types | **Fait** | `3f6efe8`, `d48aab2` |
| **GSMS-OF-02** | **Fait** | `c8e7871` — pack emails OF (convocation/convention/attestation/facture) |
| **GSMS-OF-05** | **Fait** | `c8e7871` — classeur Qualiopi 32 ind. + entité `complianceDossierItem` |
| **GSMS-OF-10** | **Fait** | `c8e7871` — `SatisfactionSurvey`, lien public HMAC, cron J+45 |
| **GSMS-IAM/NAF** | **Fait (socle)** | `196b70f` — framework entities + bascule list users/roles |
| **Deploy prod** | **Fait** | 28/08 — archive `c8e7871`, `ALLOW_DB_PUSH_DATA_LOSS=1`, table `SatisfactionSurvey` OK |

**Coordination :** Claude = IAM/framework/AI · Cursor = deploy prod, menu navigation, bilan. WIP local hors périmètre : Factur-X/e-invoice (non commité).

---

## 0. Carte mentale — 4 axes (+ gisements locaux)

```
 VF (concurrent) ──inspire──▶ GSMS (lms-crm) ◀── ERPNext local (concepts GPL)
                                      ▲
                                      │ idées only
     Dolibarr sat. · Qualiopi V.9 · Frappe LMS · Formacoop/OPAGA (AGPL)
```

| Axe | Rôle | Lieu |
|-----|------|------|
| **VF** | Gisement n°1 — jamais dépendance | Essai app3 + `docs/AUDIT-VISIOFORMATION-*` |
| **GSMS** | Seul produit prod | `C:\laragon\www\gsms-school` |
| **ERPNext** | Gisement n°2 — DocTypes, 0 code repris | `C:\laragon\www\erpnext` |
| **Formacoop / OPAGA** | Gisement n°3 — admin OF (docs, BPF, financeurs) | `C:\laragon\www\formacoop-master` |
| **gsms-deploy** | Cockpit deploy (hors métier) | `C:\laragon\www\gsms-deploy` |

### Gisements locaux — idées only

| Source | Contenu | Chantier GSMS | Règle |
|--------|---------|---------------|--------|
| Export DigiRisk/Dolibarr satisfaction | Questionnaire stagiaire échelle 1–4 | **OF-10** | Contenu reconstruit en seed/template natif |
| Export audit Qualiopi V.9 (32 ind.) | OK / KO / À réparer / NA + commentaire | **OF-05**, **OF-11** | Seed `DocumentRequirementTemplate` `SCHOOL_QUALIOPI` |
| `lms-develop` = **Frappe Learning** (AGPL) | Batch, assignments, gates, certificats | **LMS-01**, KEEP-02 | **AGPL** — ne jamais copier |
| **`formacoop-master` = OPAGA / WPOF** (AGPL) | Sessions, docs multi-signataires, BPF, financeurs, tokens | **OF-01**, **OF-03**, **OF-04**, **OF-07** | **AGPL** — idées produit uniquement ; WordPress ≠ stack GSMS |

> Aucun de ces repos **ne tourne** dans GSMS. Livrable = équivalent Next/Prisma.

---

## 0 bis. Formacoop / OPAGA — trajectoire corrigée (pour Claude)

**Identité :** plugin WordPress « OPAGA » (ex-formacoop / WPOF), AGPL v3, admin légale OF — **pas de LMS**, **pas de facturation**, **pas de module audit Qualiopi 32 ind.** (juste un n° Qualiopi en option).

**Verdict vs GSMS déjà créé :**

| Domaine OPAGA | Pertinence | Compatible avec l’existant GSMS ? |
|---------------|------------|-----------------------------------|
| Documents + signatures | Élevée | **Oui** — étend OF-01 (pack PDF déjà livré) |
| Circuits inscription → convention → diffusion | Élevée | **Oui** — étend OF-03 + WorkflowEngine / n8n |
| Financeurs / taxonomie BPF | Élevée | **Oui** — OF-04 (pas encore de modèle dédié) |
| BPF Cerfa C–G + pilote | Élevée | **Oui** — OF-07 P2 (agrégats déterministes) |
| Satisfaction quiz | Moyenne | **Oui** — OF-10 template déjà amorcé ; pas de 2e système |
| Qualiopi audit 32 ind. | **Faible** | **Non à importer** — GSMS a déjà le seed V9 ; OPAGA est en retard |
| Non-conformité | Faible | **Non** — rester sur OF-11 / ERPNext concepts |
| LMS / CRM / Factur-X | Hors scope OPAGA | **Ignorer** — déjà couvert ou KEEP GSMS |

### Les 5 idées retenues (compatibles uniquement)

À implémenter **dans** la stack GSMS (Prisma, sessions, FileAsset, WorkflowEngine, pack PDF, n8n) — **jamais** en portant le PHP/WordPress.

| # | Idée OPAGA | Compatible car… | Branche sur | Priorité |
|---|------------|-----------------|-------------|----------|
| **1** | Classeur docs session multi-acteurs (à signer / demandé / fait / scan) | OF-01 pack PDF existe ; FileAsset + session déjà là | **OF-01** (enrichir) · **OF-03** | **P0/P1** — suite naturelle pack PDF |
| **2** | Pilote BPF avec garde-fous (`erreur_ctrl` : tarif/durée/heures) | Calculs déterministes = règle AI/OF déjà posée ; pas de LLM | **OF-07** | P2 — après OF-04 |
| **3** | Registre légal unique financement / nature / statut stagiaire | Une source seed Prisma → session + PDF + BPF (évite listes dupliquées) | **OF-04** · **OF-07** · NAF seed | **P1** |
| **4** | Portail tokenisé client/stagiaire (convention, sat. sans compte CRM) | Pattern proche liens publics devis / préinscription déjà en `api/public` | **OF-03** · **OF-10** | **P1** |
| **5** | Checklist « session publiable » (dates, lieu, formateur, prix, docs) | Branche sur seed Qualiopi OF-05 + docs OF-01 — UI session, pas KB générique | **OF-01** · **OF-05** · KEEP-01 | **P1** — UI binder |

**Ne pas faire à partir d’OPAGA :**
- Recréer un audit Qualiopi (déjà OF-05 seed)  
- Copier textes légaux / modèles SQL AGPL  
- Brancher WordPress / Ultimate Member / dompdf  
- Ouvrir un chantier LMS « comme OPAGA » (OPAGA n’en a pas)

**Correction de trajectoire (si Claude planifiait autrement) :**
1. Qualiopi audit = **continuer OF-05 UI** (seed V9), **pas** Formacoop  
2. Prochaine valeur OF visible = **idée 1** (états docs) + **idée 5** (checklist session) sur l’existant sessions/PDF  
3. Financeurs / BPF = idées **3** puis **2**, vague V4 / P1–P2  
4. Satisfaction = **OF-10** + idée **4** (token), pas un quiz WordPress parallel

---

## 1. Vagues d’exécution

| Vague | Focus | Pourquoi |
|-------|--------|----------|
| **V0** | Sécurité P0 | Prod dangereuse sinon |
| **V1** | Surface OF + circuits | Battre VF sur l’essai |
| **V2** | Vraie IA structurée | vs Lilya |
| **V3** | Framework DocType-like | Dette CRUD |
| **V4** | BPF / SCORM / financeurs | Parité longue |

---

## 2. Fondations déjà en place

- Framework entités (amorcé) · WorkflowEngine + n8n · ComplianceDossier · Factur-X  
- Pack PDF OF + circuit envoi réel · AiRun socle · Auth i18n OK en prod

---

## 3. Chantiers par thème

### 3.1 SEC — Sécurité

| ID | Statut | Contenu |
|----|--------|---------|
| **GSMS-SEC-01** | ✅ Fait | Storage public verrouillé |
| **GSMS-SEC-02** | ✅ Fait | IDOR files |
| **GSMS-SEC-03** | ✅ Fait (30/08) | Permissions CRM par action (`PermissionEngine`/`DocPermission`), audit P1-P10 clos, legacy supprimé (G1-E) |
| **GSMS-SEC-04** | Ouvert | OAuth vs signup off |
| **GSMS-SEC-05** | Ouvert P1 | Rate limit publics |

### 3.2 VF — Veille

| ID | Statut |
|----|--------|
| VF-01…03 | ✅ Fait |
| VF-04 | Vigilance design |
| VF-05 | Partiel (templates → OF) |
| **VF-06** | ✅ Tranché (28/08) — école sécurité/CNAPS confirmée, généricité OF repoussée à NAF |

### 3.3 OF — Surface organisme

| ID | Statut | Contenu |
|----|--------|---------|
| **GSMS-OF-01** | ✅ Fait → **enrichir** | Pack PDF + **idée OPAGA 1** (états multi-signataires / scan) |
| **GSMS-OF-02** | ✅ Fait | `c8e7871` — templates + envoi individuel participant |
| **GSMS-OF-03** | ✅ Fait → **enrichir** | Circuit envoi + **idée 4** tokens externes (signature / sat.) |
| **GSMS-OF-04** | ✅ Fait (30/08) | `FundingCase`/`FundingProvider` + checklists EDOF/OPCO/FT (WF-42/43/44) + SELF_FUNDED/APPRENTICESHIP (WF-06) |
| **GSMS-OF-05** | ✅ Fait → **enrichir** | Classeur UI + seed V9 + **idée 5** checklist session publiable (Claude) |
| **GSMS-OF-06** | ✅ Fait (31/08) | `FinanceInvoice` 1:N, numérotation gapless, einvoice migré, permissions corrigées |
| **GSMS-OF-07** | 🟡 Partiel (30/08) | Agrégats BPF déterministes réels (`bpf-aggregates.ts`) ; **pas d'export Cerfa PDF** ni pilote garde-fous idée 2 |
| **GSMS-OF-08** | ✅ Fait | Module Docs & circuits (dashboard + listes) ; Qualiopi classeur via API section |
| **GSMS-OF-09** | P2 | SCORM option |
| **GSMS-OF-10** | ✅ Fait | Survey DB + lien public + cron J+45 + trigger session |
| **GSMS-OF-11** | Ouvert P1 (vérifié 30/08) | Non-conformité — moteur Qualiopi encore sur vocabulaire simple (VALIDATED/REJECTED/REQUESTED/WAIVED), pas TO_FIX/AT_RISK. ERPNext / pas OPAGA |

### 3.4 AI

| ID | Statut |
|----|--------|
| **GSMS-AI-01** | ✅ Fait (Claude) |
| **GSMS-AI-02** | ✅ Fait | Brouillon `programModules` + UI review/apply (Claude backend + Cursor UI) |
| **GSMS-AI-03** | Ouvert P0 | Déroulé pédagogique session (après AI-02) |
| **GSMS-AI-04** | Ouvert P0 | À définir (copies emails / contenus CMS) |
| **GSMS-AI-05…07** | P1 |
| **GSMS-AI-08** | P2 (après OF-10) |
| **GSMS-AI-X** | Bloqué |

### 3.5 KEEP

Sessions · Mux · Devis/Factur-X · WorkflowEngine · RH · Leads — entretien ; brancher preuves Qualiopi (OF-05).

### 3.6 NAF — framework DocType-like

| ID | Priorité | Note |
|----|----------|------|
| NAF-00…03 | ✅ Fait (30/08) | Vague 1 DocType V2 (G1-A→G1-E) terminée, `@repo/doctype` seul moteur en prod |
| NAF-04…09 | P1 | Hooks, field ACL, child tables… |
| NAF-10 | Décision | Jamais double backend Frappe en prod |
| **NAF-11** | Partiel (30/08) | `SessionReadinessStatus`/`FundingCaseStatus`/etc. state machines réelles par domaine ; pas un moteur générique "workflow états déclaratifs" transverse |
| **NAF-12** | ✅ Fait (30/08) | J-30/J-15/J-10 (readiness) + J-5 (WF-14) + J0/J+45 satisfaction (WF-27/31), tous avec cron réel |
| **NAF-13** | P1 | Print Format générique |
| **NAF-14** | P1 | User Permission par enregistrement |

### 3.7 LMS (Frappe Learning — clone local `lms-develop`)

| ID | Priorité | Retenu |
|----|----------|--------|
| **LMS-01** | P2 | Devoirs fichier (assignments) |
| **LMS-02** | P2 | Discussions cours |
| (déjà couvert) | — | Course/chapter/lesson, quiz, batch≈session, visio, certificats OF-01 |

**AGPL :** inspiration produit uniquement.

### 3.8 OPS

OPS-02 n8n prod · OPS-03 workers AI · OPS-04 obs · OPS-05 démo 15 min.

---

## 4. Cohorte — suite immédiate (après faits 28/08)

**Pour Claude — ordre corrigé (compatible existant + OPAGA idées 1 & 5) :**

1. ~~SEC-01/02 · OF-01 pack · OF-03 envoi · AI-01 · auth · VF-06~~  
2. ~~**OF-05 UI** — classeur + **idée 5** checklist session publiable~~  
3. **OF-01 enrichi** — **idée 1** états docs multi-acteurs (NEED/REQUEST/DONE/scan) sur pack PDF déjà livré  
4. ~~**OF-10** — Survey + circuit J0/J+45~~ (+ **idée 4** token si besoin lien externe — non fait)  
5. ~~**OF-02** — pack emails~~  
6. ~~**SEC-03** / **NAF-00·01**~~ — fait 30/08 (audit IAM P1-P10 clos, Vague 1 DocType terminée)  
7. ~~**OF-04**~~ + **idée 3** registre financement — fait 30/08 (FundingCase/checklists connecteurs) ; idée 3 (registre légal unifié) pas formellement vérifiée comme module dédié  
8. **OF-07** + **idée 2** pilote garde-fous (P2) — **partiel** : agrégats faits, export Cerfa PDF + garde-fous non faits  
9. **OF-11** — après OF-05 (écart = TO_FIX) — **toujours ouvert**, vocabulaire non-conformité étendu non implémenté — source ERPNext, pas Formacoop  

**Prochaine cohorte suggérée (après ce bilan)** : OF-06 (facture first-class) ou OF-11 (non-conformité étendue) sont les deux items P1 encore réellement ouverts et non bloqués par une dépendance externe — candidats naturels si l'utilisateur veut enchaîner sur ce fichier plutôt que sur un nouveau sujet.

**Hors trajectoire :** tout chantier « Qualiopi depuis Formacoop », portage WordPress, ou second moteur docs parallèle au pack PDF.

---

## 5. Roadmap 90 j (rappel)

- **J0 continu :** SEC restants  
- **J0–J30 :** AI-02…04 · OF-02 · OF-05 UI · NAF-00/01 · NAF-12  
- **J31–J90 :** AI-05 · OF-04/07/08 · OPS-02 · OF-11

---

## 6. À ne pas faire

- Cloner 96 liens VF · big-bang NAF · LLM écrit preuve Qualiopi/BPF · Lilya 7 menus · quota décoratif · annuaire PII · second Frappe prod sans NAF-10  
- **Copier code AGPL** Frappe LMS / Formacoop-OPAGA · **GPL** ERPNext  
- Importer un « Qualiopi » Formacoop (inexistant) à la place du seed V9 GSMS  
- Brancher WordPress / Ultimate Member / dompdf en prod GSMS

---

## 7. Critères de succès (90 j)

Programme IA → session → convocation auto → classeur Qualiopi preuves présentes/manquantes → devis/Factur-X → users/roles framework · **zéro faille storage P0**.

---

## 8. Fichiers liés (nouveaux 28/08)

| Rôle | Chemin |
|------|--------|
| Seed indicateurs | `packages/database/prisma/data/qualiopi-indicators-v9.js` |
| Seed templates conformité (+ SCHOOL_QUALIOPI) | `packages/database/prisma/data/compliance-templates-seed.js` |
| Template satisfaction (data) | `packages/database/prisma/data/satisfaction-survey-templates.js` |
| App Qualiopi | `apps/lms-crm/lib/of/qualiopi-indicators.ts` |
| App satisfaction | `apps/lms-crm/lib/of/satisfaction-survey-template.ts` |
| Audit VF | `docs/AUDIT-VISIOFORMATION-FINAL.md` |
| Framework TODO | `docs/FRAMEWORK_TODO.md` |
| Ce bilan | `docs/BILAN-CHANTIERS-GLOBAL.md` |

**Exports / clones locaux (hors repo, lecture seule) :**  
`C:\laragon\www\20250222201742_audit_interne_qualiopi_*` · `...\dolibarr_sheet_question_answer_*` · `C:\laragon\www\lms-develop` · **`C:\laragon\www\formacoop-master`** (OPAGA — §0 bis)
