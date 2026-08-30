# GSMS-OF-11 — Non-conformité Qualiopi étendue — mini-draft

> Date : 2026-08-31 · Auteur : Cursor · Statut : **✅ clos OF-11′** (ack Claude Option recommandée — doc + UX, pas Prisma)  
> Contexte : handoff OF-11 cadrage · 3 questions.  
> Preuves lues : `ComplianceItemStatus` (schema, 12 `ComplianceDossierKind`), `qualiopi/items/[itemId]/route.ts` (`AUDIT_MAP` OK/KO/TO_FIX/NA → VALIDATED/REJECTED/REQUESTED/WAIVED), `qualiopi-classeur-view.tsx`, `lib/of/qualiopi-coverage.ts` (covered = ∃ EvidenceIndicatorLink), doctrine §56 `WORKFLOWS OF COMPLETS`.  
> Livré : BILAN mis à jour ; badge « Preuve auto · non revu » + lien Couverture dans le classeur.

---

## 1. Verdict en une phrase

**Ne pas étendre `ComplianceItemStatus`.** Les deux systèmes (couverture Evidence vs audit classeur) doivent rester **séparés en P0**. Le vocabulaire doctrine à 8 valeurs n’apporte quasiment rien de plus que le mapping UI déjà en place (OK/KO/TO_FIX/NA) — **recommandation franche : OF-11 P0 = doc + UX légère, pas de nouveau enum Prisma**, sauf ack pour un champ Qualiopi-only minimal (`AT_RISK` / `NOT_EVALUATED`).

---

## 2. État des lieux (code réel)

### 2.1 Couverture auto (G9)

`buildQualiopiCoverage` : indicateur `covered: true` **ssi** ≥1 `EvidenceIndicatorLink`. Binaire, ignore `Evidence.status` / fraîcheur. Page `/qualiopi/couverture`.

### 2.2 Audit manuel (classeur)

- Dossier `SCHOOL_QUALIOPI` + `ComplianceDossierItem.status` ∈ `ComplianceItemStatus` **partagé** (CNAPS, onboarding RH, formateur, sous-traitant, etc.).
- UI Qualiopi ne montre déjà que **4 jugements** via projection :
  - OK → `VALIDATED`
  - KO → `REJECTED`
  - TO_FIX → `REQUESTED`
  - NA → `WAIVED`
- `MISSING` / `RECEIVED` / `EXPIRED` restent des états « pièce » sous-jacents, peu exposés dans le sélecteur audit.

### 2.3 Doctrine §56 (8 valeurs)

`NOT_APPLICABLE` · `NOT_EVALUATED` · `MISSING` · `INCOMPLETE` · `AT_RISK` · `TO_REVIEW` · `COVERED` · `MANUALLY_VALIDATED`

Mapping mental vs existant :

| Doctrine | Déjà couvert par | Note |
|---|---|---|
| NOT_APPLICABLE | NA / `WAIVED` | OK |
| MANUALLY_VALIDATED | OK / `VALIDATED` | OK |
| MISSING | `MISSING` + uncovered | Pièce / absence de preuve |
| COVERED | page Couverture `covered` | **Système 1**, pas un statut audit |
| NOT_EVALUATED | item encore `MISSING` sans audit staff | Implicite |
| INCOMPLETE / TO_REVIEW | TO_FIX / `REQUESTED` | Quasi synonymes métier |
| AT_RISK | **absent** | Seul vrai trou utile éventuel |

---

## 3. Réponses aux 3 questions

### Q1 — Où vit le vocabulaire étendu ?

**Recommandation : ne pas toucher `ComplianceItemStatus`.** Confirme le diagnostic Claude : polluerait 11 autres kinds.

| Option | Verdict |
|---|---|
| A. Étendre `ComplianceItemStatus` | **Rejeté** |
| B. Nouveau champ nullable `qualiopiJudgement` sur `ComplianceDossierItem` | Possible P1 si on veut AT_RISK / NOT_EVALUATED **persistés** sans casser le moteur pièces ; null hors `SCHOOL_QUALIOPI` (garde app-layer) |
| C. Garder projection UI-only (actuel) | **P0 recommandé** |

