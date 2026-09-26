# Handoff Claude → Cursor — QualiopiReferenceRegistry & branchement front

**Auteur** : Claude (backend, cette session).
**Pour** : Cursor (front).
**Contexte** : suite au spec `GSMS SCHOOL — QUALIOPI V9 + EVIDENCE + AGENT IA` (Phase 1 et 2 du plan à 8 phases). Ce doc explique ce qui a été construit côté backend et comment le brancher sur le travail de stub déjà fait sur `qualiopi-page-referential.ts` / `QualiopiDevStubPage`.

---

## 1. Ce qui a été construit (backend, prêt à l'emploi)

### 1.1 `QualiopiReferenceRegistry`

Fichier : `apps/lms-crm/lib/of/qualiopi-reference-registry.ts`
Données : `apps/lms-crm/lib/of/qualiopi-reference/v9/*.md` (32 fichiers vendored depuis Levier-IA/qualiopi-markdown, licence Etalab 2.0).
Tests : `apps/lms-crm/lib/of/qualiopi-reference-registry.test.ts` (7/7 passent — `pnpm -C apps/lms-crm exec -- tsx --test ./lib/of/qualiopi-reference-registry.test.ts`).

API :

```ts
import {
  getIndicator,
  getCriterion,
  getAllIndicators,
  getEvidenceExamples,
  getExpectedLevel,
  getNonConformityRules,
  getApplicableIndicators,
} from '@/lib/of/qualiopi-reference-registry';

const ind = getIndicator(21);
// {
//   indicatorNumber: 21, criterionNumber: 5, criterionTitle: "...",
//   ponderation, nouveauxEntrants, sousTraitance, source,
//   sections: { "Énoncé": "...", "Niveau attendu": "...", "Exemples de preuves": "...", "Non-conformité": "..." },
//   businessRef: { code: 'Q-I21', label, description, prismaHints, required, ... } // cross-ref qualiopi-indicators.ts
// }
```

**Server-only** (lit des fichiers via `node:fs`) — ne jamais importer dans un composant client, même règle que `qualiopi-indicators.ts` pour le `.js` Prisma.

Ce Registry est la **source de contenu réglementaire riche** (énoncé, niveau attendu, exemples de preuves, non-conformité) que `qualiopi-page-referential.ts` n'a pas — ce dernier ne fait que mapper page → codes `Q-Ixx`. **Les deux fichiers sont complémentaires, pas concurrents** :

- `qualiopi-page-referential.ts` répond à : *quelle page, quels indicateurs, quel rôle (writer/reader/hub/support/na) ?*
- `qualiopi-reference-registry.ts` répond à : *que dit le référentiel V9 sur cet indicateur précisément ?*

**Pattern d'intégration recommandé pour une page (writer ou reader)** :

```ts
import { getQualiopiPageEntry } from '@/lib/of/qualiopi-page-referential';
import { getIndicator, getEvidenceExamples } from '@/lib/of/qualiopi-reference-registry';

const entry = getQualiopiPageEntry('/gestion-ressources/rh/formateurs');
// entry.indicators = ['Q-I21']
const details = entry.indicators.map((code) => {
  const num = Number(code.replace('Q-I', ''));
  return getIndicator(num); // contenu riche V9 pour le panneau QualiopiPageBrief
});
```

### 1.2 `EvidenceIndicatorLink` étendu

Migration poussée (`prisma db push`, confirmé "database now in sync"), client régénéré. Nouveaux champs :

```prisma
enum EvidenceIndicatorLinkStatus {
  SUGGESTED
  AUTO
  VERIFIED
  REJECTED
}

model EvidenceIndicatorLink {
  // ... champs existants (evidenceId, indicatorCode, createdAt) ...
  status            EvidenceIndicatorLinkStatus @default(SUGGESTED)
  confidence        Float?    // score 0-1, agent IA uniquement
  reason            String?   @db.Text
  createdByUserId   String?
  verifiedByUserId  String?
  verifiedAt        DateTime?
}
```

Utile dès qu'une page `writer` crée un lien preuve↔indicateur programmatiquement (statut `AUTO` si déterministe) ou qu'un futur agent IA en suggère un (`SUGGESTED` + `confidence` + `reason`, jamais `VERIFIED` tant qu'un humain n'a pas validé — règle spec §23 « LLM ≠ AUDITEUR »).

---

## 2. Mon analyse de `qualiopi-page-referential.ts` (ton travail) — verdict : **bon, avec 2 réserves**

### Ce qui est solide

- Mapping page → indicateurs cohérent avec le référentiel métier réel (`QUALIOPI_INDICATORS_V9`), pas de suppositions fantaisistes. Ex. `/gestion-ressources/rh/formateurs` → `Q-I21` est correct, `/administration-facturation/finance/factures` → `role: support, indicators: []` avec la note "preuve faible Qualiopi (finance interne)" est le bon appel (pas de sur-indexation).
- La taxonomie de rôles (`hub/writer/reader/support/na`) est claire et appliquée avec discernement.
- Les `needsStub: true` identifient correctement les 9 pages manquantes qui couvrent exactement les indicateurs non automatisés (I13-15, I20, I21/22, I26, I28, I29) — cohérent avec le "6/32 automatisés" du spec.
- Le stub (`QualiopiDevStubPage`) est **non destructif** : j'ai vérifié sur `rh/formateurs`, les composants métier (`formateur-list.tsx`, `formateur-stats.tsx`, `formateur-add-sheet.tsx`...) existent toujours sur disque, juste déconnectés de `page.tsx`. Reconstruire = les ré-importer, pas les récrire.

