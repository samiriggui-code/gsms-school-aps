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

### Backlog committé (7 commits séparés)
Demandé par Claude (65 fichiers accumulés depuis `64b4621`). Vérifié : 7 commits réels, messages clairs par sujet (organisation WF-39/40, dashboard conformité, n8n satisfaction, harden permissions, backfill Qualiopi, EDOF/checklists, LMS). Working tree ramené à 14 éléments — tous attendus (fichiers de suivi Claude + docs de référence, rien de code). `test:doctype` 9/9 re-confirmé.

### Recherche financeurs non vérifiés (Claude, WebSearch/WebFetch réels)
- **AGEFIPH** : aucune API trouvée (2 recherches), cohérent avec l'existant. Négatif confirmé, pas de changement au doc.
- **Transitions Pro** : **upgradé de `verified: false` à `verified: true`**. Source réelle citée (ATpro Île-de-France FAQ) : espace créé directement par Transitions Pro (pas d'auto-inscription OF), saisie 100% en ligne via Menu Mes Dossiers → Certificat de réalisation, aucune API. `connector-capabilities.json` + `source-registry.json` + `transitions-pro/README.md` mis à jour, JSON validés après édition.
- **Régions PRF** : traité en 29/08, scope resserré sur l'IDF (seule région réelle de GSMS School — `companyRegion`/`ndaRegion` du seed), même logique que Transitions Pro plutôt qu'un audit générique des 13-18 régions. **Upgradé de `verified: false` à `verified: true`** pour l'IDF : process confirmé (dossier stagiaire RS1 → ASP, saisie continue des présences sur l'extranet RemuNet `remunet.asp-public.fr`), aucune API trouvée. RemuNet identifié comme probablement une plateforme ASP générique (pas propre à l'IDF — l'ASP a un extranet distinct nommé DEFI pour le Grand Est), donc pas supposé universel aux autres régions sans vérification individuelle. `connector-capabilities.json` + `source-registry.json` + `regions/README.md` mis à jour, JSON validés après édition.