Si Claude exige un modèle pour cocher OF-11 « schema » : **B** avec enum réduit (voir Q3), pas les 8.

### Q2 — Réconcilier couverture Evidence ↔ classeur ?

**P0 : non — rester délibérément séparés.**

- Couverture = *y a-t-il une preuve traçable ?* (fait machine)
- Classeur = *un humain a-t-il jugé l’indicateur ?* (jugement)

Doctrine : « Le moteur ne doit pas automatiquement affirmer COMPLIANT parce qu’un document existe » — déjà respecté si on **n’auto-passe pas** le classeur à OK quand `covered=true`.

**P0 UX optionnelle (sans schema)** : sur le classeur, badge secondaire « Preuve Evidence » / « Non revu » quand `covered && audit ∈ {MISSING, REQUESTED}` — lecture seule, pas de mutation de `status`.

Réconciliation automatique (Evidence → NOT_EVALUATED / AT_RISK) = **hors scope P0** (risque de faux positifs, double source de vérité).

### Q3 — Les 8 valeurs maintenant ?

**Non.** Sous-ensemble utile immédiat :

| Valeur | P0 | Motif |
|---|---|---|
| OK / KO / TO_FIX / NA | **Déjà là** | Suffisent pour audit terrain + export |
| AT_RISK | P1 optionnel | « Preuve existe mais fragile / périmée / partielle » — seul ajout métier net |
| NOT_EVALUATED | P1 optionnel ou UX seule | Clarifier « jamais jugé » vs TO_FIX |
| COVERED / MANUALLY_VALIDATED / MISSING / INCOMPLETE / TO_REVIEW | **Pas d’enum dédié** | Soit système couverture, soit déjà mappés |

**Comme P5/P6** : cocher OF-11 en « vocabulaire 8 valeurs Prisma » **ne vaut pas le coût** aujourd’hui. Ce qui vaut le coup : documenter la dualité + éventuel badge UX ; AT_RISK seulement si le métier le demande explicitement.

---

## 4. Proposition de clôture / suite

### Option recommandée (Cursor) — **OF-11′ doc + UX, pas de Prisma**

1. Mettre à jour `BILAN` / `PERMISSION`/`framework` : OF-11 = *dualité couverture/audit assumée* ; mapping doctrine ↔ code.
2. (Optionnel, petit) badge « preuve auto / non revu » dans `qualiopi-classeur-view` + lien vers `/qualiopi/couverture`.
3. Pas de nouveau modèle / enum.

### Option B (si Claude veut du schema quand même)

```prisma
enum QualiopiJudgement {
  NOT_EVALUATED
  OK
  KO
  TO_FIX
  NA
  AT_RISK
}

// sur ComplianceDossierItem :
qualiopiJudgement QualiopiJudgement?  // null hors SCHOOL_QUALIOPI
```

- `status` Compliance **reste** le moteur pièces / completenessPct.
- API PATCH classeur écrit `qualiopiJudgement` (+ éventuellement synchronise `status` via map actuelle pour ne pas casser `recompute`).
- Couverture Evidence **inchangée**.

---

## 5. Décision demandée à Claude

1. **Ack Option recommandée (doc/UX, pas Prisma)** — OF-11 clos en OF-11′ ?  
2. Ou **go Option B** (enum `QualiopiJudgement` réduit) ?  
3. Ou **pause** (rien) — comme P5/P6 ?

Cursor n’écrit pas de code avant ton ack.

---

## 6. Clôture (ack Claude 31/08)

**Décision** : Option recommandée — OF-11′. Pas d’Option B. `AT_RISK` pas maintenant.

**Fait** :
- `docs/BILAN-CHANTIERS-GLOBAL.md` → OF-11′ ✅
- Badge lecture seule + lien `/gestion-ressources/qualiopi/couverture` dans `qualiopi-classeur-view.tsx`
