# Suivi projet — Cursor (exécution) / Claude (vérification)

Mis à jour en continu par Claude. Chaque entrée : ce que Cursor a livré, ce que Claude a vérifié réellement (commande exécutée, pas juste lu), et ce qui a été corrigé.

---

## État d'avancement — Vague 1 DocType V2

| Étape | Statut | Vérifié par Claude |
|---|---|---|
| G1-A (package @repo/doctype, API meta/resource) | ✅ Fait | Oui — code lu, tests lancés |
| CH-SAFE (IA brouillons/historique, Qualiopi historique) | ✅ Fait | Oui |
| G1-B/C (Document runtime, shim /api/entities, protectRoute dual) | ✅ Fait | Oui |
| G1-D (flag DOCTYPE_V2_RUNTIME default ON + smoke) | ✅ Fait | Oui — 6/6 tests, smoke réel (55 users Postgres), build vert |
| G1-E (suppression moteur legacy) | ✅ Fait par Cursor | Partiel — voir note build ci-dessous |
| Draft FundingCase Prisma (schéma) | ✅ Fait par Cursor, committé (`b9d35b5`) | ✅ Relu, approuvé, commit vérifié |
| Build post-G1-E (cross-check) | ✅ Vert des deux côtés (13,6 min, 340 pages, 0 erreur) | ✅ Confirmé — silences précédents = contention locale Claude, pas une régression |
| G3 CRM OF (DocTypes Lead, FinanceDevis) | ✅ Démarré par Cursor | ✅ Vérifié — 0 nouveau modèle Prisma (réutilise l'existant), tests 6/6 re-confirmés |
| G3 CRM OF (Candidature=Learner, draft manquants) | ✅ Fait par Cursor | ✅ Vérifié — modèle Candidature confirmé, draft relu et approuvé |
| G4 Training DocTypes (Formation, Session, etc.) | ✅ Fait par Cursor | ✅ Vérifié — 0 nouveau modèle, tous les modèles Formation* confirmés existants |
| Company/Contact/TrainingRequest Prisma | ✅ Committé par Cursor (`ef2214f`) | ⚠️ **db:push annoncé "OK" par Cursor était faux** — voir correctif ci-dessous |

---

## 2026-08-29

### Ce que Cursor a livré ce soir (par ordre)
1. Déplacement menu suivi-formations / Qualiopi (`gestion-academique`, `gestion-ressources`).
2. Doctrine + plans figés dans `docs/`.
3. G1-A : package `@repo/doctype`.
4. CH-SAFE : IA brouillons/historique, Qualiopi historique.
5. G1-B/C : runtime Document + shim + protectRoute dual (flag OFF par défaut).
6. G1-D : flag flip ON par défaut + script smoke.
7. Permissions Auto-run : `.cursor/permissions.json` + `.claude/settings.local.json` (allowlist raisonnable, pas YOLO — confirmé, pas de contenu dangereux).
8. G1-E : suppression `lib/framework/*`, `lib/auth/entity-registry.ts`, `lib/of/qualiopi-compliance-item-entity.ts`, `lib/doctype/runtime-flag.ts` — commit `f529f85`.

### Ce que Claude a trouvé et fait corriger
- **Bug `pnpm smoke:doctype`** : commande cassée (`node --experimental-strip-types` ne résout pas les imports sans extension de `@repo/database`, `tsx` absent des devDeps `@lms-crm`). Signalé via `docs/HANDOFF-CLAUDE.md`. **Corrigé par Cursor** — `tsx` ajouté, commande changée, smoke vérifié réel (55 users).
- **Fix `PersistenceOrderBy` circulaire** : trouvé par Cursor lui-même lors d'un rebuild, corrigé avant que Claude n'ait à le signaler. Vérifié par Claude : build complet sans erreur (543 lignes de log, manifeste de routes complet).

### Vérifications indépendantes de Claude (pas juste lecture des rapports Cursor)
- `pnpm -C packages/doctype test` : 6/6 réel, deux fois (avant et après G1-E).
- `pnpm smoke:doctype` : exécuté réellement contre Postgres local, 55 users lus.
- `pnpm --filter @lms-crm build` : exécuté réellement (pas juste lu le rapport Cursor) — vert une fois après G1-D. Après G1-E : relance en cours, résultat pas encore confirmé (build plus lent que d'habitude, possible contention avec les process Cursor actifs).
- Suppression des fichiers legacy G1-E : confirmée sur disque, aucun import mort résiduel trouvé (`grep` sur tout `apps/lms-crm`).
- `.cursor/permissions.json` / `.claude/settings.local.json` : contenu lu et jugé sain (deny-list sur rm -rf, force-push, reset --hard, sudo, DROP SQL).

### Système de relais mis en place
- `docs/HANDOFF-CLAUDE.md` (Claude → Cursor) + `docs/HANDOFF-CURSOR.md` (Cursor → Claude) + règle `.cursor/rules/handoff-claude.mdc`.
- Claude surveille `HANDOFF-CURSOR.md` en direct (poll 5s) pendant la session.
- Confirmé par Cursor (recherche produit sourcée) : aucun mécanisme natif pour réveiller son agent local IDE après inactivité — seulement des Cloud Automations qui lancent un agent séparé, pas une injection dans le chat en cours.

### Point ouvert — build post-G1-E non confirmé
Après G1-E, `pnpm --filter @lms-crm build` a été relancé 2 fois côté Claude : les deux fois, sortie qui s'arrête juste après le prebuild (`[prebuild] .next supprimé`), sans sortie `next build` ni code de sortie observé, alors que le même build était vert (543 lignes, 0 erreur) juste après G1-D. Investigation faite :
- Pas d'import mort vers les fichiers supprimés (`grep` sur tout `apps/lms-crm`) — écarté.
- `apps/lms-crm/instrumentation.ts` + `lib/doctype/bootstrap.ts` relus : logique synchrone, pas d'appel réseau/boucle infinie visible — écarté comme cause évidente.
- 4-5 process `node.exe` de Cursor (TS server, pyright, typings installer) actifs en continu sur la machine, dont un avec `--max-old-space-size=8053` (8 Go) — hypothèse retenue : contention mémoire/CPU locale plutôt que régression réelle de G1-E.
- Cross-check demandé à Cursor via `HANDOFF-CLAUDE.md` : lancer le même build de leur côté et rapporter le résultat.

**Conséquence** : Claude ne donne pas encore l'accusé "gate ouvert" pour `FundingCase` tant que le build n'est pas confirmé vert (soit par un retry propre côté Claude, soit par confirmation croisée Cursor).

### Bug réel trouvé et corrigé par Claude — `db:push` silencieusement inopérant
Cursor a annoncé `db:push` OK pour Company/Contact/TrainingRequest (commit `ef2214f`). Claude a vérifié en base réelle (`\dt` psql) : **les 3 tables n'existaient pas.** Reproduit 2x soi-même (`db:push` puis `--accept-data-loss`, exit 0 les deux fois, toujours rien en base). `prisma validate` = OK (pas un problème de schéma). Cause isolée via `prisma migrate diff --script` : le CLI Prisma sort en exit 0 sans appliquer sur cet environnement Windows/git-bash (sortie/confirmation interactive probablement perdue). **Corrigé** : script SQL du diff appliqué directement via `psql -v ON_ERROR_STOP=1` ; re-vérifié : 3 tables présentes, diff `--exit-code` maintenant vide (DB et schéma synchronisés). Consigne donnée à Cursor pour la suite : toujours vérifier avec `migrate diff --exit-code` après un `db:push`, ne pas se fier au seul exit code.

| G6 Documents (FileAsset, DocumentRequirementTemplate, DocumentRequest) | ✅ Fait par Cursor (`975501e`) | ✅ Vérifié — 0 nouveau modèle, tests 6/6 |
| G7 Quality (ComplianceDossier, SatisfactionSurvey, QualityIncident) | ✅ Fait par Cursor (`a324995`) | ✅ Vérifié — 0 nouveau modèle, tests 6/6. Registry 25 DocTypes, arrêt correct avant G8 Evidence (gate respecté) |
| G5 Financeurs UI/API (page + sync FundingProvider) | ✅ Fait par Cursor (`b1198c9`) | ⚠️ **Bug réel trouvé et corrigé** — voir ci-dessous |

### Bug réel #2 trouvé et corrigé par Claude — mapping transport Financeurs faux
G5 (page + sync `FundingProvider` depuis `connector-capabilities.json`). Claude a testé le sync en réel (`tsx scripts/sync-funding-providers.ts` + vérif `\dt`/`SELECT` psql) plutôt que de se fier au rapport Cursor. Résultat : `FRANCE_TRAVAIL_API_KAIROS` et `OPCO_API_CONVERGENCE_APPRENTISSAGE` (vrais connecteurs REST_JSON vérifiés dans `docs/regulatory-sources/`) ressortaient classés `MANUAL_PORTAL` en base — **faux**, ça effaçait toute la distinction API/portail construite dans la recherche connecteurs de ce soir. Cause : `mapTransport()` dans `sync-providers-from-matrix.ts` cherchait la sous-chaîne `"API"` dans la valeur `"REST_JSON"`, qui ne matche jamais. **Corrigé** : reconnaissance explicite `REST_JSON`/`SOAP_XML`/`WEBHOOK` + lecture du champ `verification_level` (absent avant) pour distinguer `PARTIAL_API` (FRANCE_TRAVAIL_API_KAIROS, verification_level="PARTIAL") de `VERIFIED_API` (OPCO_API_CONVERGENCE_APPRENTISSAGE). Même bug dupliqué corrigé dans la route API. Re-testé en base : valeurs correctes. Typecheck clean. **Committé par Cursor** — `619ed47 fix(funding): map REST_JSON connectors to PARTIAL/VERIFIED_API transports`, re-sync confirmé de leur côté aussi.

### Harden DocTypes (décidé par Claude, hors-gate)
Périmètre donné à Cursor : audit permissions Vague 2, edge cases ResourceService, anti-tenantId sur tous les domaines. Livré et vérifié : `packages/doctype/src/smoke/vague2-harden.test.ts` + `apps/lms-crm/scripts/harden-doctypes.test.ts`, commit `b9dd2c3`. Re-testé indépendamment : `pnpm test:doctype` 8/8, `pnpm test:doctype:harden` 2/2, `migrate diff --exit-code` = 0 (sync confirmé). Audit permissions Cursor : `role: '*'` toujours accompagné de `requires.anyPermissionSlugs` — pas d'ACL ouverte, cohérent avec PERMISSION_AUDIT V2. Rien à corriger.

### G10 Audit (SystemLog) + FundingCase sur page Financeurs
Commit `7ba3b3f`, vérifié : modèle `SystemLog` réel, `domains/audit/` réel, `test:doctype` 8/8, `test:doctype:harden` 2/2 — tout confirmé indépendamment.

**Build : échec des deux côtés (Claude ET Cursor), cause identifiée = RAM, pas du code.** Mesuré : 3,7 Go RAM libres sur 15,7 Go (23%), 25 process `node.exe` actifs (contre 4-5 en début de nuit) — la machine tourne les deux sessions (Claude + Cursor) depuis des heures sans redémarrage. `tsc --noEmit` (typecheck seul, léger) passe en 0 erreur — code G10 correct. Décision : ne pas s'acharner sur `next build` complet maintenant, le typecheck vert sert de garde-fou provisoire ; retenter un build propre plus tard quand la charge machine sera redescendue.

### FundingCase create (POST financeurs/cases) + soft-delete harden test
**Correction** : d'abord mal attribué au commit `c177f3d` (en fait le petit fix SystemLog) au lieu du vrai commit **`8c878c8`**. Une fois corrigé, les 3 fichiers du commit relus en entier : route API (auth, validation provider + enums Prisma réels, `FundingCase`+`FundingCaseEvent` d'audit), formulaire UI `create-funding-case-form.tsx` (client component propre, gestion erreur/pending), test soft-delete dans `vague2-harden.test.ts` (create→list→soft-delete→list vide→list trashed→get isTrashed=true, via ResourceService réel). Tout est correct. `test:doctype` 9/9, `test:doctype:harden` 2/2.

### Transitions FundingCase (décidé par Claude, hors-gate)
4 fichiers relus intégralement (pas de survol après l'auto-critique précédente) : state machine (`funding-case-transitions.ts`) correcte, route `PATCH [id]` transactionnelle (statut+event atomique), UI boutons propre, `colSpan` bien ajusté. Rien à corriger. Remarque mineure notée (pas bloquante) : la route POST create n'est pas transactionnelle contrairement au PATCH. Go donné pour commit.

Cursor a aussi signalé un 5e changement (export runtime des enums Funding dans `@repo/database`, sinon TS1362 sur `Object.values(...)`) — **vérifié cette fois avant de classer sans suite** : diff confirmé (vrais exports valeur, pas juste type), `tsc --noEmit` re-testé indépendamment, 0 erreur. Commit final **`4c6bd97`**, vérifié réel.

### Checklist FundingDocument (décidé par Claude, hors-gate)
Commit `e735819`. 5 fichiers relus en entier : routes GET/POST + PATCH/DELETE (scoping correct `{id: docId, caseId}` — empêche de manipuler la pièce d'un autre dossier), panneau UI (295 lignes, CRUD + upload via `/api/common/files`, cohérent avec le pattern Qualiopi), DocType registré. `test:doctype` 9/9, `test:doctype:harden` 2/2. Rien à corriger.

### Build final confirmé vert (saga RAM close)
`pnpm --filter @lms-crm build` : exit 0, 442s, 342 pages statiques. Corroboré via timestamp frais de `.next/BUILD_ID`. La série d'échecs/sorties silencieuses post-G1-E et G10 était bien de la contention RAM locale, pas une régression de code — confirmé définitivement.

### Correction Claude : pas de pause, G11 Finance/BPF débloqué
Claude avait d'abord dit "pause, plus de chantier hors-gate à valeur" — le user a repoussé ("plus de chantier quesque tu raconte"). Relecture du plan : `G11 Finance/BPF ← pas avant FundingCase réel` — gate satisfait puisque FundingCase est maintenant réel. Décision corrigée et envoyée à Cursor : enchaîner sur les agrégats BPF (nombre stagiaires/heures/montants dérivés des vraies données, calcul juste et déterministe, chiffres proches de zéro acceptables si peu de données réelles, pas de PDF Cerfa officiel exigé dans cette passe).

### Fix transactionnel POST create (suggestion mineure appliquée)
Commit `11c4812` — vérifié, POST create FundingCase maintenant transactionnel (case + event atomiques), même pattern que le PATCH. Correct.

### G11 BPF agrégats (débloqué par Claude, hors-gate)
Commit `734b187`. 3 fichiers relus en entier : bon travail — méthodologie transparente, contrôles qualité visibles, calculs sourcés (pas de données inventées), défaut année précédente logique. `test:doctype` 9/9.

**1 faille latente signalée (zéro impact vérifié : 0/11 sessions à dates nulles en base)** : le contrôle `SESSION_NO_DATES` est du code mort — la requête Prisma initiale exclut déjà au niveau SQL les sessions à dates nulles (aucune des 3 conditions OR ne peut matcher `null`), donc la boucle JS censée les compter ne les voit jamais. Le warning ne peut jamais se déclencher, même si une telle session apparaît un jour. Pas bloquant, signalé à Cursor sans le corriger moi-même (nécessite une décision de design sur comment compter ces sessions hors du filtre année).

### Fix SESSION_NO_DATES appliqué (Cursor, review Claude)
Commit `8d81e95` — vérifié via diff complet : requête `count` séparée (`Promise.all`, hors filtre année) exactement comme suggéré, message clarifié. `test:doctype` re-testé 9/9. Clos.

### 🔓 Déblocage majeur : SD-06 verrouillé + gate Evidence ouvert
Rattrapage d'un vrai manquement : le plan assignait explicitement à Claude la rédaction papier des drafts SD-06 (catalogue d'événements) et Evidence — jamais fait avant ce soir, c'est ce qui gelait tout un pan de la Vague 2. Claude a écrit les deux drafts (`docs/framework/SD-06-EVENT-CATALOG-DRAFT.md`, `EVIDENCE_ENGINE_PRISMA_DRAFT.md`), ancrés dans la doctrine déjà rédigée (`WORKFLOWS OF COMPLETS.md` §3, `ARCHITECTURE QUALIOPI...` §7) — pas inventés. Cursor a fait une review technique solide (4 points : gardes de transition forçables, rename `formationId`, index composite, référentiel indicateurs) — tous intégrés, SD-06 verrouillé, gate Evidence ouvert.

### G8 Evidence + SD-06 readiness mergés (Cursor)
Commit `a6fdbb5` (+ `0fc360c` docs). Vérifié en profondeur :
- Modèles `Evidence`/`EvidenceIndicatorLink`/`SessionReadinessEvent` + champ `readinessStatus` sur `FormationSession` — tous réels en base, `migrate diff --exit-code` = 0 (synchronisé).
- Route `PATCH/GET .../[sessionId]/readiness` relue en entier : implémente fidèlement l'accord négocié (transitions forçables, finding reste ouvert, transaction atomique statut+event+Evidence, `eventName: SESSION_STATUS_CHANGED` cohérent avec le catalogue SD-06).
- State machine `session-readiness-transitions.ts` : identique à WF-10 (DRAFT→...→ARCHIVED), même pattern que FundingCase.
- `test:doctype` 9/9, `test:doctype:harden` 2/2.
Rien à corriger — implémentation fidèle et propre.

### Doc states existants branchés sur Evidence (Cursor, go confirmé par écrit dans le handoff cette fois)
Commit `72093e2`. Helper `recordStatusEvidence` (accepte `PrismaClient` ou `TransactionClient` — bien pensé pour l'atomicité) + 4 points de branchement vérifiés : `FundingCase` PATCH, `FundingDocument` PATCH, Qualiopi item PATCH (transaction ajoutée proprement, Evidence seulement si le statut change vraiment, `sourceType` DOCUMENT/VALIDATION selon présence de fichier — détail bien pensé), `satisfaction-survey-service.ts` (2 points : requête + soumission). Tous les `eventName` fidèles au catalogue SD-06. `test:doctype` 9/9. Rien à corriger.

**Point de process noté** : un aller-retour a été perdu parce que Claude avait confirmé "vas-y" à l'utilisateur en conversation sans l'écrire dans `HANDOFF-CLAUDE.md` — Cursor attendait un signal qui n'était jamais arrivé dans le fichier qu'il lit réellement. Corrigé, la consigne est maintenant : toujours écrire le go dans le handoff, pas seulement le dire à l'utilisateur.

### G9 couverture Qualiopi (Cursor, décidé par Claude)
Commit `38d3fd1`. Pont `recordStatusEvidence({ indicatorCodes })` → `EvidenceIndicatorLink` (dédoublonné, filtré) ; `buildQualiopiCoverage` (itère les 32 indicateurs V9, cherche les liens correspondants) ; API + page `/gestion-ressources/qualiopi/couverture`. `test:doctype` 9/9.

**Point trouvé, analysé, faible sévérité confirmée** : la route `qualiopi/items/[itemId]` PATCH ne vérifie pas côté serveur que l'item appartient à un dossier `SCHOOL_QUALIOPI` (elle fait juste `findUnique({ id: itemId })` sur `ComplianceDossierItem`, tous kinds confondus — la base contient aussi des codes non-indicateurs comme `CNAPS_FORM_OF`/`RESIDENCE_PERMIT` d'un autre kind de dossier RH). Vérifié : un seul appelant existe (`qualiopi-classeur-view.tsx`, qui ne liste que des items Qualiopi), donc pas d'exploitation possible aujourd'hui. Vérifié aussi que `buildQualiopiCoverage` ne pourrait de toute façon pas être corrompu même si un `EvidenceIndicatorLink` orphelin existait (il itère les 32 indicateurs connus, pas l'inverse). Conclusion : faiblesse défensive réelle mais sans impact fonctionnel actuel — pas signalé à Cursor comme urgent, juste noté ici pour mémoire.

### 🔓 Gel LMS levé (LMS_DRIFT)
Proposé par Claude (prudence : contrairement à Funding/Evidence, pas de seuil mécanique — jugement sur l'état du socle). Cursor a répondu avec un vrai diagnostic point par point (L1 résolu par reorder bootstrap, L2 atténué, L3 résiduel mineur accepté, L7 résolu par retrait de l'alias `enrollment` nu) plutôt qu'un "oui" vague. Vérifié indépendamment : ordre bootstrap confirmé (grep), alias `lmsEnrollment` seul confirmé, commit `ae14261` réel, `test:doctype` 9/9. Gel levé dans `LMS_DRIFT.md` et le handoff — G12 LMS peut démarrer pour de vrai (règle : `domains/lms/*` importe framework, jamais l'inverse).

### G12 amorcé : registre Cours LMS (Cursor)
Page/API `vie-scolaire/cours` (liste, KPI, création brouillon, publier/dépublier). Vérifié : `domains/lms/` non touché (confirmé par `git status`, contrairement à ma première vérif qui comparait le mauvais diff), route GET/POST lue en entier — propre, cohérent. `test:doctype` 9/9. Pas encore committé.

### Admin Inscriptions LMS (2e feature G12)
Page/API `inscriptions-lms` + helper `lms-enrollment-transitions.ts` (map de garde PENDING↔VALIDATED/REJECTED/ARCHIVED, cohérente). Vérifié : `domains/lms/` intact, `test:doctype` 9/9. Rien à corriger.

## 🌙 Clôture de la nuit

Cursor a lui-même signalé honnêtement que le backlog raisonnable était épuisé plutôt que d'inventer du travail — accepté, session close pour ce soir.

**Bilan complet :**
- Vague 1 (DocType V2) : G1-A→G1-E, terminée et vérifiée.
- Vague 2 : G3 (CRM) → G12 (LMS), tous livrés et vérifiés indépendamment (pas juste rapportés).
- Evidence Engine (G8) : construit à partir de zéro (drafts SD-06 + Evidence rédigés par Claude, seule tâche papier vraiment bloquante de la nuit), verrouillé avec Cursor, mergé, branché sur tous les domaines existants (Funding, Qualiopi, satisfaction, session readiness).
- Gel LMS (`LMS_DRIFT.md`) levé après vérification point par point des findings, 2 features G12 livrées derrière.
- **3 vrais bugs trouvés et corrigés** cette nuit (pas de faux positifs après le premier) : `db:push` silencieux, mapping transport Financeurs faux, contrôle qualité BPF en code mort.
- **~35 commits** au total depuis le début de la Vague 1.
- Reste optionnel pour plus tard : rename `LmsLesson`→`LmsChapter`, extension catalogue SD-06 aux familles B/C, CH-8 (vérif n8n réel), migration du classeur Qualiopi legacy vers Evidence.

## 2026-08-29 (reprise, ~18h) — Connecteur EDOF catalogue XML

Utilisateur a demandé de reprendre. Décidé : connecteur EDOF (export catalogue XML LHEO), seul connecteur externe avec tout le matériel officiel déjà en repo (XSD, exemple, spec) sans attendre de compte externe.

Livré par Cursor : générateur `build-catalog-xml.ts`, API `GET .../edof-catalog`, page UI. Gaps bloquants vs défauts documentés explicitement (pas inventés en silence) — bon niveau de rigueur.

**Vrai bug trouvé par Claude (vérifié, pas supposé)** : le générateur produit du UTF-8, mais le XSD officiel ET l'exemple réel EDOF déclarent tous deux `encoding="ISO-8859-1"` — vérifié en lisant directement les deux fichiers sources. Ce n'est pas cosmétique : un mauvais encodage peut faire rejeter le fichier à l'import EDOF. Fix demandé à Cursor. Les 2 autres questions ouvertes (validation XSD runtime, champs Prisma dédiés) tranchées : pas nécessaire pour ce P0 (transport MANUAL_PORTAL = relecture humaine avant upload de toute façon ; défauts documentés suffisent tant qu'un cas réel ne les contredit pas).

**Fix vérifié en profondeur** : `encode-iso-8859-1.ts` relu en entier — encodage correct (itère par code point Unicode via `for...of`, détecte tout caractère > 0xFF, erreur explicite typée `EdofIso88591EncodingError` avec liste des caractères fautifs plutôt qu'un mojibake silencieux, `Buffer.from(xml, 'latin1')` pour l'encodage réel des bytes). Header XML, `Content-Type` et `X-Edof-Encoding` tous cohérents. Bug bonus corrigé au passage (`SystemSetting.findFirst` avec `orderBy` sur champ inexistant → remplacé par `where: { active: true }`). Typecheck complet relancé indépendamment : **0 erreur**. Rien à corriger.

### Checklist EDOF dossier (2e sous-chantier connecteur EDOF)
`edof-dossier-checklist.ts` relu en entier — 4 étapes (saisie dossier/entrée formation/service fait/appel règlement), `dueFrom` cumulatif par statut FundingCase (pas de régression d'état), respecte explicitement la doctrine "pas de câblage Factur-X" déjà actée pour l'appel à règlement. Route GET/POST relue : pas de nouveau modèle Prisma confirmé (upsert `FundingDocument` sur la contrainte unique `caseId_code` existante), auth + validation `funderType=CPF` sur les deux endpoints. `test:doctype` 9/9. Rien à corriger.

### Checklist OPCO AFDAS/ATLAS (même pattern, périmètre vérifié)
`opco-dossier-checklist.ts` relu en entier — même qualité que EDOF (cumulatif correct, doctrine Factur-X respectée). Point vérifié en base : un seul `FundingProvider` `OPCO_HORS_APPRENTISSAGE` existe (pas de lignes AFDAS/ATLAS séparées) — Cursor l'a documenté honnêtement en commentaire plutôt que de le cacher, et le filtre `isOpcoChecklistEligibleProvider` gère correctement les deux cas (nom explicite AFDAS/ATLAS si un jour séparé, ou le code générique aujourd'hui). `test:doctype` 9/9. Rien à corriger.

### Checklist France Travail Kairos (3e et dernière du lot vérifié)
`kairos-dossier-checklist.ts` relu en entier — même qualité, rappel doctrine "saisie devis conditionnée à l'affichage Qualiopi côté FT" bien inclus dans le `portalHint` de la 1ère étape comme demandé. `test:doctype` 9/9. Rien à corriger. **Lot "checklists MANUAL_PORTAL vérifiées" terminé** : EDOF + OPCO AFDAS/ATLAS + FT Kairos. Les financeurs restants (AGEFIPH, Transitions Pro, Régions, 9 autres OPCO) restent non vérifiés — pas d'invention.

### WF-39 sous-traitants (famille B SD-06, chantier neuf)
Modèles `SubcontractorRecord`/`SubcontractorStatusEvent` mergés — vérifié en DB réelle (`\dt`), `migrate diff --exit-code` = 0 (synchronisé). Route PATCH relue en entier : transitions strictes (`canSetSubcontractorStatus`, contrairement à Funding/readiness qui sont forçables — cohérent, ici c'est un vrai gate de qualification pas un signalement), transaction statut+event+Evidence. **Lien `Q-I27` vérifié exact** (l'indicateur Qualiopi réel "Sous-traitance / portage salarial conforme", pas un choix approximatif) — ferme la boucle avec la page de couverture Qualiopi (G9) construite plus tôt. `test:doctype` 9/9, `test:doctype:harden` 2/2. Rien à corriger.

### WF-40 référent handicap (P0 léger, famille B)
Livré exactement dans l'esprit demandé — zéro nouveau modèle dédié : 3 champs sur `SystemSetting` (contact référent), nouveau kind Compliance `DISABILITY_REFERENT` (actions/formations tracées), réutilisation de `Company.kind = PARTNER` pour les partenaires (Cap emploi etc., pas de nouveau modèle). Vérifié : champs schema confirmés, `migrate diff --exit-code` = 0, indicateurs `Q-I20`/`Q-I26` vérifiés exacts (référent handicap + accueil publics handicap — pas approximatifs). `test:doctype` 9/9. Rien à corriger.

**Point d'arrêt légitime famille B** : les 3 "veille" restants (WF-35/36/37) n'ont aucune source de données externe intégrée dans GSMS — construire un event catalogue pour un déclencheur qui n'existe pas serait prématuré/spéculatif, pas comme WF-39/40 qui s'appuyaient sur de l'infra réelle déjà là. Accepté comme fin de la famille B concrète pour ce soir.

### K8 : rename LmsLesson → LmsChapter
Vérifié : DocType canonique `LmsChapter` (`name: 'LmsChapter'`), aliases `['LmsLesson', 'lmsChapter', 'lesson']` corrects, export déprécié `lmsLessonDocType` conservé pour compat. `LMS_DRIFT.md` mis à jour par Cursor lui-même (L3 marqué résolu). `test:doctype` 9/9. Rien à corriger. **Roadmap Vague 2 close pour ce soir côté Cursor** — reste le SD-06 B/C (papier, mon travail) en option.

### Tableau de bord conformité (agrégation, pas de nouvelle logique)
Livré : `compliance-dashboard.ts` + route + page. **Bug réel trouvé et corrigé par Claude** : même famille que le fix Funding de tout à l'heure — `CrmCompanyKind` utilisé comme valeur runtime dans la logique référent handicap mais jamais exporté depuis `packages/database/src/index.ts` (`tsc --noEmit` échouait réellement, exit 1, avant le fix). Ajouté à l'export runtime existant, re-testé indépendamment : `tsc` 0 erreur, `test:doctype` 9/9.

**FYI trouvé en creusant, pas urgent** : `schema.prisma` a une corruption d'encodage progressive dans les commentaires (mojibake `é`→`Ã©`, voire double-mojibake sur certaines lignes au fil des sauvegardes successives ce soir par plusieurs outils/instances). Aucun impact fonctionnel (commentaires seulement), juste signalé à Cursor pour un futur nettoyage.

**Note** : Cursor a aussi corrigé le même point de son côté, en parallèle, avec une approche différente (string littérale `'PARTNER'` au lieu de l'enum `CrmCompanyKind.PARTNER`) — vérifié que les deux fixes coexistent sans conflit, `tsc --noEmit` toujours à 0 erreur. Mon export ajouté reste inoffensif (utile si du code futur a besoin de l'enum runtime).

### CH-8 : audit n8n vs doctrine (le point resté en attente depuis le tout début de soirée)
Audit factuel demandé, livré, **vérifié en profondeur avant tout avis** (pas sur parole) : `SessionAutomationRun.count()` = 0 recompté en base, variables `N8N_WEBHOOK_*` absentes confirmées, **27 `wf('GSMS...')` recomptés un par un dans `index.mjs`** — noms identiques à l'annonce de Cursor, endpoint `satisfaction-cold-followup` confirmé orphelin (existe côté CRM, absent du provisioner n8n). Catégorisation X/Y/Z honnête, pas de survente.

4 trous signalés, tranchés :
1. Webhook local non configuré — normal, environnement dev, rien à faire.
2. **`satisfaction-cold-followup` branché** — vérifié réel (workflow + event catalogue aux 3 endroits nécessaires), `test:doctype` 9/9.
3. Checklists financeurs hors n8n — accepté, choix de design cohérent.
4. Jalon jFin (satisfaction chaud) = notify seulement — mini-draft proposé par Cursor (2 options pesées), **ack donné pour l'option cron quotidien** (pas de hook sur le circuit `default` existant, zéro risque sur la boucle Wait). **Livré et vérifié** : `satisfaction-hot-followup` + wf n8n à 10h30 (après le froid à 10h), jalon jFin inchangé, `test:doctype` 9/9, `tsc --noEmit` 0 erreur (Cursor a même corrigé un `isTrashed` inexistant sur `FormationSession` avant que je n'aie à le signaler).

