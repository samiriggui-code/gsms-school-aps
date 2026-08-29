# GSMS SCHOOL — PLAN D’ACTION GLOBAL

> **Auteur audit :** Cursor · **Aligné Claude :** 29 août 2026 (10/10 critères + 4 arbitrages figés)  
> **Produit :** une école · une DB `lms_app` · **pas SaaS · pas `tenant_id`**  
> **Menu CRM :** déjà correct — on enrichit, on ne restructure pas

---

## 0. Verdict

1. Coque UI mature · trou moteur : pas de `FundingCase` / `Evidence` / `ExternalExchange`.
2. Qualiopi = classeur manuel 32 ≠ Evidence Engine.
3. Vague 1 `@repo/doctype` **bloque** les moteurs domaine (ordre V2 §76).
4. Ordre : CORE → CRM → TRAINING → FUNDING → DOCUMENTS → QUALITY → EVIDENCE → QUALIOPI → AUDIT → FINANCE → LMS → EVE.
5. **Un seul propriétaire de code par surface = Cursor.** Claude = doctrine / specs / gates / draft papier (Prisma OK en draft, Cursor implémente).
6. Parallèle Vague 1 : **CH-SAFE seulement** (IA, Qualiopi histo) — lecture modèles existants.
7. FT 2 canaux · OPCO MANUAL · Convergence off · AGORA off · freeze LMS · freeze zone G1.

---

## 1. Comparaison Cursor ↔ Claude — figée

| # | Critère | Verdict |
|---|---------|---------|
| 1 | Single-school / no tenant | ✅ |
| 2 | Ordre G0→… §76 | ✅ |
| 3 | FT = 2 canaux | ✅ |
| 4 | Convergence hors continue V1 | ✅ |
| 5 | Vague 1 = flag + delete tardif | ✅ |
| 6 | Classeur ≠ Evidence | ✅ |
| 7 | Menu inchangé | ✅ |
| 9 | Qui lead quoi | ✅ **Cursor = tout le code** · Claude = doctrine/specs/gates (+ draft schéma) |
| 10 | Cœur UI = Suivi tableau | ✅ |

### Arbitrages motivés (figés 29/08)

| Sujet | Décision | Détail |
|-------|----------|--------|
| **G2 ∥ G1** | **Oui scaffolds seulement** | IA brouillons/historique · Qualiopi historique. **Non** pour session readiness / doc states / events **avant SD-06 verrouillé**. |
| **Funding Prisma** | **Draft Claude pendant G1 · code Cursor après G1-E** | Seuil = delete legacy fait + socle scellé. **Option B rejetée.** Aucun FundingCase en schema avant G1-E. |
| **BPF** | **G11 Finance (ex-G8 plan), pas G5** | Agrège FundingCase — impossible avant vraies données funding. |
| **Customization** | **Glissable** | Pas bloquant Vague 1/2 début. |

**Décision A confirmée (29/08 soir) :** zéro FundingCase en schema tant que **G1-E** n’est pas passé. Cursor = Vague 1 + CH-SAFE en parallèle.

---

## 2. Règle gelée moteurs

```text
AUCUN FundingCase / Evidence / ExternalExchange / IndicatorCoverage
en schema.prisma + API + UI CRUD

AVANT :
  1. G1-D vert (flag permanent + smoke)  ← seuil code Funding*
  2. Enregistrement DocType sur @repo/doctype (Vague 2, ordre §76)
  3. domains/*/register() — jamais core ← domaine

G1-E (delete legacy) = nettoyage, pas gate Funding.

SD-06 (event catalog) VERROUILLÉ avant tout code
session readiness / doc states / outbox « moteur ».
```

Specs papier + draft schéma Claude = **OK pendant G1**.  
Merge Prisma Funding* = **Cursor, post G1-D**, en DocTypes (pas bricolage hors registry).

---

## 3. Cartographie (résumé)

| Couche | État |
|--------|------|
| Front ~104 pages | Mature · scaffolds Financeurs/BPF/IA×2/Qualiopi histo |
| API ~254 | Pas financeurs/bpf/evidence |
| Prisma ~100 | Pas Funding*/Evidence* |
| `@repo/doctype` | À créer — Vague 1 Cursor |
| Connecteurs | EDOF XML · OPCO MANUAL · FT portail≠API |

---

## 4. Phases