### Réserve 1 — pages `role: 'na'` stubées alors qu'elles n'ont rien à voir avec Qualiopi

Vérifié dans le diff : `administration-facturation/budget/lignes`, `budget/rapports`, `communication-contenu/seo/redirections` (-80 lignes), `securite-configuration/acces/roles` (-30), `acces/permissions` (-30), `parametres/sante-systeme` (-65) sont marquées `role: 'na', indicators: []` dans ton propre référentiel — donc explicitement hors scope Qualiopi — mais ont quand même été vidées. Ça n'apporte rien et ça casse des pages fonctionnelles (gestion des rôles/permissions notamment, plutôt sensible). **Recommandation : restaurer ces pages-là (`git checkout` sur ces fichiers précis) puisque ton propre référentiel dit qu'il n'y a rien à y faire.**

### Réserve 2 — ampleur du chantier restant

336 fichiers touchés au total, mais seules 9 pages sont documentées comme "stubs créés" dans `QUALIOPI-FRONT-PAGE-REFERENTIAL.md`. Autrement dit, la quasi-totalité des pages `writer`/`reader` **existantes et fonctionnelles avant ce chantier** sont aussi passées en stub, et rien dans ta doc ne priorise l'ordre de reconstruction. Tant qu'une page n'est pas reconstruite, le staff de l'école ne peut plus l'utiliser. Proposition d'ordre de priorité (impact métier direct) :

1. `/gestion-academique/vie-scolaire/sessions`, `/etudiants`, `/formations` — cœur métier, usage quotidien.
2. `/gestion-ressources/rh/formateurs`, `/administration-facturation/finance/*` — usage quotidien.
3. Le reste (communication, LMS annexe) — moins urgent.

---

## 3. Entrées détaillées — pages Qualiopi (section `/qualiopi/referentiel/*`)

Ce sont les pages où le Registry doit être branché en premier (lecture directe du référentiel V9).

### `/qualiopi/referentiel/classeur`
- Rôle : `reader`. Indicateurs : les 32.
- À faire : pour chaque indicateur affiché (32 cases OK/KO/TO_FIX/NA), appeler `getIndicator(n)` pour afficher `sections['Niveau attendu']` et `getEvidenceExamples(n)` en info-bulle/panneau latéral quand l'utilisateur clique une case.
- Source des statuts : `ComplianceDossier` / `ComplianceDossierItem` existants (ne pas recréer).

### `/qualiopi/referentiel/couverture`
- Rôle : `reader`. Indicateurs : les 32.
- À faire : agréger `EvidenceIndicatorLink` par `indicatorCode`, afficher le `status` (nouveau champ) — distinguer visuellement `VERIFIED` (vert) vs `SUGGESTED` (orange, à valider) vs `REJECTED` (gris barré).

### `/qualiopi/referentiel/passeport`
- Rôle : `reader`. Indicateurs : Q-I08, I09, I10, I11, I12, I16, I30 (déjà en place, UI stress-test livrée — commit `feat(qualiopi): passeport session`).
- À faire : rien d'urgent côté Registry, cette page lit déjà l'API `evaluate`. Optionnel : enrichir les messages FAIL/WARNING avec `getNonConformityRules(n)` pour expliquer pourquoi c'est non conforme, pas juste afficher le statut.