**CH-8 est maintenant entièrement clos** — c'était le seul point resté sur ma liste depuis le début de la soirée.

### Backfill Evidence Qualiopi (rattrapage historique)
Script one-shot vérifié en entier — idempotent (check `findFirst` avant création, `skippedAlreadyLinked` si déjà fait), résultat vérifié en base réelle (1 `EvidenceIndicatorLink` sur `Q-I01`, `backfilled: true` + `backfilledAt`, `fromStatus: null` correctement synthétique). Résultat honnête : seulement 1 item concerné (couverture 0%→3%) — logique vu que le classeur Qualiopi actuel a été construit majoritairement ce soir même. `test:doctype` 9/9. Rien à corriger.

### Audit permissions 30 DocTypes — 0 trou fail-open (vérifié en double)
Vrai sujet sécurité retrouvé dans `PERMISSION_AUDIT.md` (P4-P10, sur le nouveau moteur, distinct de P1-P3 résolus par la suppression du legacy en G1-E). Cursor a livré un script d'inventaire + renforcé `harden-doctypes.test.ts` (seuil ≥27 DocTypes, module `organisation` requis, nouveaux samples). **Vérifié indépendamment, pas sur parole** : relancé le script d'inventaire moi-même → `count: 30, failOpenCount: 0` confirmé identique. Logique du script relue en entier : scanne les permissions compilées du bootstrap réel (`role === '*'` sans `anyPermissionSlugs`/`allPermissionSlugs`) — check réel, pas trivial. `test:doctype:harden` 2/2, `test:doctype` 9/9 re-testés. Discipline "toujours mettre `requires`" confirmée tenue sur tout le lot de la soirée. P4/P5/P6 (DocPerm fin, permlevel, row-level) restent hors périmètre — vrai gap architectural mais trop large pour ce soir, noté pour plus tard.