```text
═══════════════ VAGUE 1 ═══════════════════════════════
G0   Governance / SD-*
G1   @repo/doctype · flag A→E

     // ∥ SÛR (zéro modèle neuf) — Cursor code :
     CH-SAFE-1  IA brouillons / historique
     CH-SAFE-2  Qualiopi historique

     // ∥ PAPIER — Claude :
     SD-* · draft schéma Funding/Evidence · SD-06 events
     connecteurs / francetravail.io

     // BLOQUÉ jusqu’à SD-06 :
     session readiness · doc states · events runtime

═══════════════ VAGUE 2 (après G1-D pour code domaine) ═
G3   CRM OF
G4   Training
G5   Funding          ← Financeurs UI · post G1-D + ordre §76
G6   Documents
G7   Quality
G8   Evidence
G9   Qualiopi coverage
G10  Audit
G11  Finance / BPF    ← pas avant FundingCase réel
G12  LMS
G13  EVE
     (+ Customization glissable)
```

| Phase | Démarre |
|-------|---------|
| G1 + CH-SAFE | **Maintenant** — Cursor |
| Draft Funding/Evidence + SD-06 | **Maintenant** — Claude papier |
| Code Funding* Prisma/API | **Après G1-D** — Cursor |
| Session readiness / events code | **Après SD-06 lock** (+ plutôt Vague 2 Training/Documents) |
| BPF | **G11** après G5 |

---

## 5. Rôles (point 9 — figé)

| Cursor (seul codeur surfaces) | Claude |
|-------------------------------|--------|
| `packages/doctype/**` | Charte, audits, gates G1-C / G1-D / G1-E |
| `apps/lms-crm` pages, API, Prisma **impl** | SD-01…13 · matrix connecteurs |
| Engines, tests CI, flag cutover | Draft schéma Funding/Evidence (Cursor merge) |
| CH-SAFE UI | SD-06 event catalog **avant** code events |
| Domaines `register()` Vague 2 | Review PR architecture · go/no-go |

**Interdit :** Claude et Cursor éditent la même surface code en parallèle (freeze zone G1 + toute surface Prisma/API métier).

---

## 6. Chantiers

| ID | Quoi | Quand | Lead code | Lead spec |
|----|------|-------|-----------|-----------|
| C1–C4 | Vague 1 DocType | NOW | Cursor | Claude gate |
| C7 / C7b | IA + Qualiopi histo | NOW ∥ | Cursor | — |
| C8 | Draft Funding/Evidence | NOW papier | — | Claude |
| C5/C6 | Readiness / events runtime | Après **SD-06** | Cursor | Claude SD-06 |
| C9–C11 | Funding DocType + EDOF + FT | Post **G1-D** + G3–G4 | Cursor | Claude |
| C12–C13 | Evidence → Qualiopi coverage | Ordre §76 | Cursor | Claude |
| C14 | BPF | G11 | Cursor | Claude |
| C15–C18 | CRM · Training · LMS · EVE | Vague 2 fin | Cursor | Claude |

---

## 7. Vague 1 ops (Cursor)

```text
G1-A  package + /api/resource|/meta
G1-B  shim entities + flag
G1-C  protectRoute ← PermissionEngine (flag)
G1-D  flag permanent + smoke  ← GATE Funding code
G1-E  delete lib/framework + entity Qualiopi file
```

Freeze zone : `lib/framework/**`, `entity-registry`, `protect-route`, `api/entities/**`, listEntity users/roles, `qualiopi-compliance-item-entity.ts`.

→ [`REFONTE_DOCTYPE_V2_WAVE1_PLAN.md`](./framework/REFONTE_DOCTYPE_V2_WAVE1_PLAN.md)

---

## 8. Freeze

| Règle | Jusqu’à |
|-------|---------|
| Pas merge Prisma Funding*/Evidence* | **G1-E** (+ DocType register Vague 2) |
| Pas code events/readiness « moteur » | **SD-06 verrouillé** |
| Pas BPF réel | FundingCase produit des faits (G5→G11) |
| Pas tenant_id / nouvelle section menu / API inventée | Permanent |
| Freeze zone G1 | G1-E |
| Un seul codeur / surface | Permanent collab |

---

## 9. Actions immédiates

| # | Action | Qui | Statut |
|---|--------|-----|--------|
| 1 | Arbitrages A + 4 écarts | — | ✅ **FIGÉ** |
| 2 | Vague 1 G1-A… | **Cursor** | **NEXT** |
| 3 | CH-SAFE IA / Qualiopi histo (hors freeze) | Cursor | ∥ optionnel |
| 4 | SD-06 event catalog + draft Funding/Evidence | **Claude** | ∥ papier |
| 5 | francetravail.io + Qualiopi PDF | Claude / toi | ∥ |
| 6 | Code Funding Prisma | Cursor | **Après G1-E** |

---

## 10. North star

**Socle DocType d’abord. Un codeur = Cursor. Claude verrouille les contrats. Domaines OF en DocTypes après G1-D, ordre §76. Pas de second drift Qualiopi. EVE dernier.**

---

*Alignement Cursor↔Claude verrouillé 29/08/2026.*