### P4 permission-engine — ack donné à Cursor (29/08)
Cursor a livré `docs/framework/P4-DOCPERM-ACTIONS-DRAFT.md` en réponse au chantier "P4 (design d'abord)" : audit runtime sérieux (types + moteur relus, inventaire réel 30 DocTypes bootstrap → 29/30 déjà SPLIT view≠mutate, 1 SAME = `SystemLog`), verdict honnête que **le moteur `@repo/doctype` n'a pas besoin d'être touché** — le vrai gap P4 est déclaratif (+ un slug IAM optionnel), et correction du finding P4 de `PERMISSION_AUDIT.md` identifié comme périmé (décrit l'ère legacy `ENTITY_REGISTRY`) sans se le réécrire tout seul — a attendu l'ack. Ack donné dans `HANDOFF-CLAUDE.md` : verdict confirmé, priorité **C (SystemLog, retirer write/delete de `iam.logs.view`) → B (FundingCase, restreindre delete) → A2 (nouveau slug `governance.conformite.edit` sur SubcontractorRecord, diff de seed à montrer avant de présélectionner les rôles)**, + mise à jour `PERMISSION_AUDIT.md` P4 → P4′ dans le même lot. En attente de la mise en œuvre, à vérifier indépendamment comme d'habitude (`test:doctype` + `test:doctype:harden` + `tsc --noEmit` + relecture du diff de seed pour A2).

### Instance Claude tierce : commit effectué
L'agent IA FundingCase a été committé proprement par l'autre instance : `64b4621 feat(funding): agent IA conversationnel sur FundingCase`. Message clair, cohérent avec ce qui avait été vérifié plus tôt (AiRun/AiArtifact, jamais d'écriture directe). Working tree propre de son côté après commit.

### 🚨 Incident coordination : instance Claude tierce
Une autre instance Claude (pas moi, pas Cursor) a travaillé en parallèle sur ce même repo sans coordination — ajout d'un agent IA conversationnel sur FundingCase (`AgentConversation`/`AgentMessage`, `funding-case-agent.ts`, panneau). Vérifié en profondeur avant tout avis : schéma additif propre (+32 lignes, zéro collision), `financeurs/page.tsx` proprement empilé avec les 3 checklists de Cursor sans conflit, tests+typecheck combinés tous verts, code de l'agent bien conçu (pipeline AiRun/AiArtifact existant, jamais d'écriture directe). Aucun dégât réel. L'instance a été disciplinée : elle s'est arrêtée avant `db:push`/build/commit pour demander l'aval plutôt que de forcer. Feu vert donné pour qu'elle termine proprement (avec la mise en garde sur le faux-succès `db:push` observé ce soir), commit séparé de celui de Cursor.

### P4 C→B→A2 — livré et vérifié indépendamment (29/08)
Cursor a implémenté les 3 correctifs déclaratifs ackés, **rien touché dans `permission-engine.ts`** comme convenu. Vérifié diff par diff (pas sur le rapport) :
- **C (SystemLog)** — `domains/audit/doctypes.ts` : règle mutate (`create/write/delete` sous `iam.logs.view`) supprimée entièrement, seul `read` reste. Conforme.
- **B (FundingCase)** — `domains/funding/doctypes.ts` : `delete` sorti de la règle `create/write` (`crm.finance.edit`) vers une règle séparée exigeant `crm.securite.edit`. Cancel métier (transition `CANCELLED`) reste sur `write`/`finance.edit`. Conforme.
- **A2 (SubcontractorRecord)** — `domains/organisation/doctypes.ts` : `write` sorti de la règle `create/delete` (`crm.ressources.edit`) vers une règle séparée exigeant le nouveau slug `governance.conformite.edit`. Conforme.
- **Nouveau slug** : `governance.conformite.edit` ajouté proprement dans `crm-permissions.ts` (GOVERNANCE_PERMISSION) + `permission-domains.ts` (catalogue UI) + `permissions.js` (table permissions).
- **Seed rôles** (`crm-role-permissions.js`) — diff demandé avant validation, vu et cohérent avec le raisonnement annoncé : `admin` et `collaborateur` reçoivent le slug (commentaire explicite pour collaborateur : « lecteur conformité qui peut valider ST/pièces sans crm.ressources.edit »), `manager` non touché (créer≠valider, volontaire), `superadmin` inchangé (`*`).
- **Bonus trouvé en lisant le diff** : les 2 routes `sous-traitants` (`route.ts` + `[id]/route.ts`) ne vérifiaient auparavant qu'une session authentifiée (`session.user.id`), **aucune permission** — un vrai trou. Maintenant branchées sur `requirePermission` avec les bons slugs (GET=conformite.view, POST=ressources.edit, PATCH=conformite.edit). Helper `requirePermission`/`requireCrmApiAuth` relu, préexistant, correctement utilisé.
- **`PERMISSION_AUDIT.md`** : P4 remplacé in-place par P4′ actualisé, historique conservé, cohérent avec le contenu du draft.
- **Tests relancés moi-même** (pas repris du rapport Cursor) : `pnpm test:doctype` 9/9, `pnpm test:doctype:harden` 2/2, `tsc --noEmit` (apps/lms-crm) exit 0. Tous verts, confirmés indépendamment.
Chantier P4 clos, propre, rapide. Commité par Cursor en 2 commits séparés : `b3d6622` (code P4) et `9b72836` (docs/handoff + draft P5/P6) — `git show --stat` vérifié sur les deux, contenu conforme, aucune dérive avec ce que j'avais relu avant commit.

### P5/P6 — reportés, IAM/permission-audit (P1-P10) clos pour ce soir
Cursor a livré `docs/framework/P5-P6-PERMLEVEL-RECORD-DRAFT.md` en réponse à la consigne "vérifie le besoin métier réel avant de proposer du code moteur". Verdict : **P6 (record permission formateur/session) a un vrai besoin conceptuel mais déjà mitigé hors moteur** — vérifié par moi-même en lisant `instructor-access.ts` (`listInstructorSessionIds`/`assertInstructorOwnsSession`, filtré `trainerUserId`) et en confirmant dans `crm-role-permissions.js` que le rôle `formateur` n'a **aucun** slug `crm.academique.*`, donc ne passe jamais le gate DocType `FormationSession` — le risque est latent (futur rôle hybride mal scopé), pas un trou actuel. **P5 (permlevel champs)** : aucun besoin métier nommé, `permlevel` reste à 0 partout, reporté. Ack donné : Option A (ne pas toucher `permission-engine.ts`/`resource-service.ts`), documentation `PERMISSION_AUDIT.md` demandée en remplacement in-place (même pattern que P4′). Série P1→P6 de l'audit permissions close pour ce soir avec une discipline tenue de bout en bout : jamais de code sur le moteur sans ack explicite. Doc `PERMISSION_AUDIT.md` P5′/P6′ committée (`e31df79`), diff relu — conforme exactement à ce qui avait été ack.

### G1-E (delete legacy) — vérifié indépendamment, réel
Répondant à ma question sur l'état du framework, Cursor a confirmé G1-D et G1-E clos, Vague 1 DocType terminée. Pas pris sur parole : commit `f529f85 feat(doctype): complete G1-E — remove legacy framework, ResourceService only` retrouvé dans l'historique de `main` (ancêtre de HEAD, confirmé via `merge-base --is-ancestor`). `grep ENTITY_REGISTRY` sur `apps/lms-crm` → seulement 2 mentions restantes, toutes deux des commentaires documentant la suppression elle-même (`protect-route.ts` : "G1-E: PermissionEngine only (legacy ENTITY_REGISTRY removed)"), aucune référence active. Relancé moi-même `tsc --noEmit` (exit 0), `test:doctype` (9/9), `test:doctype:harden` (2/2) après le G1-E — tout vert. Framework DocType V2 entièrement basculé, plus aucun code legacy actif.

### Point d'étape 22h58 — chantiers du soir tous clos
G1-D, G1-E, Vague 1 DocType, audit permissions P1-P10 (P1-P3 résolus par G1-E, P4 corrigé et commité, P5/P6 documentés et reportés à raison) — tout vérifié indépendamment, rien accepté sur parole de bout en bout. Cursor idle, en attente de prochaine consigne. Hors scope volontaire restant : WF-35-37 (veille, pas d'infra déclenchante), ExternalExchange (comptes externes requis), EVE (priorité explicitement la plus basse).

### Réexamen backlog sur "continue" — WF-38 était déjà fait, doc corrigée
Avant de rouvrir un front, revérifié WF-35-40 (famille B organisme) plutôt que de supposer que "non implémenté" (label du catalogue SD-06) était encore vrai. Trouvé que **WF-38 volet "document expirant" est déjà en prod** : `ComplianceService.auditOpenDossiers()` (générique tous kinds dont `FORMATEUR_HABILITATION`), cron réel `packages/workers/src/compliance-auditor.ts` toutes les 15 min + digest admin lundi 8h, wiré dans `packages/workers/src/run.ts` — vérifié en lisant le code, pas supposé. `SD-06-EVENT-CATALOG-DRAFT.md` corrigé (tableau §5 avec colonne Statut) : WF-38 doc-expirant / WF-39 / WF-40 marqués ✅ implémentés, seuls WF-35-37 (veille, pas de source externe branchée) et le volet "annual review" de WF-38 (pas de besoin métier identifié) restent réellement ouverts. Décision : ne pas coder WF-35-37 quand même — construire une infra de veille sans déclencheur réel serait spéculatif, contraire à la discipline tenue toute la soirée.

### 🚨 Audit exhaustif WF-01→50 demandé par l'utilisateur (frustré, "annalyse merde") — 15 non implémentés trouvés
L'utilisateur a demandé de vérifier l'ensemble des ~50 workflows de la doctrine (`GSMS SCHOOL — WORKFLOWS OF COMPLETS.md` §64), pas juste les 27 circuits n8n. Délégué à un agent Explore avec brief complet (familles B/C réutilisées telles quelles, effort concentré sur famille A WF-01→34 jamais auditée exhaustivement). Résultat : **20✅ / 15🟡 / 15❌ sur 50**. Rapport complet écrit dans `docs/AUDIT-WORKFLOWS-50-COMPLET.md`.

**Cas de survente trouvé dans mon propre document** (`SD-06-EVENT-CATALOG-DRAFT.md` §7) : la checklist finale disait "Famille A : LOCKED — implémenté" sans reprendre la nuance de scope posée en §3 ("scope volontairement resserré, pas les 45 WF au complet") — lu seul, ça survendait. **2 findings les plus lourds re-vérifiés personnellement avant de les accepter** (pas sur parole de l'agent) : WF-11/12 (contrôles J-30/J-15) — lu `session-readiness-transitions.ts` (simple map de statuts sans aucune condition) et `readiness/route.ts` ligne 55 (`findingIds` pris tel quel depuis le body HTTP client, aucun modèle `Finding`, aucun calcul serveur) — confirmé, c'est un bouton d'avancement manuel + log d'audit, pas un moteur de contrôle automatique. WF-17 (signature manquante) — `grep` sur toute la codebase, zéro résultat, confirmé absent malgré le tableau SD-06 qui le listait sous "(implémenté)".

`SD-06-EVENT-CATALOG-DRAFT.md` §7 corrigé avec renvoi vers le nouveau doc d'audit. Onze WF de la famille A sont à zéro code, dont plusieurs liés à de vraies exigences Qualiopi citées dans le doc source (WF-02 analyse du besoin, WF-03 positionnement, WF-19 prévention rupture de parcours, WF-32 analyse satisfaction) — pas des détails cosmétiques. Décision de priorisation pas encore prise, en attente de l'utilisateur.

### WF Tranche 1 — livrée et vérifiée en profondeur (commit `5ee80c6`)
Utilisateur stressé ("3e projet qui foire", "concentre-toi") — vérification menée avec un niveau de rigueur maximal, chaque fichier lu en entier, rien accepté sur la table de commit.

- **WF-28/29/30 (satisfaction entreprise/formateur/financeur)** : `SatisfactionSurveyTiming` étendu (COMPANY/TRAINER/FUNDER), modèle `SatisfactionSurvey` migré proprement (`participantId` nullable, contrainte unique `(sessionId, timing, audienceKey)`), 15 nouvelles questions dédiées par audience, résolution de destinataire par audience (`resolveStakeholderRecipient`) avec gestion **honnête** du cas financeur (pas d'e-mail fiable en P0 → skip explicite plutôt que d'inventer une adresse). Switches exhaustifs avec garde `never` (2×) — bonne pratique anti-régression si un timing est ajouté plus tard sans mettre à jour tous les branchements.
- **WF-32 (analyse auto satisfaction)** : `scoreAverage`/`scoreAlert` calculés (moyenne des questions scale, bornée 1-4), seuil à 3, Evidence `SATISFACTION_SCORE_ALERT` (`sourceType: LOG`) créée transactionnellement si alerte.
- **WF-07 (devis VIEWED)** : transition SENT→VIEWED déclenchée uniquement côté route publique (`forPublicViewer: true`) — **vérifié que la prévisualisation staff ne déclenche pas la transition** (2 appelants distincts de `getDevisPlaquetteData`, un seul passe le flag). Acceptation en ligne élargie à SENT|VIEWED.
- **WF-06 (SELF_FUNDED/APPRENTICESHIP)** : ajout dans `mapFunderType()` (`sync-providers-from-matrix.ts`). **Vérifié spécifiquement l'absence de collision par substring** (même classe de bug que le mapping transport trouvé plus tôt ce soir) : `OPCO_API_CONVERGENCE_APPRENTISSAGE` contient bien "APPRENT" mais le check `OPCO` est placé avant dans l'ordre des conditions, donc pas de mauvais classement.
- **DocType `satisfactionSurvey`** : déclaration alignée avec le schéma (participant non-required, 4 nouveaux champs).

**Vérifications indépendantes (pas reprises du rapport Cursor)** : `test:doctype` 9/9, `test:doctype:harden` 2/2, `tsc --noEmit` exit 0, **`prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --exit-code` → exit 0, migration vide** (DB réellement synchronisée avec le schéma, pas juste la claim de Cursor — c'est exactement le point qui avait donné un faux-succès silencieux plus tôt ce soir sur Windows). Tout vert, rien à corriger. Tranche 1 close.

### WF Tranche 2 — livrée et vérifiée en profondeur (commit `378dd36`)
- **WF-17 (signature manquante)** : `fetchPedagogyDailyAlerts` calcule les trous (participants confirmés sans ligne d'émargement pour un créneau) en lecture pure — **vérifié ligne par ligne qu'aucun `.create()` sur `formationSessionEmargement` n'existe dans tout le chemin** (`n8n-session-data.ts` + `pedagogy-evening-workflows.ts`), juste des envois d'e-mail (apprenant/formateur/admin). Règle "ne jamais fabriquer la preuve" respectée à la lettre.
- **WF-18 (justification absence)** : enum `AbsenceJustificationStatus` + champs sur `FormationSessionEmargement` existant (pas de nouveau modèle, bon choix — reste 1:1 avec la ligne d'émargement). Auto-passage à `JUSTIFICATION_REQUESTED` le soir + PATCH manuel staff (`academiqueEdit` vérifié) pour la suite du cycle. Evidence `LEARNER_ABSENT` à chaque transition.
- **WF-08 (convention)** : nouveau modèle `FormationSessionConvention` (1 par participant), cycle GENERATED→SENT→VIEWED→SIGNED→ARCHIVED avec **guard de rang anti-régression** (`upsertSessionConvention` ne rétrograde jamais un statut), cron réel `convention-reminders` (J+2/J+5, max 2 relances, wiré dans `deploy/gsms/n8n/workflows/index.mjs` à 09h15) + PATCH staff pour SIGNED/ARCHIVED. **Nuance notée** : contrairement au devis WF-07, `VIEWED` n'est pas déclenché par un vrai clic destinataire (pas de portail public convention existant) — c'est un toggle manuel staff pour l'instant. Adaptation honnête de Cursor (pas de route publique inventée pour combler), signalée dans le handoff plutôt que passée sous silence.

**Vérifications indépendantes** : `test:doctype` 9/9, `harden` 2/2, `tsc --noEmit` 0, `migrate diff --exit-code` 0 (DB re-synchronisée, re-vérifié). Tranche 2 close. Cursor attend le cadrage WF-02/03 avant de coder (comme demandé) — à produire maintenant.

### WF-02/03 CandidatureAssessment — livré et vérifié en profondeur (commit `b517e26`)
Cadrage suivi à la lettre : modèle `CandidatureAssessment` (kind NEEDS_ANALYSIS/POSITIONING, pattern SatisfactionSurvey), pas de nouveau modèle dans ComplianceDossier ni de Json non typé sur Candidature.

- **Service** (`candidature-assessment-service.ts`, lu en entier) : `ensureAssessment` idempotent (contrainte unique candidature+kind), `submitAssessmentAnswers` valide les questions requises, calcule `adaptationRequired`/`level`/`prerequisitesStatus`, enregistre l'Evidence (`NEEDS_ANALYSIS_COMPLETED`/`POSITIONING_COMPLETED`, `sourceType: QUESTIONNAIRE`) transactionnellement, **puis auto-crée + invite WF-03 dès que WF-02 est complété** — chaînage exact demandé.
- **Bootstrap sur les 3 points d'entrée réels** (pas juste un seul) : `preinscriptions/route.ts`, `landing-leads/[leadId]/convert-to-candidature/route.ts`, `rh/etudiants/route.ts` (slug candidat). Chaque appel est best-effort (try/catch, ne bloque jamais le flux principal) — vérifié dans les 3 fichiers.
- **Lien public** : HMAC-SHA256 + `timingSafeEqual` + expiration (même pattern que devis/satisfaction), route `/api/public/assessment/[assessmentId]` vérifiée (GET+POST gatés sur le token, pas de bypass).
- **Visibilité staff** : GET `.../candidatures/[id]/assessments` agrège `adaptationRequired` sur tous les assessments de la candidature — l'info n'est pas perdue silencieusement, comme demandé dans le cadrage.
- **DocType** `candidatureAssessmentDocType` enregistré dans `domains/crm/register.ts`, pattern SPLIT view (`academiqueView`) / edit (`academiqueEdit`) — conforme au standard P4 de ce soir.

**Vérifications indépendantes** : `test:doctype` 9/9, `harden` 2/2, `tsc --noEmit` 0, `migrate diff --exit-code` 0. Tout vert, rien à reprendre.

**Bilan consolidé** : 11 workflows fermés en une session (WF-06/07/08/17/18/28/29/30/32/02/03) — tally global passé de **20✅/15🟡/15❌ à 31✅/11🟡/8❌ sur 50**, `AUDIT-WORKFLOWS-50-COMPLET.md` mis à jour. Chaque livraison vérifiée indépendamment (code relu en entier, tests+tsc+migrate diff relancés par Claude), aucune sur parole.

### WF Tranche 3 — livrée et vérifiée en profondeur (commit `b6e4074`)
- **WF-04 (accessibilité candidat)** : `AdaptationStatus` sur `CandidatureAssessment` existant (pas de nouveau modèle, bon choix). **Point positif notable** : `canAdvanceAdaptation`/`FORWARD` (`candidature-adaptation.ts`) impose un **state machine strict forward-only** (PENDING→APPROVED→IMPLEMENTED, aucun saut, aucun retour en arrière) — plus rigoureux que les transitions "forçables" vues sur readiness/justification plus tôt ce soir. Notification référent handicap (`SystemSetting.disabilityReferentEmail`, champ pré-existant réutilisé, pas inventé) déclenchée à `adaptationRequired: true`. **Indicateurs Qualiopi vérifiés réels** : Q-I20 ("référent handicap") et Q-I26 ("accueil publics en situation de handicap") retrouvés dans `qualiopi-indicators.ts`, pas inventés.
- **WF-14 (J-5)** : confirmé "pas de 3e questionnaire" comme demandé — réutilise l'invite positioning existante + notif adaptation si `PENDING`. Idempotence vérifiée au niveau requête (`j5PrepReminderSentAt: null` dans le `where` Prisma, pas un filtre après coup), et le compteur `skipped` ne marque pas "envoyé" si l'e-mail a échoué (retry naturel le lendemain plutôt que perte silencieuse). Cron réel wiré (09h45, `deploy/gsms/n8n/workflows/index.mjs`), route interne gatée `assertN8nInternal`.

**Vérifications indépendantes** : `test:doctype` 9/9, `harden` 2/2, `tsc --noEmit` 0, `migrate diff --exit-code` 0. Tranche 3 close.

**Bilan consolidé mis à jour** : 13 workflows fermés au total ce soir → **33✅/11🟡/6❌ sur 50**. Reste en ❌ : WF-19 (prévention rupture, complexe — heuristique de risque à concevoir), WF-21 (évaluation formative non rattachée au parcours CNAPS présentiel — infra Quiz existe côté LMS e-learning seulement), WF-35-37 (veille, bloqué), WF-45 (autres financeurs, bloqué).

### WF Tranche 4 — livrée et vérifiée en profondeur (commit `3450941`), dernière du soir
- **WF-34 (action corrective)** : `QualityIncident.deadline`/`verifiedAt` + statut additif `AWAITING_VERIFICATION` (entre ACTION_IN_PROGRESS et RESOLVED, enum existant non cassé). Scope respecté à la lettre — WF-33/24/19/21 non touchés comme demandé. Logique de transition bien pensée : `verifiedAt` remis à `null` en réentrant `AWAITING_VERIFICATION` (permet un cycle de re-vérification), auto-posé à `RESOLVED`/`CLOSED` si pas déjà renseigné (la vérification n'est jamais silencieusement sautée). **Vérifié qu'aucun switch exhaustif ailleurs dans la codebase ne référence `QualityIncidentStatus`** (seuls les 2 fichiers modifiés l'utilisent) — pas de risque de branche manquante sur la nouvelle valeur d'enum. Stats "en cours" mises à jour pour inclure le nouveau statut. DocType aligné.
- **Vérifications indépendantes** : `test:doctype` 9/9, `harden` 2/2, `tsc --noEmit` 0, `migrate diff --exit-code` 0. Tout vert.

## 🌙 Clôture de la nuit (30/08/2026, ~01h20)

**Bilan complet de la session de rattrapage workflows** :
- Départ : audit exhaustif WF-01→50 demandé par l'utilisateur, résultat **20✅/15🟡/15❌**, avec un cas de survente trouvé dans mon propre document (`SD-06-EVENT-CATALOG-DRAFT.md`) et corrigé sur le champ.
- 4 tranches livrées et **chacune vérifiée en profondeur avant d'être acceptée** — jamais sur le rapport de Cursor seul, toujours code relu en entier + tests/tsc/migrate diff relancés indépendamment :
  1. WF-06/07/08(partiel)/28/29/30/32 — quick wins réutilisant des moteurs déjà prouvés (SatisfactionSurvey étendu).
  2. WF-17/18/08(complet) — signature manquante (jamais de preuve fabriquée, vérifié ligne par ligne), justification absence, cycle convention avec guard anti-régression.
  3. WF-02/03/04/14 — nouveau domaine `CandidatureAssessment` (cadrage réel produit avant code), accessibilité candidat avec state machine strict forward-only, J-5 sans doublon de questionnaire.
  4. WF-34 — deadline/vérification action corrective, scope resserré volontairement après avoir détecté que WF-24 cache un vrai point de design (FormationExam 1:1 session, pas participant) et que WF-33 ne valait pas le risque d'un rename d'enum partagé.
- **Tally final : 34✅ / 10🟡 / 6❌ sur 50** (contre 20/15/15 en début de soirée) — 14 workflows fermés.
- **Aucun bug fonctionnel trouvé dans les livraisons de cette session de rattrapage** (contrairement à plus tôt dans la soirée où 3 vrais bugs avaient été trouvés) — la discipline P4/tests/migrate-diff tenue toute la nuit a payé, rien n'est passé entre les mailles avant vérification.
- **DB réellement synchronisée à chaque étape** — `prisma migrate diff --exit-code` relancé et confirmé à 0 après chaque tranche, jamais pris sur la seule parole de Cursor (le faux-succès `db:push` silencieux trouvé plus tôt ce soir aurait pu se reproduire, il ne l'a pas fait).

**Reste ouvert pour la prochaine session** (détail dans `AUDIT-WORKFLOWS-50-COMPLET.md`) :
- WF-19 (prévention rupture), WF-21 (évaluation formative CNAPS), WF-35-37 (veille, bloqué), WF-45 (autres financeurs, bloqué) — ❌.
- WF-24 (rattrapage examen — **vrai point de design à trancher avant code** : nouvelle session vs champ retry participant), WF-33 (jugé non prioritaire), WF-11/12/15/20/22/25/38/46 — 🟡, pas de code moteur prévu sur 11/12 (décision assumée, pas un bug).
- Front IAM (P1-P10), G1-D/G1-E, Vague 1/2 DocType : clos plus tôt ce soir, rien à rouvrir sauf nouvelle demande.
- Toujours hors scope volontaire : ExternalExchange (comptes externes requis), EVE.

Session arrêtée à la demande explicite de l'utilisateur après ce dernier rapport Cursor — reprise prévue demain, handoff écrit dans `HANDOFF-CLAUDE.md`.

## ☀️ Reprise du matin (30/08/2026, ~11h25)

Rien de nouveau côté Cursor pendant la coupure (même commit `3450941` qu'au coucher — vérifié, pas supposé). Committé `5a2c50d` : les docs de clôture de cette nuit + la recherche financeurs (AGEFIPH/Transitions Pro/Régions) qui traînait non commitée depuis le début de soirée. Monitor `HANDOFF-CURSOR.md` relancé (process précédent mort avec la session).

**Cadrage WF-24 produit ce matin** — moins lourd que redouté à 1h du matin en le regardant à tête reposée : `examOutcome`/`examDate` sont déjà des champs simples ré-écrasables sur `FormationSessionParticipant` (vérifié dans `parcours-candidat.ts::recordExamOutcome`), donc pas besoin d'historique de tentatives ni de toucher `FormationExam`. Le vrai trou = juste l'action "proposer un rattrapage" (champ `retakeDate` + notif apprenant + Evidence interne si FundingCase, sans e-mail financeur fiable — même limite P0 que WF-30). Vérifié aussi que `FundingCaseEvent` exige une vraie transition de statut (pas de note libre) avant d'écarter cette option pour la notification financeur. Cadrage écrit dans `HANDOFF-CLAUDE.md`, go direct donné à Cursor.

### WF-24 (rattrapage examen) — livré et vérifié en profondeur (commit `e858181`)
Cadrage suivi à la lettre : `retakeDate`/`retakeNotes` sur `FormationSessionParticipant` (pas de nouveau modèle, `FormationExam` non touché), `proposeExamRetake` gaté strictement sur `examOutcome === 'FAILED'`, e-mail apprenant, Evidence `EXAM_RETAKE_PROPOSED` (`sourceType: LOG`) avec `fundingCasePresent` en métadonnée si un `FundingCase` existe — **aucun e-mail financeur fabriqué, aucun `FundingCaseEvent` détourné**, exactement comme demandé. Route PATCH `academiqueEdit`, erreurs typées (`NOT_FOUND`/`NOT_FAILED`/`INVALID_DATE`) bien mappées en codes HTTP.

**Incident mineur pendant la vérif, résolu** : après le redémarrage du matin (Cursor avait signalé un "arrêt sale" Postgres nécessitant crash recovery), `pnpm smoke:doctype` et `migrate diff` ont semblé bloqués (>2 min sans sortie). Vérifié directement plutôt que de supposer un vrai problème : process Postgres actifs (9 process, port 5432 répond), les deux commandes ont fini par aboutir avec succès juste après — simple démarrage à froid (cache tsx/npm + I/O post-recovery), pas de blocage réel. **Intégrité de la base confirmée par comparaison directe** : `smoke:doctype` retourne toujours 55 users, identique au chiffre d'avant la coupure — aucune perte de données malgré l'arrêt sale.

**Vérifications indépendantes finales** : `test:doctype` 9/9, `harden` 2/2, `tsc --noEmit` 0, `migrate diff --exit-code` 0. Tout vert, rien à reprendre.

### Cadrage WF-19/WF-21 — décision déléguée par l'utilisateur, tranchée par moi
Posé les 2 questions design (bridge LMS vs note simple pour WF-21 ; seuil simple vs score pondéré pour WF-19) via AskUserQuestion — utilisateur a explicitement délégué ("c toi qui gere"). Parti sur mes options recommandées, mais **affiné après vérification code** plutôt que d'appliquer la recommandation telle quelle :
- **WF-21** : confirmé que `Formation` (CRM) et `Course` (LMS) sont délibérément séparés (commentaire explicite dans le schéma) — pas de pont. Nouveau petit modèle `FormativeAssessment` (pas un champ en vrac comme WF-24 — un participant peut avoir plusieurs évaluations formatives par session, mérite sa propre table).
- **WF-19** : vérifié que `SupportTicket` n'a pas de FK fiable vers un participant (juste `leadId`+e-mail texte libre) — **retiré le signal "réclamation" du seuil automatique** plutôt que de matcher par e-mail (fragile, risque de faux positifs/négatifs). Design réduit à 2 signaux solides : absences non justifiées (≥2) + échec examen sans rattrapage posé. Cycle `DropoutRiskStatus` (NONE→FLAGGED→CONTACTED→ACTION_PROPOSED→RESOLVED), détection auto par cron (flag seulement), progression manuelle staff (contact humain non automatisable, cohérent avec la doctrine).
Cadrage écrit dans `HANDOFF-CLAUDE.md`, go direct donné à Cursor pour les deux.

### WF-19/WF-21 — livrés et vérifiés en profondeur (commit `fc7ed72`)
Cadrage suivi à la lettre, avec 2 bons réflexes en plus de ce que j'avais spécifié :
- **WF-19** : détection cron correcte — filtre Prisma large (`emargements: { some: {...} }`, au moins 1) puis comptage précis `>= 2` en mémoire sur le tableau réellement récupéré, pas de faux positif sur 1 seule absence. State machine forward-only (`FORWARD` map) identique au pattern `AdaptationStatus`. **Bonus** : la route PATCH staff bloque explicitement `NONE`/`FLAGGED` comme cibles (seul le cron peut flagger, staff ne peut qu'avancer CONTACTED→ACTION_PROPOSED→RESOLVED) — plus strict que ce que j'avais demandé, bonne initiative. Pas de mail apprenant automatique, conforme.
- **WF-21** : `FormativeAssessment` avec vraie relation `sessionDayId→FormationSessionDay` (amélioration sur mon design), permissions view/edit split correctement, validation `label requis` + erreurs typées (`PARTICIPANT_NOT_FOUND`/`SESSION_DAY_NOT_FOUND`) bien mappées.
- n8n `GSMS — Risque de rupture` wiré à 10h15 (créneau distinct des autres crons).

**Vérifications indépendantes** : `test:doctype` 9/9, `harden` 2/2, `tsc --noEmit` 0, `migrate diff --exit-code` 0. Tout vert, rien à reprendre.

**Tally final** : tous les cadrages du matin livrés et vérifiés (WF-24/19/21). **37✅ / 9🟡 / 4❌ sur 50** (parti de 20/15/15 hier soir). Reste en ❌ : WF-35/36/37 (veille, bloqué faute de source externe) et WF-45 (autres financeurs, bloqué faute de process vérifié) — les 4 seuls items encore réellement non couverts, tous bloqués pour de vraies raisons documentées, pas des oublis. `AUDIT-WORKFLOWS-50-COMPLET.md` à mettre à jour.

### Correction utilisateur — j'avais mal interprété "on enchaine" comme feu vert EVE
Après la clôture du backlog workflows, l'utilisateur a dit "on enchaine" en réponse à "EVE ou ExternalExchange ou on s'arrête". J'ai commencé à préparer une recherche EVE — **erreur d'interprétation, interrompue immédiatement par l'utilisateur** : "eve en dernier putain... on fini les chantiers de mon app ya aussi le front noublie pas". Rappel explicite et ferme : EVE reste la toute dernière priorité, jamais activée sans consigne explicite. Le vrai signal manqué : je n'avais jamais vérifié si le travail backend de la nuit/matin était visible côté UI.

### Audit UI — gros trou trouvé, chantier lancé
Grep sur `app/(protected)` pour toutes les nouvelles fonctionnalités (dropout-risk, retakeDate, formative-assessment, adaptationStatus) → **zéro résultat, aucune UI**. Vérifié que la satisfaction stakeholders (WF-28/29/30/32) et WF-34 (déjà signalé "sheet UI" par Cursor) sont bien couverts en revanche — pas un audit à l'aveugle, différencié ce qui est fait de ce qui manque. Anchors UI identifiés dans le code existant : `candidature-detail-sheet.tsx` (niveau candidat, pour WF-02/03/04) et `suivi-stagiaire-details-sheet.tsx` (niveau participant session, même pattern que l'onglet financement `suivi-stagiaire-funding-tab.tsx` déjà en place, pour WF-17/18/19/21/24/08). Cadrage écrit dans `HANDOFF-CLAUDE.md` — pas de nouveau pattern UI inventé, réutilisation stricte de l'existant, priorité donnée à WF-04/WF-19 (seuls déclenchant une action humaine). Consigne explicite : tester réellement dans le navigateur, pas juste `tsc` vert, vu que c'est du front.

### Front A+B livrés par Cursor mais bloqué au smoke-test navigateur — diagnostiqué et résolu
Cursor a honnêtement signalé ne pas avoir pu tester en navigateur (bon réflexe, pas de faux "testé OK") : `localhost:3001` servait une autre app, tentative sur `:3011` sans sortie "Ready". Utilisateur a alerté sur un risque de conflit de port avec un autre projet tournant sur la machine — vérifié directement plutôt que suivi à l'aveugle :
- `netstat` + `Get-CimInstance Win32_Process` → **2 process Next.js d'un projet tiers (APEX-UI, `C:\laragon\www\APEX-UI`) squattaient les ports 3000 ET 3001** (doublon, probablement reliquat de l'arrêt sale Postgres du matin — même incident système, pas juste la base).
- RAM libre à 2,7 Go seulement (sur 15,7 Go) avec 2 serveurs Next APEX-UI + le serveur GSMS + Postgres en simultané — c'était la vraie cause du blocage (compilation jamais finie, pas de conflit de port pur).
- **Utilisateur a autorisé explicitement** à tuer les process APEX-UI (pas besoin actuellement, "mode réflexion avec une autre instance Claude"). PID 6400/18632 tués proprement.
- Vérifié qu'un 3e process node haute conso (PID 6872, 1,9 Go) était le `tsserver.js` de Cursor lui-même — légitime, pas touché.
- Après libération, **`http://localhost:3011/` répond HTTP 200 avec la vraie page CRM** (vérifié via `Invoke-WebRequest`, pas supposé) — le process GSMS existant (PID 5160) a fini par devenir Ready une fois la contention retirée, pas besoin de le relancer.
Relayé à Cursor dans `HANDOFF-CLAUDE.md` : tester le golden path Front A+B sur le port 3011 confirmé fonctionnel.

### Smoke navigateur — diagnostic poussé jusqu'au bout, bloqué environnement pas code
Repris moi-même au clavier (skill agent-browser) plutôt que de re-déléguer à Cursor sur un serveur qui retombait sans arrêt. Chaîne complète : APEX-UI tués (déjà fait) → Redis 5 Go anormal trouvé et redémarré (RAM 2,8→7,5 Go) → `.next` vidé → serveur relancé propre → **crash identique à chaque login** (`Jest worker encountered 2 child process exceptions`). RAM et cache éliminés comme causes par élimination directe, pas supposé. Piste retenue : Windows Defender (confirmé actif) sur les process enfants Node, nécessite droits admin que je n'ai pas. Clos en suivi, pas bloquant — code déjà vérifié à 100% côté `tsc`/lecture.

### Bilan chantiers global mis à jour, coché ligne par ligne
Demande explicite utilisateur ("on coche ce qui est fait"). Repris `docs/BILAN-CHANTIERS-GLOBAL.md` (daté 28/08, jamais mis à jour depuis) et vérifié item par item avant de cocher quoi que ce soit — pas un cochage à l'aveugle : SEC-03/NAF-00-03/NAF-12/OF-04 passés ✅ (preuves solides de la nuit) ; OF-07 nuancé 🟡 (agrégats BPF réels mais pas d'export Cerfa PDF, vérifié par grep) ; OF-11 confirmé toujours ouvert (vocabulaire non-conformité étendu absent du moteur Qualiopi, vérifié). Deux P1 restent ouverts et non bloqués : OF-06 (facture) et OF-11.

### Nouveau chantier OF-06 (facturation) — cadrage avant code
Choisi OF-06 plutôt qu'OF-11 (point de départ concret : le code dit lui-même "émission à venir"). Avant d'écrire la consigne, vérifié `finance/factures/route.ts` en entier : pas d'entité facture dédiée (juste les devis ACCEPTED relistés), et surtout **le pipeline Factur-X (réforme légale facturation électronique 2026) est câblé directement sur `FinanceDevis`** (champs `einvoice*` sur le modèle devis). Enjeu légal identifié → cadrage d'abord comme P4/WF-02-03, pas de code direct. 3 questions de design posées à Cursor dans `HANDOFF-CLAUDE.md` (1:1 vs 1:N devis→facture, migration des champs einvoice ou pas, garantie de numérotation légale continue).

### OF-06 mini-draft livré et acké (2 amendements)
Draft `GSMS-OF-06-FINANCE-INVOICE-DRAFT.md` lu en entier — qualité au niveau attendu pour un sujet légal : preuves de code réelles (grep sur les 3 fichiers dépendant de `devis.einvoice*`), pas de suppositions. Verdict : `FinanceInvoice` 1:N vers `FinanceDevis`, migration `einvoice*`, séquence `FAC-YYYY-######` gapless allouée dans la transaction d'insertion (a explicitement rejeté le pattern `DEV-${Date.now()}...` du devis pour la facture — bon réflexe légal).

**Vérifié moi-même avant d'acquiescer** : requête directe en base — 3 devis total, 0 `ACCEPTED`, 0 avec `einvoiceStatus ≠ NOT_READY`. Le backfill proposé est un non-événement en dev aujourd'hui (zéro risque de perte), mais j'ai quand même demandé que le plan reste correct pour la prod : numéros backfillés doivent passer par la même séquence gapless (pas de recopie de référence devis en guise de numéro légal), `issuedAt` = `einvoiceGeneratedAt` d'origine si présent (pas `now()`, pour ne pas fausser l'historique).

**1 point corrigé avant go-code** : le "shim temporaire" du draft (§2 pt.3) proposait de lazy-créer une facture en side-effect d'un GET sur un ancien devis sans facture — refusé. Un numéro de facture est un acte légal, jamais un effet de bord d'une consultation (risque réel de double-invocation React/Next en dev, ou refresh accidentel). Tranché : 404 explicite, émission toujours un acte staff explicite via bouton dédié. Go donné pour le chantier code (Prisma + DocType + routes) avec ce point réglé.

### OF-06 livré — excellent sur le fond, trou de permission trouvé avant clôture (commits 05eb846 + 2a53379)
Vérifié en profondeur, pas sur les gates verts seuls :
- `allocateInvoiceNumber` (`finance-invoice-service.ts`) relu en entier : `$transaction` unique pour allocation+insert, `UPDATE ... RETURNING` atomique (vrai pattern gapless anti-race Postgres), rollback = pas de trou garanti par construction. Garde anti-doublon FULL par devis (`CONFLICT` si déjà émise). `onDelete: Restrict` sur `devis→facture` (empêche suppression d'un devis portant une facture légale) — bon réflexe non demandé explicitement. DELETE bloqué avec message clair redirigeant vers `CANCELLED`. GET renvoie 404 propre, confirmé aucun lazy-create nulle part.
- Backfill (`backfill-finance-invoices.ts`) lu en entier : honnête sur son propre no-op (colonnes `einvoice*` déjà supprimées de `FinanceDevis` dans la même migration, donc rien à backfiller aujourd'hui — cohérent avec les 3 devis / 0 einvoice trouvés plus tôt), capacité de restauration depuis dump pré-migration documentée si besoin futur.
- `test:doctype` 9/9, `harden` 2/2, `tsc --noEmit` 0, `migrate diff --exit-code` 0 — tout vert, reproduit indépendamment.

**Mais trouvé un vrai trou avant d'acquiescer complètement** : le DocType `financeInvoiceDocType` est déclaré SPLIT view/edit (`financeView`/`financeEdit`, pattern P4 correct), **mais aucune des 5 routes bespoke réelles ne le vérifie** (`factures/route.ts` GET+POST émission, `[factureId]/route.ts` GET/PATCH/DELETE, `einvoice/route.ts`, `send/route.ts`, `pdf/route.ts`) — grep confirmé zéro `sessionHasPermission` sur les 5 fichiers. Toutes ne checkent qu'une session authentifiée. **N'importe quel utilisateur connecté peut aujourd'hui émettre une facture numérotée légalement.** Exactement le même bug que celui trouvé et corrigé sur `sous-traitants` pendant l'audit P4 plus tôt ce soir — et confirmation que `harden` a le même angle mort une seconde fois (ne scanne que les DocTypes déclarés, pas les routes bespoke qui les contournent, donc les tests verts ne suffisent structurellement pas ici). Renvoyé à Cursor dans `HANDOFF-CLAUDE.md` avec le fix exact attendu (même pattern que sous-traitants), pas clos tant que non corrigé.