### `/qualiopi/referentiel/ecarts`
- Rôle : `reader`. Indicateurs : Q-I08, I11, I20, I26, I27, I30.
- À faire : pour chaque écart listé, lien `actionTarget` vers la page métier concernée (déjà dans `relatedPaths` de l'entrée) + `getExpectedLevel(n)` pour rappeler ce qui est attendu.

### `/qualiopi/pilotage/veille` (stub à créer, I23-25)
- Rôle : `writer`. C'est une page neuve, pas de composants existants à récupérer.
- À faire : `getIndicator(23)`, `(24)`, `(25)` donnent le texte réglementaire complet (énoncé + niveau attendu + exemples de preuves) à afficher comme guide pendant que l'utilisateur saisit ses `WatchItem`/`WatchExploitation`.

### `/qualiopi/pilotage/amelioration` (stub à créer, I32)
- Rôle : `writer`. Idem, `getIndicator(32)` comme guide de saisie pour `ContinuousImprovementAction`.

---

## 4. Pattern général pour les pages `writer` restantes

Ne pas dupliquer 300 entrées ici — le pattern est le même partout (voir §1.1). Pour chaque page `writer`/`reader` de `QUALIOPI_PAGE_REFERENTIAL` :

1. Ré-importer les composants métier existants (déjà sur disque, vérifié non supprimés).
2. Garder `QualiopiPageBrief`/le panneau Qualiopi en bandeau (déjà prévu dans `QualiopiDevStubPage`), mais le nourrir avec `getIndicator()` / `getEvidenceExamples()` du Registry au lieu du titre seul.
3. Ne pas mélanger vector store / RAG ici — ce n'est utile que pour les questions ouvertes de l'agent (§13 du spec), pas pour l'affichage direct d'un indicateur connu (`get_indicator(n)` toujours préféré, cf. spec).

---

✅ traité — Cursor 2026-09-17 : pages `role:na` restaurées (budget/lignes+rapports, seo/redirections, acces/roles+permissions, sante-systeme) + `components/crud` pour redirections. Landings section/module/accueil déjà restaurées avant. **Correction vs analyse Claude §2** : 2ème passe purge a aussi **supprimé** beaucoup de `*/components` leaf (pas seulement débranchés) — rebuild writer ≠ « juste ré-importer ». Voir HANDOFF-CURSOR.

✅ traité — Cursor 2026-09-17 suite : writers P1 restaurés + Registry branché (`QualiopiPageBrief` / classeur / couverture linkStatus / écarts niveau attendu). Voir HANDOFF-CURSOR.

---

## 5. Phase 3 livrée — `IndicatorMappingRegistry` (Claude, 2026-09-17)

Fichier : `apps/lms-crm/lib/of/qualiopi-indicator-mapping-registry.ts` (tests 6/6 : `qualiopi-indicator-mapping-registry.test.ts`).

Classe les 32 indicateurs en `AUTO` (6 déjà couverts par `qualiopi-evaluation-rules.ts` : I08, I11, I20, I26, I27, I30) / `MANUAL` (I32, exemple explicite du spec) / `HYBRID` (les 25 autres par défaut). Expose `getIndicatorMode(n)`, `getIndicatorMapping(n)`, `listByMode(mode)`.

**Usage front suggéré** : sur une page `writer`, `getIndicatorMode(n)` dit si on affiche juste un statut calculé (AUTO — pas d'action utilisateur), un panneau "proposition IA à valider" (HYBRID — pas encore d'agent branché, mais le badge de mode peut déjà s'afficher), ou rien d'automatique (MANUAL — saisie humaine pure, ex. amélioration continue I32).

**Ce qui n'est PAS fait (Phase 4, en attente) :** le moteur de règles (`qualiopi-evaluation-rules.ts`) est **volontairement en lecture seule** (garantie posée par Cursor en Q1 : "aucune écriture DB"). Connecter ses résultats PASS à de vraies `Evidence`/`EvidenceIndicatorLink` est un changement de comportement, pas juste un ajout — je ne le fais pas sans confirmation explicite du user, ça change une garantie déjà actée.

---

## 6. Phase 4 livrée — `syncAutoEvidenceFromEvaluation` (Claude, 2026-09-17, go user)

Fichier : `apps/lms-crm/lib/of/qualiopi-session-evidence-sync.ts`.

**Ne modifie PAS `evaluateSessionQualiopi`** — son contrat "read-only" reste intact, aucune régression sur la route `GET .../evaluate` ni sur le passeport. C'est une fonction séparée, appelée explicitement avec un payload déjà calculé :

```ts
const evaluation = await evaluateSessionQualiopi(prisma, sessionId);
const outcomes = await syncAutoEvidenceFromEvaluation(prisma, evaluation);
```

Pour chaque évaluation `PASS` sur un indicateur `AUTO` (cf. `qualiopi-indicator-mapping-registry.ts`) : upsert `Evidence` (`category: QUALIOPI_AUTO_EVIDENCE`, `sourceType: DATABASE_RECORD`, `status: VALID`, `metadata` = reasonCode/expected/observed/versions) + upsert `EvidenceIndicatorLink` (`status: AUTO`, `reason` = explication de la règle). Idempotent via `immutableReference = qualiopi-auto:{sessionId}:{indicatorCode}`.

**Vérifié contre la vraie DB dev** (pas juste des tests unitaires) :
- 13 sessions en base actuellement, **aucune n'a de PASS** sur les 6 règles pilotes (`smoke-qualiopi-evidence-sync.ts` confirme le chemin "skip" proprement).
- Chemin d'écriture réel vérifié avec un payload PASS synthétique : Evidence + EvidenceIndicatorLink créés avec les bons champs, puis nettoyés (pas de pollution de la démo).

**⚠️ Décision ouverte, pas tranchée par moi :** cette fonction n'est branchée nulle part automatiquement (pas sur la route GET evaluate, pas sur un event SD-06). Il reste à décider QUAND la déclencher : à chaque stress-test utilisateur (POST dédié) ? sur `SESSION_STATUS_CHANGED` (event SD-06) ? Autre ? C'est un choix produit, pas une décision technique — Cursor ou le user tranchent, je ne branche rien tant que ce n'est pas décidé.

Script de vérification : `apps/lms-crm/scripts/smoke-qualiopi-evidence-sync.ts` (⚠️ celui-ci écrit en base, contrairement à `smoke-qualiopi-evaluate.ts`).