### Nettoyage encodage schema.prisma (clos)
128 lignes de commentaires mojibake corrigées, ligne par ligne selon motif détecté (pas de re-encode aveugle — préserve les accents déjà corrects). Vérifié indépendamment sur 4 fronts : `prisma validate` ✅, `migrate diff --exit-code` = 0 (sync), `grep` mojibake résiduel = 0, `test:doctype` 9/9 + `test:doctype:harden` 2/2 + `tsc --noEmit` 0 erreur re-testés. Rien à corriger, chantier clos.

### Instance Claude tierce : commit effectué
L'agent IA FundingCase a été committé proprement par l'autre instance : `64b4621 feat(funding): agent IA conversationnel sur FundingCase`. Message clair, cohérent avec ce qui avait été vérifié plus tôt (AiRun/AiArtifact, jamais d'écriture directe). Working tree propre de son côté après commit.

### 🚨 Incident coordination : instance Claude tierce
Une autre instance Claude (pas moi, pas Cursor) a travaillé en parallèle sur ce même repo sans coordination — ajout d'un agent IA conversationnel sur FundingCase (`AgentConversation`/`AgentMessage`, `funding-case-agent.ts`, panneau). Vérifié en profondeur avant tout avis : schéma additif propre (+32 lignes, zéro collision), `financeurs/page.tsx` proprement empilé avec les 3 checklists de Cursor sans conflit, tests+typecheck combinés tous verts, code de l'agent bien conçu (pipeline AiRun/AiArtifact existant, jamais d'écriture directe). Aucun dégât réel. L'instance a été disciplinée : elle s'est arrêtée avant `db:push`/build/commit pour demander l'aval plutôt que de forcer. Feu vert donné pour qu'elle termine proprement (avec la mise en garde sur le faux-succès `db:push` observé ce soir), commit séparé de celui de Cursor.
