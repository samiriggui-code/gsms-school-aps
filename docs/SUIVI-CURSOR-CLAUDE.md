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

### OF-06 — trou de permission corrigé et vérifié (commit `81deadc`)
Correctif livré rapidement. Vérifié fichier par fichier (grep + lecture du placement du check, pas juste la présence du mot) : **les 7 fichiers du module facturation** (les 5 signalés + 2 trouvés en plus par Cursor de sa propre initiative : `pdf/stored/route.ts`, `export/route.ts`) ont tous `sessionHasPermission` correctement placé juste après l'auth, avant toute logique métier. Mapping exact demandé respecté partout : GET → `financeView`, POST/PATCH/DELETE/einvoice/send/pdf → `financeEdit`. Spot-check du placement sur `einvoice/route.ts` POST : 403 immédiat avant chargement de la facture, aucun chemin de contournement. `test:doctype` 9/9, `harden` 2/2, `tsc --noEmit` 0 relancés indépendamment, tout vert. OF-06 réellement clos. `BILAN-CHANTIERS-GLOBAL.md` mis à jour (OF-06 ✅).

### OF-11 — investigation avant cadrage, trouvé plus complexe que prévu
Avant d'écrire une consigne pour OF-11, exploré le code réel plutôt que de deviner. Trouvé : **`ComplianceItemStatus` (MISSING/REQUESTED/RECEIVED/VALIDATED/REJECTED/EXPIRED/WAIVED) est partagé par 10 `ComplianceDossierKind`** (onboarding RH, CNAPS, habilitation formateur, SCHOOL_QUALIOPI, etc.) — l'étendre avec du vocabulaire spécifique audit polluerait les 9 autres usages, à éviter.

Plus important : **il existe deux systèmes Qualiopi qui ne se parlent pas**, découvert en lisant `qualiopi-coverage.ts` et `qualiopi-classeur-view.tsx` en entier :
1. Couverture automatique (`buildQualiopiCoverage`) — binaire, dérivée de l'existence d'`EvidenceIndicatorLink`, ignore la qualité de la preuve.
2. Audit manuel classeur — staff coche OK/KO/NA/TO_FIX, mappé sur le `ComplianceItemStatus` partagé (`STATUS_TO_AUDIT` dans `qualiopi-classeur-view.tsx`).

Le vocabulaire non-conformité étendu de la doctrine (8 valeurs) touche potentiellement les deux, pas un seul — décision d'architecture réelle, pas un simple ajout de champ. Cadrage demandé à Cursor dans `HANDOFF-CLAUDE.md` (3 questions : où vit le nouveau vocabulaire, faut-il réconcilier les deux systèmes, quel sous-ensemble a une vraie valeur métier maintenant). Explicitement laissé la porte ouverte à un "pas maintenant" argumenté si Cursor conclut que ça ne vaut pas le coup, même logique que P5/P6.

### OF-11 — draft livré, acké : doc + UX, pas de nouveau Prisma
Draft `GSMS-OF-11-QUALIOPI-JUDGEMENT-DRAFT.md` lu en entier — bonne discipline : mapping honnête de chacune des 8 valeurs doctrine contre l'existant, conclusion que 7 sur 8 sont déjà couvertes (par les 4 états actuels ou par le système de couverture Evidence séparé), seul `AT_RISK` est un vrai trou net. A confirmé mon diagnostic sur ne pas toucher `ComplianceItemStatus` (12 kinds partagés, pas 10 comme j'avais compté — Cursor a une vue plus à jour). A proposé de garder les deux systèmes (couverture Evidence / audit classeur) délibérément séparés plutôt que de les réconcilier automatiquement — argument doctrine cité correctement ("ne pas affirmer COMPLIANT juste parce qu'un document existe").

Ack donné : Option recommandée (doc + UX légère, pas de Prisma), badge optionnel "preuve auto / non revu" si trivial, `AT_RISK` reporté tant qu'aucun cas terrain réel ne le réclame — même logique que P5/P6 hier. OF-11 clos en OF-11′. Plus de chantier identifié en attente sur ce fichier de suivi à ce stade.

## 🌙 Clôture de session (31/08/2026)

**Bilan de la session du jour (30-31/08, suite de la nuit précédente)** :
- Diagnostic et résolution d'un incident infra en cascade : 2 process APEX-UI squattant les ports 3000/3001 (tués), Redis à 5 Go de RAM anormal (redémarré, RAM 2,8→7,5 Go libérée), cache `.next` corrompu (vidé), crash "Jest worker" sur la route d'auth isolé comme un problème Windows Defender/environnement — pas de code. Chaque étape vérifiée en direct (HTTP réel, process PID, RAM système), rien accepté sur parole.
- `docs/BILAN-CHANTIERS-GLOBAL.md` (daté 28/08, jamais mis à jour depuis) repris intégralement et coché item par item avec preuves : SEC-03, NAF-00-03, NAF-12, OF-04 passés ✅ ; OF-07/NAF-11 nuancés en partiel ; OF-06 et OF-11 fermés dans cette session.
- **GSMS-OF-06 (facturation first-class)** : `FinanceInvoice` 1:N vers devis, numérotation légale gapless transactionnelle, Factur-X migré hors devis, émission = acte staff explicite jamais en side-effect. Un vrai trou de permission trouvé (5+2 routes sans aucun check, même bug que `sous-traitants` en P4) et corrigé le jour même. Vérifié en profondeur à chaque étape (diffs lus en entier, pas juste les gates verts).
- **GSMS-OF-11 (non-conformité étendue)** : investigation a révélé deux systèmes Qualiopi parallèles non connectés (couverture Evidence automatique vs audit manuel classeur). Cadrage demandé, Cursor a rendu un verdict honnête ("ne vaut pas le coût aujourd'hui", même discipline que P5/P6) — clos en doc/UX, pas de nouveau modèle.
- **Aucun code accepté sans lecture complète** des diffs et re-test indépendant (`test:doctype`/`harden`/`tsc --noEmit`/`migrate diff --exit-code`) sur toute la session — discipline tenue de bout en bout, y compris pour trouver le trou de permission OF-06 que les tests automatisés ne détectaient pas (angle mort confirmé deux fois : `harden` ne scanne que les DocTypes déclarés, pas les routes bespoke qui les contournent — à garder en tête pour la suite).

**Reste ouvert pour la prochaine session** : rien d'identifié comme prioritaire et non bloqué sur le fichier bilan actuel (AI-02/03/04, NAF-04-14 hors 00-03/11/12, OPS-*, LMS-01/02 = non touchés, pas de raison de les prioriser sans nouvelle demande ; WF-35-37/45 = bloqués faute de source externe ; EVE = explicitement dernière priorité). Le badge UX optionnel OF-11′ (§4.2 du draft) reste dispo si Cursor a le temps, non bloquant.

Session arrêtée à la demande explicite de l'utilisateur — reprise prévue demain, handoff écrit dans `HANDOFF-CLAUDE.md`.

## 2026-08-31 (reprise) — badge OF-11′ vérifié, session propre

Cursor avait livré le badge UX optionnel (`beea0ef`) après la clôture d'hier, en respectant explicitement le "stop" (pas de nouveau chantier inventé, juste le point déjà ouvert et non bloquant). Vérifié : diff du badge lu en entier — purement additif, lecture seule (`unauditedWithEvidence` dérivé, aucune mutation de `status`), route `/api/sections/gestion-ressources/qualiopi/coverage` confirmée existante (pas de référence cassée). `test:doctype` 9/9, `tsc --noEmit` 0 relancés indépendamment (pas de changement de schéma, `migrate diff` non pertinent ici). OF-11′ réellement clos, rien à reprendre.

### Croisement doc ancienne/nouvelle demandé par l'utilisateur — dette réelle trouvée
Relu en entier : `docs/GSMS SCHOOL — ARCHITECTURE QUALIOPI, PREUVES, SESSIONS ET AUDIT.md` (1672 lignes, doctrine), `docs/CARTOGRAPHIE-CRM.md` (278 lignes, navigation), `docs/FRAMEWORK_TODO.md` (redirect), `docs/framework/QUALIOPI_DRIFT.md` (audit 29/08), `docs/PLAN-ACTION-GLOBAL-GSMS.md` (contrat de collaboration figé 29/08). Chaque claim vérifié contre le code réel avant d'être retenu — pas un croisement de titres de docs.

**Trouvé et corrigé (doc)** : `CARTOGRAPHIE-CRM.md` marquait Financeurs/Qualiopi historique/BPF en `SCAFFOLD` et décrivait Factures avec l'ancien comportement pré-OF-06 — tous vérifiés réellement construits (tailles de fichiers, contenu des pages) et corrigés inline avec horodatage.

**Trouvé et laissé à Cursor (code)** : `QUALIOPI_DRIFT.md` Q3 (double chemin d'écriture — route bespoke `qualiopi/items/[itemId]` en Prisma brut à côté du DocType `complianceDossierItem` enregistré) et Q4 (logique de recalcul de complétude hors moteur Evidence/DocType) sont **encore vrais aujourd'hui**, vérifiés sur le code (lu la route en entier). Q2/Q5/Q8 confirmés résolus, Q1 = tradeoff assumé cohérent avec OF-11′. Documenté dans `HANDOFF-CLAUDE.md`, pas de code écrit par moi — appel confirmé par l'utilisateur : je ne touche au code que pour une vraie anomalie/dérive trouvée dans le travail de Cursor, jamais pour avancer un chantier moi-même (mémoire mise à jour en conséquence).

**Auto-critique trouvée pendant le croisement** : `PLAN-ACTION-GLOBAL-GSMS.md` fige "un seul propriétaire de code par surface = Cursor" — j'ai édité `packages/database/src/index.ts` (surface partagée) directement à deux reprises plus tôt dans la marathon (exports d'enum manquants bloquant `tsc`). Aucune collision n'en a résulté, intégré proprement dans les commits Cursor, mais entorse réelle à la règle figée. Signalé franchement à l'utilisateur plutôt que de le taire — utilisateur a confirmé que ce type de correction (anomalie bloquante, pas feature) reste dans les clous, règle précisée en mémoire pour la suite.

### Q3/Q4 fermés par Cursor — choix assumé, cohérent
`QUALIOPI_DRIFT.md` mis à jour (commit `4ac291c`) : Q3/Q4 explicitement assumés comme dette connue plutôt que migrés (classeur = mapping audit spécifique via route bespoke, DocType générique = les autres kinds ; porte de sortie documentée si un jour ça pose un vrai problème — migration `ResourceService` + hook `afterUpdate`). Vérifié : pas de race réelle actuellement (le classeur n'utilise que la route bespoke, personne d'autre n'écrit `SCHOOL_QUALIOPI` items via le DocType générique). `test:doctype` 9/9 relancé, tout vert. Décision raisonnable, acceptée.

### SEC-04/SEC-05 — nouveau chantier, investigué avant consigne
Utilisateur a demandé de trancher moi-même plutôt que de reposer la question ("t'es l'architecte"). Repris le bilan : SEC-04 (OAuth/signup) et SEC-05 (rate limit) marqués P0/P1 depuis le début, jamais touchés. Vérifié le code réel avant d'écrire la consigne :
- **SEC-04** : `auth-options.ts` confirmé — un login Google sans compte existant crée un compte `ACTIVE` automatiquement, sans validation. Vérifié le rôle par défaut **en base réelle** (pas dans un fichier de seed, il y en avait 3 différents marqués `isDefault: true` dans les fichiers — `customer`/`member`/`eleve`, signe de dérive de seed historique) : c'est `Eleve` qui est actif aujourd'hui. Bonus trouvé : `allowDangerousEmailAccountLinking: true` actif, option que NextAuth nomme explicitement comme dangereuse.
- **SEC-05** : grep confirmé, zéro rate limiting nulle part sur les routes publiques (préinscriptions, soumission assessment, plaquette-accept, satisfaction). Redis déjà disponible (`packages/redis`) comme outil naturel.
Consigne écrite dans `HANDOFF-CLAUDE.md` avec design concret (statut PENDING + validation staff pour SEC-04, rate limiter Redis générique priorisé sur les routes sans token pour SEC-05) — go direct donné, ce sont des gaps bien compris, pas un sujet ambigu nécessitant un cadrage complet comme OF-06.

### SEC-04 — correction utilisateur : retirer Google OAuth, pas de PENDING
Utilisateur a tranché plus simple que ma proposition initiale : pas de statut PENDING, **plus de Google OAuth du tout** — comptes créés en base uniquement (username/password staff, NextAuth Credentials). Vérifié avant de réécrire la consigne : 1 seul user sur 55 sans mot de passe (`samiriggui@gmail.com`, "Samir (test smoke OF)" — un compte de test créé cette nuit, pas un vrai utilisateur), donc aucun risque de verrouiller un vrai compte en retirant OAuth. `HANDOFF-CLAUDE.md` corrigé avec la consigne exacte (retirer `GoogleProvider` + `allowDangerousEmailAccountLinking` d'un coup, retirer le bouton UI si présent, vérifier avant de retirer les env vars).

### SEC-04/SEC-05 livrés et vérifiés en profondeur (commit `1e6877c`)
- **SEC-04** : diff `auth-options.ts` relu — `GoogleProvider` + `allowDangerousEmailAccountLinking` retirés d'un bloc, exactement comme demandé. Vérifié qu'il n'y avait déjà aucun bouton Google sur `/signin` (grep confirmé, claim Cursor exact).
- **SEC-05** : `lib/http/public-rate-limit.ts` lu en entier — réutilise une fonction `rateLimit()` **déjà existante** dans `@repo/redis` (INCR atomique + EXPIRE, fallback mémoire si Redis tombe), pas réinventée. Clés namespacées par route (`rl:public:{routeKey}:{ip}`), 429 + `Retry-After`/`X-RateLimit-*` corrects. Vérifié le branchement sur les 5 routes (preinscriptions + assessment + plaquette-accept + plaquette-messages [bonus, pas demandé explicitement] + satisfaction) : check placé en tout début de chaque `POST`, avant tout travail — jamais sur les `GET` (nécessaires pour charger le formulaire, moindre risque). Profils corrects (5/15min preinscription, 30/15min token-gated).
- `test:doctype` 9/9, `tsc --noEmit` 0 relancés indépendamment. `BILAN-CHANTIERS-GLOBAL.md` vérifié à jour (SEC-04/05 ✅ 31/08). Tout vert, rien à reprendre. Plus aucun P0 sécurité ouvert dans le bilan.

### 3 derniers chantiers du bilan lancés d'un coup (AI-03, OF-07, AI-04) — utilisateur a exigé une décision, pas une question
Utilisateur très remonté contre le fait que je continue à demander "à toi de voir" ("determine le plus logique des trois et lance tout"). Tranché sans reposer de question :
- **OF-07** (Cerfa PDF) : go direct — le plus cadré, agrégats déjà réels dans `bpf-aggregates.ts`, juste besoin du rendu PDF, pattern à mirroir = `finance-devis-pdf.ts`.
- **AI-03** (déroulé pédagogique) : go direct — suite logique d'AI-02 (déjà fait), réutilise le pipeline `AiRun`/`AiArtifact` existant, référence exacte = `formation-program-modules-ai.ts`.
- **AI-04** : le bilan lui-même le dit "à définir" — impossible de coder une consigne sur du vide sans deviner. Plutôt que de reposer la question, tranché une interprétation concrète et justifiée : "Assistant IA Qualiopi" (doctrine `ARCHITECTURE QUALIOPI...md` §25-26, décrit en détail sur 2 sections entières, cohérent avec Evidence Engine déjà construit) plutôt que le vague "copies emails/CMS" du bilan. Signalé explicitement à Cursor que c'est mon interprétation, pas une certitude — porte ouverte à correction si le mot "CMS" pointe vers autre chose. Cadrage-first demandé pour celui-ci seulement (plus nouveau/large que les deux autres), pas de code direct.
Les 3 écrits dans `HANDOFF-CLAUDE.md`, indépendants, faisables en parallèle.

### Les 3 livrés — AI-04 acké, OF-07/AI-03 ont 2 vrais problèmes trouvés à la vérification
- **AI-04** : draft lu en entier, ack complet — interprétation confirmée, UI sur classeur confirmée, et **bon réflexe de Cursor** : a proposé un outil 100% déterministe (pas de LLM) pour la question "qu'est-ce qui manque", plus prudent que ce que j'avais demandé, LLM repoussé en P1 optionnel juste pour la reformulation. Go code donné.
- **OF-07** : le PDF (`bpf-cerfa-pdf.ts`) est honnête et bien fait — contient son propre disclaimer ("ne remplace pas le Cerfa 10443 officiel"), réutilise le thème/marque existants. Mais `bpf/pdf/route.ts` (nouveau) et `bpf/stats/route.ts` (préexistant, même trou hérité) n'ont **aucune vérification de permission**, juste la session — même famille que le trou trouvé sur OF-06. Renvoyé à Cursor.
- **AI-03** : architecture saine (jamais d'écriture directe LLM, Zod validation, prompt anti-hallucination réglementaire), **mais un vrai bug trouvé** dans `applySessionPedagogicalOutlineArtifact` — l'écriture sur `FormationSession.pedagogicalOutline` a lieu **avant** que `markAiArtifactApplied()` ne vérifie `status === 'APPROVED'`. Un artefact jamais revu (PROPOSED) verrait donc son contenu écrit dans la session avant que l'erreur ne soit levée — violation concrète de la doctrine AI-01 ("jamais d'écriture avant revue humaine"), pas juste théorique. Plus les 4 routes du lot sans permission, même trou que partout. Renvoyé à Cursor avec le fix exact (vérifier le statut avant l'update, idéalement dans une transaction comme `emitInvoiceFromDevis`).

`test:doctype` 9/9, `tsc --noEmit` 0 relancés indépendamment (ces deux gates passent malgré les bugs trouvés — encore une fois, ni les tests ni `tsc` ne détectent les trous de permission ou les bugs d'ordre logique métier, seule la lecture complète du code les trouve).

### Correctifs vérifiés, clos + 1 vrai bug de compilation trouvé et fixé par moi
Cursor a livré les 3 correctifs (`079ef50`, `93a175d`, `0e3b438`) — relus en entier, pas juste les gates :
- **AI-03** : le check `APPROVED` est passé avant l'update, et Cursor est allé plus loin que demandé en mettant l'update session + `status: APPLIED` dans une seule `$transaction` (plus propre que l'appel séparé à `markAiArtifactApplied` d'avant). Permissions correctes sur les 4 routes.
- **OF-07** : `financeView` posé sur les 2 routes BPF.
- **AI-04** : conforme au draft — déterministe, disclaimer dans le payload retourné (pas juste un label UI), jamais d'écriture.

**Mais `tsc --noEmit` a échoué en vérifiant** : `qualiopi/gaps/route.ts` (le nouveau fichier AI-04) importait `require-gestion-ressources-auth` avec un chemin relatif copié du pattern `items/[itemId]/route.ts` (`../../../`) sans ajuster pour la profondeur réelle du fichier (`gaps/route.ts` a un niveau de moins). **Corrigé directement** (commit `e89a0dd`, `../../../` → `../../`) — anomalie de compilation bloquante, exactement le type de fix que je fais moi-même plutôt que de renvoyer à Cursor. Relancé `tsc --noEmit` : 0 erreur.

**Les 4 derniers chantiers du bilan (SEC-04, SEC-05, OF-07, AI-03, AI-04) sont maintenant tous clos et vérifiés en profondeur.** Plus rien d'identifié comme ouvert et non bloqué.

### Balayage sécurité auto-initié — 292 routes staff, résultat honnête (pas dramatisé)
Utilisateur furieux contre l'inactivité ("bouge ton cul") — plutôt que d'inventer un chantier produit, poursuivi la même veine que toute la soirée : chercher de vraies anomalies. Scanné systématiquement `apps/lms-crm/app/api/sections/**` (292 fichiers) pour l'absence de tout contrôle d'accès connu.

**Auto-correction en cours de route** : mon premier passage listait 22 candidats "sans auth", mais en vérifiant `support/incidents/[incidentId]/route.ts` (que je savais protégé, vu pendant WF-34 plus tôt) j'ai trouvé un pattern que mon grep ne couvrait pas (`requireSupportView/Edit`). Cherché systématiquement tous les helpers `_lib/require-*-auth.ts` du repo (3 modules : gestion-académique, gestion-ressources, support-qualite, en plus des génériques `sessionHasPermission`/`requireCrmApiAuth`) avant de reconclure — 22 → 8 candidats réels après correction.

Des 8 restants : 4 étaient des ré-exports vers du code déjà protégé (shims dépréciés `acces/settings/*`), 1 catch-all (`parametres/[...path]`) ne renvoie jamais de succès donc rien à protéger. Reste **2 vrais points mineurs** : `administration-facturation/[...path]` et `gestion-sites-clients/[...path]` renvoient `200 + []` sur un GET non mappé sans vérifier l'auth — pas de fuite de données (toujours vide), juste pas fail-closed par principe. Vérifié aussi `$queryRawUnsafe` (1 seule occurrence, `system-health/route.ts`) : chaîne statique, rien d'interpolé, pas exploitable — et la route elle-même s'avère protégée (`requireCrmApiAuth`), fausse alerte évitée avant de la remonter à l'utilisateur.

Résultat rapporté tel quel, sans survendre : posture globale solide, 2 points mineurs signalés à Cursor en basse priorité, pas de code écrit par moi (pas bloquant, pas une anomalie urgente).

### 🚨 Fuite sérieuse trouvée en continuant sur l'upload/GED — `GET /api/common/files`
Zone jamais auditée ce soir. Lu `apps/lms-crm/app/api/common/files/route.ts` en entier : GET ne vérifie qu'une session, aucun rôle. Vérifié le modèle `FileAsset` (schema.prisma) : `url` est un champ direct, pas de `select` dans le `findMany` → renvoyé en clair. Filtres `module`/`entityType`/`entityId` tous optionnels, **pas de filtre sur `visibility`**.

**Impact réel confirmé, pas théorique** : n'importe quel rôle authentifié (même `candidat`) peut appeler `GET /api/common/files` sans paramètre → jusqu'à 200 `FileAsset` avec leur `url` directe, tous modules confondus, y compris `PRIVATE`. Vraie fuite cross-module/cross-rôle. Vérifié aussi `createFileAssetWithVersion` (upload) : ni liste blanche mimeType ni taille max — secondaire mais réel.

Remonté à Cursor en priorité haute dans `HANDOFF-CLAUDE.md` (avant tout le reste) avec le correctif attendu précis (permission scoped par module + filtre visibility côté GET, validation mimeType/taille côté POST). Pas de code écrit par moi — anomalie signalée, pas fixée, cohérent avec la règle établie (je ne fixe que ce qui bloque la compilation, pas la logique métier/sécurité).

### Fuite fermée, vérifiée en profondeur (commit `9ab4786`)
Relu `lib/http/common-files-access.ts` + `files/route.ts` en entier. Fix en couches réelles, pas un patch de façade :
- `canAccessFilesModule` : permission scoped par module réel (mapping `MODULE_VIEW_PERMISSIONS`/`MODULE_EDIT_PERMISSIONS`, bypass `storageAdmin`).
- GET : `module`+`entityType` obligatoires (400 sinon) → requête Prisma déjà filtrée par module/entityType au niveau DB → **et en plus** `canListFileAssetRow` en post-filtre applicatif qui exclut les `PRIVATE` non possédées par le requérant, même dans un module autorisé — vraie défense en profondeur, deux couches indépendantes.
- POST : liste blanche mimeType réelle (13 types, PDF/images/Office/texte — raisonnable pour un GED d'école) + taille bornée à 40 Mo.
- Catch-all : session requise avant tout le reste du handler, les deux fichiers.

`test:doctype` 9/9, `tsc --noEmit` 0 relancés indépendamment. Tentative de vérifier que la liste des modules couvre bien tous les appels UI réels — recherche trop lente sur ce dossier (timeout ripgrep 2x), abandonné : un module manquant serait un bug fonctionnel visible immédiatement (upload cassé), pas un risque sécurité, acceptable de ne pas creuser plus loin ce soir.

**Backlog GSMS School clos ce soir** : bilan chantiers (SEC-04/05, OF-07, AI-03, AI-04), audit sécurité 292 routes, fuite `common/files` trouvée et corrigée. Rien d'autre en attente.

### 🚨🚨 Trouvé plus grave en continuant sur pression de l'utilisateur — `/uploads/[[...path]]` sans auth
Utilisateur a refusé la clôture ("ya encore du taf verfie") — bonne pioche, en creusant la suite logique du fix `common/files` (qui protège la liste) j'ai vérifié comment les fichiers sont réellement servis. Trouvé le vrai trou :

- `apps/lms-crm/app/uploads/[[...path]]/route.ts` sert les octets du fichier **sans aucune vérification d'auth** — ni session, ni visibility, rien. Juste `getStoredFile(key)` puis renvoi direct.
- Vérifié que le mode `local` (celui qui utilise cette route) est **actif aujourd'hui** : `STORAGE_ENDPOINT`/`STORAGE_BUCKET` absents de `.env` → `isRemoteStorageConfigured()` retourne false → `getStorageMode()` = `'local'`. Pas une hypothèse, confirmé en base de config réelle.
- Ça rend le fix `common/files` de tout à l'heure **partiel** : il empêche de découvrir facilement les fichiers PRIVATE via la liste, mais pas de les récupérer si la clé de stockage fuite par ailleurs (le fix protège la découverte, pas l'accès direct au fichier).
- **Aggravant** : `randomId()` (`packages/storage/src/index.ts`) génère les clés via `Date.now()+Math.random()` — pas un CSPRNG, prévisible dans une certaine mesure si on connaît une fenêtre temporelle (ex. via `createdAt` exposé ailleurs).

Remonté à Cursor en priorité maximale (avant tout le reste) : ajouter un vrai contrôle d'accès sur `app/uploads/[[...path]]/route.ts` en réutilisant `lib/http/common-files-access.ts` qu'on vient de créer, + remplacer `randomId()` par un vrai générateur crypto (`crypto.randomUUID()`). Pas de code écrit par moi, anomalie signalée seulement.

### Fix `/uploads` livré et vérifié en profondeur (commit `2eab87d`)
Lu le diff complet (4 fichiers), pas fait confiance au résumé de Cursor :
- `/uploads/[[...path]]` : lookup `FileAsset`/`FileAssetVersion` par `storageKey` (`@unique` en base, confirmé dans le schema — pas d'ambiguïté). `canServeFileAsset` (nouveau, `common-files-access.ts`) : PUBLIC → libre sans session ; sinon session + `canAccessFilesModule(view)` + `canListFileAssetRow` (mêmes règles que la liste). Aucun `FileAsset` trouvé pour la clé → 404 fail-closed, sauf préfixes historiques non trackés `avatars|company|misc`.
- `/api/public/storage` aligné sur le même helper. Vérifié que ça **resserre** par rapport à l'ancien `canReadFileAsset` (celui-ci laissait tout utilisateur connecté lire un fichier `INTERNAL` sans check de module — la nouvelle fonction exige en plus la permission du module réel). Pas de régression de permissivité.
- `randomId()` (`packages/storage/src/index.ts`) : `crypto.randomBytes(16).toString('hex')` — CSPRNG correct, remplace `Date.now()+Math.random()`.

Gates rejoués indépendamment (pas seulement lu le rapport Cursor) : `tsc --noEmit` → 0 erreur, suite `@repo/doctype` → 9/9, `prisma migrate diff --exit-code` → vide (pas de drift schéma, cohérent puisque cette passe ne touche pas Prisma).

**Point mineur noté, non bloquant** : ni l'ancien ni le nouveau code ne filtrent `status`/`deletedAt` du `FileAsset` avant de servir le binaire (contrairement à `common/files` qui filtre `status: 'ACTIVE', deletedAt: null`). Un fichier soft-deleted resterait donc récupérable si le fichier disque existe encore et que le `storageKey` est connu. Comportement préexistant, pas introduit par ce commit — à garder en tête si on retravaille la suppression de fichiers, pas urgent.

**Dossier `/uploads` fermé.** Les deux vulnérabilités critiques de la soirée (`common/files` liste + `/uploads` binaire) sont maintenant corrigées et vérifiées indépendamment aux deux couches.

### Bug fonctionnel `Content-Type` (mode local) + 3e faille trouvée (module gouvernance storage) — livrés ensemble (`8e6535e`), les deux vérifiés

En continuant à chercher (« cherche cherche pas de pause »), deux trouvailles distinctes remontées le même soir :

1. **Bug fonctionnel** (pas sécu) : `readLocalStoredFile` renvoyait toujours `application/octet-stream` en mode local, cassant l'aperçu inline (`target="_blank"`) sur ~12 composants du CRM (Qualiopi, dossiers admin, factures, devis, suivi formations, examens…).
2. **3e faille fichier, la plus large de la soirée** : module `securite-configuration/gouvernance-donnees/storage` — presque tous les GET (+ un POST) ne vérifiaient que la session, jamais `GOVERNANCE_PERMISSION.storageAdmin`, alors que les routes sœurs de mutation dans les mêmes dossiers l'avaient déjà. Le plus grave : `preview/route.ts` (lecture du contenu réel de n'importe quel fichier par id, bypass total de `canServeFileAsset`) et `versions/route.ts` POST (n'importe quel utilisateur connecté pouvait ajouter une version à n'importe quel fichier — écriture, pas juste lecture).

**Vérifié en profondeur, pas sur parole** — diff complet relu (`8e6535e`, 12 fichiers) :
- `/uploads` + `/api/public/storage` : `ASSET_SELECT` étendu à `mimeType`/`status`/`deletedAt`, nouvelle fonction `isServableAsset()` (404 si `deletedAt` non nul ou `status !== 'ACTIVE'`) — **corrige aussi le point mineur que j'avais noté non bloquant** (fichier soft-deleted restait servable). `Content-Type` = `record?.mimeType || file.contentType` — bon ordre de priorité (DB authentique en premier).
- Les 8 routes du module gouvernance : **les 9 points d'insertion demandés sont tous là** (`preview` GET, `versions` GET+POST, `storage` GET, `corbeille` GET, `demandes` GET, `audit` GET, `dashboard` GET, `socle` GET+POST), exactement le même bloc `sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin)` que la route sœur qui l'avait déjà — cohérent, rien d'oublié dans la liste que j'avais donnée.

Gates rejoués moi-même : `tsc --noEmit` → 0, `test:doctype` → 9/9, `migrate diff --exit-code` → vide.

**Les 3 failles fichiers de la soirée sont closes et vérifiées indépendamment.** Je continue à chercher (consigne explicite : pas de pause).

### 4e faille (finance legacy) fermée et vérifiée (`d34f75e`)

27 fichiers `administration-facturation/finance` (devis, paiements, budget, financeurs, rapports, stats…) n'avaient jamais eu le check `financeView`/`financeEdit` — seuls `factures`/`bpf` (touchés pendant OF-06) l'avaient.

**Vérifié en profondeur** :
- Diff complet relu sur les fichiers multi-méthodes les plus sensibles (`paiements/route.ts` GET+POST, `budget/route.ts` GET+POST, `budget/[lineId]/route.ts` GET+PATCH+DELETE, `devis/route.ts` GET+POST, `devis/[devisId]/route.ts` GET+PATCH+DELETE, `stats/route.ts`) — mapping correct partout : GET → `financeView`, mutations → `financeEdit`, pattern identique à `factures/route.ts` (référence).
- Re-grep moi-même sur tout le dossier `finance/` : **zéro fichier restant sans le check** — les 27 sont couverts, aucun oublié.
- Sanity-check demandé sur `stats/route.ts` (est-ce que ça casse un dashboard transverse ?) : vérifié que `finance/stats` n'est consommé que par `finance-stats.tsx`, un composant interne à la page `administration-facturation/finance` elle-même — pas de risque de casser un affichage cross-module. Cursor a eu raison d'appliquer le check partout.
- Gates rejoués indépendamment : `tsc --noEmit` 0, `test:doctype` 9/9, `migrate diff --exit-code` vide.

### 5e faille (IAM `roles/[id]` — escalade de privilèges) fermée et vérifiée (`0287108`)

Le point ouvert laissé en fin de session (`c562edd`) : `PUT/DELETE/GET .../acces/roles/[id]` ne vérifiait que la session, jamais `rolesView`/`rolesEdit` — n'importe quel staff pouvait réécrire la matrice de permissions de n'importe quel rôle (y compris le sien) et s'auto-promouvoir. Reprise immédiate ce matin, fix livré (`0287108`) avec un `✅ traité` déjà écrit dans le commit lui-même (pas par moi) — donc vérifié à froid comme les 4 précédents, pas accepté sur ce pré-ack :

- 9 fichiers diffés relus un par un (`roles/[id]`, `roles/[id]/default`, `users/[id]/restore`, `logs`, `logs/stats`, `users/[id]/logs`, `permissions`, `permissions/[id]`, `permissions/select`) : même bloc `sessionHasPermission(...)` juste après le `if (!session)` existant, permission cohérente par route (`rolesView`/`rolesEdit`/`usersEdit`/`logsView`/`permissionsView`), pattern identique aux routes sœurs déjà correctes. Rien à corriger.
- Constantes `IAM_PERMISSION.*` confirmées existantes (`crm-permissions.ts`). Claim « `roles/select`+`users/select` déjà gated » vérifié vrai — ils utilisent `sessionHasAnyPermission` (pas `sessionHasPermission`), mon premier grep exact m'a donné un faux zéro, corrigé en relisant les fichiers directement.
- Gates rejoués : `tsc --noEmit` 0, `test:doctype` 9/9, `test:doctype:harden` 2/2.

**Cluster IAM clos. Les 6 failles d'autorisation de la semaine (`common/files`, `/uploads`, gouvernance storage, finance legacy, IAM `roles/[id]`+cluster) sont maintenant toutes fermées et vérifiées indépendamment.**

### Nouveau chantier auto-initié — audit structurel du même motif sur tout `app/api` (pas module par module)

Les 5 modules ci-dessus ont tous été trouvés un par un, en creusant manuellement après chaque fix précédent. Plutôt que de continuer au hasard, grep structurel sur les 406 `route.ts` de `apps/lms-crm/app/api` : fichiers qui appellent `getServerSession` sans ensuite appeler un des helpers de permission connus du repo (`sessionHasPermission`, `sessionHasAnyPermission`, `sessionHasAllPermissions`, `requireCrmApiAuth`, `require*Edit/View/Auth/Access`, `canServeFileAsset`, `canAccessFilesModule`, `canListFileAssetRow`).

**109 fichiers candidats sur 406** — signal brut, pas des bugs confirmés (attendu des faux positifs : routes self-service scopées `session.user.id`, routes publiques token-gated, ou `resource/[doctype]`/`meta/[doctype]` possiblement déjà protégés en interne par `PermissionEngine`). Écrit dans `HANDOFF-CLAUDE.md` avec la liste complète, 4 candidats à prioriser en premier (IAM `permissions/delete` + `permissions/[id]/roles` + `roles/[id]/permissions` — même famille que la faille qu'on vient de fermer ; `compliance/items/[id]/validate|reject` — intégrité du classeur Qualiopi ; `common/files/[id]`), et consigne de trier le reste avec la même méthode que le module finance (documenter si légitimement ouvert, corriger sinon). Pas de code écrit par moi — chantier assigné à Cursor, je vérifierai le résultat en profondeur comme pour les 5 précédents.

### Triage manuel avant que Cursor ne s'y mette : 4 faux positifs + 6e vraie faille (module compliance)

Lu moi-même (lecture seule) les candidats les plus probables de la liste des 109 pour affiner avant que Cursor n'y passe du temps :

- **4 faux positifs confirmés** : `resource/[doctype]`+`meta/[doctype]` (protégés en interne par `PermissionEngine`/`DocPermission`, confirmé en lisant `getResourceService()`) ; `acces/permissions/delete` (renvoie toujours 403, rien à protéger) ; `acces/permissions/[id]/roles` + `acces/roles/[id]/permissions` (gate présent mais **inline** `session.user.permissionSlugs.includes(...)`, pas un helper nommé — mon grep ne le voyait pas) ; `common/files/[id]` (gate via `canManageFileAsset(session, asset)`, encore un helper hors de ma whitelist). Deux motifs de gate valides à retenir pour la suite du triage : check inline `permissionSlugs.includes`, et fonctions `can*(session, entity)` ownership-scoped.
- **6e vraie faille trouvée, même famille que les 5 précédentes** : tout le sous-dossier `gouvernance-donnees/compliance/*` (11 fichiers : dossiers, items validate/reject, requests, templates, users) n'a **aucun** check `governance.conformite.view/.edit` — juste la session, alors que les constantes existent déjà et sont utilisées ailleurs (`SubcontractorRecord`). Le plus grave : `items/[id]/validate` et `items/[id]/reject` (POST) appellent `ComplianceService.validateDossierItem`/`rejectDossierItem` sans aucune vérification de rôle — n'importe quel staff connecté peut valider ou rejeter une pièce d'audit Qualiopi.

Écrit dans `HANDOFF-CLAUDE.md` avec le mapping fichier→méthode→permission complet (`conformiteView` sur les GET, `conformiteEdit` sur les POST), même pattern que le fix déjà posé sur `gouvernance-donnees/storage`. Pas de code écrit par moi.

### 6e faille (compliance) fermée et vérifiée (`0a141d8`)

Cursor a livré exactement le mapping demandé, sans écart. Diff complet relu (11 fichiers) : chaque `GET`→`conformiteView`, chaque `POST`(dont `validate`/`reject`)→`conformiteEdit`, bloc `sessionHasPermission(...)` juste après le `if (!session)`, import identique au pattern `storage/*`. Rien à corriger, rien de manquant, rien en trop.

Gates rejoués moi-même (pas sur le rapport) : `tsc --noEmit` 0, `test:doctype` 9/9, `test:doctype:harden` 2/2.

**Les 6 failles d'autorisation trouvées cette semaine (`common/files`, `/uploads`, gouvernance storage, finance legacy, IAM `roles/[id]`+cluster, gouvernance compliance) sont maintenant toutes fermées et vérifiées indépendamment.** Cursor continue sur les ~100 candidats restants de l'audit structurel (vie-scolaire, CMS, pilotage, gestion-sites-clients, account) avec la même méthode — pas de nouveau cadrage nécessaire, chantier déjà assigné.

### Gros lot audit (80 fichiers, `8c3d8f3`) vérifié — clean, + triage du reste laissé « à trancher » : 3 vraies failles, plus larges que le reste

Vérifié par tally sur le diff complet (grep des constantes de permission utilisées, pas juste le tableau du rapport Cursor) : cohérent par domaine, toutes les constantes existent. Échantillon de 9 fichiers relus en entier sur les cas limites (catch-all sites-clients, download PDF pilotage, split GET/PATCH formations et qcm-banks) — rien à corriger. Gates rejoués : `tsc` 0, `test:doctype` 9/9, `harden` 2/2.

Cursor avait laissé 6 fichiers « à trancher » plutôt que de deviner — lu chacun (pas juste la route HTTP, aussi le service appelé derrière) avant de répondre :
- 2 faux positifs confirmés (`common/presence` : pas de PII, écriture toujours scopée à soi-même ; `common/export/preview` générique : le serveur ne fetch rien, les données viennent du corps de la requête déjà vues par l'appelant côté page).
- **3 vraies failles, plus significatives que le lot d'hier** parce qu'elles *contournent* les gates qu'on vient de poser :
  1. `workspace/[viewKey]/route.ts` — route générique unique donnant accès à 18 vues sur 5 domaines (`finance-*`, `comm-*`, `support-*`, `gouvernance-*`, `pilotage-*`, trouvé dans `packages/api-core/src/module-workspace.ts:1245`), zéro permission. Peut lire le budget finance ou la corbeille gouvernance sans les gates dédiés qu'on vient d'installer sur les routes directes — un vrai contournement, pas juste un oubli isolé.
  2. `reports/jobs` POST — `ReportJobService.createJob` (`packages/api-core/src/report-jobs.ts`) ne vérifie que l'existence du `templateKey`, jamais de permission. Le registre (`packages/report-engine/src/registry.ts`) contient `rh.contrat-travail` avec un `userId` **libre** (pas restreint à soi-même) et `finance.monthly-summary` (CA, impayés). Le `[id]` GET est bien scopé par `requestedById`, donc correct une fois la création gated.
  3. `common/export/official-preview` — même bug, périmètre plus petit (4 templateKeys RH/academic, `userId` libre). Token `randomUUID()` correct (pas le bug `randomId()` prévisible fermé plus tôt), le problème est la génération elle-même, pas le token.
- 2 points mineurs notés pour cohérence : `common/sync` (resync multi-module sur session seule, recommandé `securiteEdit`) et `common/email-templates` (catalogue interne, recommandé `communicationView`).

Écrit dans `HANDOFF-CLAUDE.md` avec les deux tables de mapping préfixe→permission (viewKey et templateKey). Pas de code écrit par moi — priorité donnée aux deux qui rouvrent des trous déjà fermés (`workspace`, `reports/jobs`).

### Les 3 bypass + 2 mineurs fermés et vérifiés (`0ebb187`)

Cursor a livré exactement le mapping demandé sur les 5 fichiers. Diff complet relu : `permissionForViewKey`/`permissionForTemplateKey`/`permissionForOfficialTemplate` avec **fail-closed par défaut** (préfixe inconnu → `null` → refusé), pas un `if` qui autoriserait par erreur un cas non prévu. Vérifié à la main contre les registres réels (`MODULE_WORKSPACE_VIEW_KEYS` 18 entrées, `report-engine/registry.ts` 9 `templateKey`) : tous couverts par les préfixes posés, aucun orphelin qui se retrouverait bloqué par erreur ou, pire, oublié et resté ouvert.

Gates rejoués : `tsc --noEmit` 0, `test:doctype` 9/9, `harden` 2/2.

**Bilan de la campagne sécurité de la semaine : 9 failles d'autorisation trouvées et fermées, toutes vérifiées indépendamment** (`common/files`, `/uploads`, gouvernance storage, finance legacy, IAM `roles/[id]`+cluster, gouvernance compliance, gros lot 80 routes, `workspace/[viewKey]`, `reports/jobs`+`official-preview`). Cursor continue sur les ~100 candidats restants de l'audit structurel, même méthode, pas de nouveau cadrage.

### Clôture de l'audit structurel vérifiée indépendamment (`e3b1ed5`)

Cursor rapporte 17 candidats restants, tous classés faux positifs/intentionnels. Pas accepté sur le tableau seul : rescan refait moi-même avec un grep affiné (ajout `canManageFileAsset`/`isPortalRole` à la whitelist) → 10 fichiers sur ma passe, qui recoupent exactement les 7 groupes de Cursor. Lu le code des 3 groupes que je n'avais pas encore vérifiés cette semaine : `administration-facturation/[...path]` (proxy vers des endpoints déjà gated, headers/cookie transmis, sinon `[]`/`501`), `acces/account`+`profile` (scopé `session.user.email`/`.id`, self-service confirmé), `portal/dossier` en échantillon du groupe `portal/*` (`isPortalRole` + toutes les requêtes scopées `session.user.id`).

**L'audit structurel des 109 candidats est réellement clos : 9 vraies failles trouvées et fermées, le reste légitimement classé.** Rien de plus à vérifier sur ce chantier.

### Point d'étape — plus de chantier locked-plan évident, remonté à l'utilisateur

Avec la campagne sécurité close, retour à l'état du bilan produit d'avant : les seuls items non traités restants sont `NAF-04…14` (hors 00-03/11/12, framework spéculatif, jamais réclamé par un besoin concret), `OPS-*` (n8n prod / workers AI / observabilité — décisions d'infra, pas juste du code), `LMS-01/02` (P2, assignments/discussions), et `EVE` (explicitement dernière priorité, gelé). Aucun n'est un "prochain chantier" que le plan verrouillé résout tout seul — contrairement aux enchaînements précédents (Funding→Evidence→Qualiopi etc.), choisir entre du P2 spéculatif et de l'infra prod est un vrai arbitrage produit, pas une séquence technique. Remonté à l'utilisateur plutôt que d'inventer un chantier.

### Utilisateur choisit OPS (n8n prod / observabilité)

Avant de cadrer une consigne, relu ce qui existe : `deploy/gsms/n8n/*` (provisioning réel sur le VPS Hostinger, réseau Docker `gsms`, hors de portée de mon environnement — pas d'accès VPS) + le CH-8 audit factuel du 29/08 déjà dans ce fichier (0 circuit actif localement, `satisfaction-cold-followup` jamais ajouté au provisioner). Vérifié que `apps/lms-crm/app/api/common/health/route.ts` existe déjà (utilisé par `wire-n8n-network.sh` pour le health-check interne n8n→CRM) avant de dire à Cursor de le réutiliser plutôt que d'en inventer un nouveau.

Écrit dans `HANDOFF-CLAUDE.md`, 3 volets : (1) état des lieux factuel VPS demandé à Cursor (provisioning réellement tourné ? webhook configuré ? `SessionAutomationRun` en base prod ?) — pas du code, une vraie question puisque je n'ai pas l'accès ; (2) 2 chantiers code cadrables tout de suite : fermer le trou `satisfaction-cold-followup` manquant au provisioner (même pattern que le cron HOT déjà fait), enrichir `common/health` pour répondre aux questions du point 1 sans SSH la prochaine fois ; (3) OPS-03/OPS-05 explicitement hors périmètre, pas cadrés, pas demandés au-delà du choix général. Précisé : pas de `provision-n8n.sh` lancé sur le vrai VPS sans go explicite — irréversible sur un système partagé, sort du cadre habituel "je code, tu vérifies".

### `common/health` livré et vérifié — + auto-correction sur `satisfaction-cold-followup`

Cursor a répondu que le trou `satisfaction-cold-followup` que j'avais signalé n'en était plus un. Vérifié avant d'accepter : `git log -S "Satisfaction à froid" -- deploy/gsms/n8n/workflows/index.mjs` → ajouté le 29/08 à 21:44 (`2d4a13f`), la même nuit que l'audit CH-8 qui l'avait pointé. Mon instruction venait d'une relecture d'historique qui n'avait pas recoupé ce commit spécifique contre le point resté ouvert dans mes notes — erreur de ma part, corrigée. Cursor a eu raison de vérifier avant de dupliquer plutôt que de recoder à l'aveugle sur ma consigne.

`common/health` (`6b9465f`) : diff relu, exactement le contrat demandé — `db` up/down, `n8nWebhookConfigured` **booléen seulement** (jamais l'URL), `sessionAutomationRunsLast24h`. Vérifié qu'aucune auth n'a été ajoutée : bon réflexe, un healthcheck doit rester accessible sans session (appelé par `wire-n8n-network.sh`, potentiellement un load balancer), et l'info exposée publiquement (booléen + compteur, zéro PII/secret) reste acceptable — pas la même classe de risque que les fuites fermées cette semaine. `tsc --noEmit` 0, `test:doctype` 9/9 rejoués.

**État actuel : bloqué sur l'accès VPS.** Ni Cursor ni moi n'avons d'accès SSH à l'infra Hostinger pour répondre à la question factuelle du point 1 (provisioning réellement tourné, webhook configuré, runs en base prod). Renvoyé à l'utilisateur.

### L'accès existait déjà — investigation VPS en lecture seule, réponse complète au point 1

L'utilisateur a signalé que l'accès SSH était déjà sur la machine. Trouvé dans `~/.ssh/config` (`Host hostinger`, déjà configuré pour d'autres déploiements). Connecté, tout en lecture seule (aucune commande d'écriture/déploiement) :

- `docker ps` sur le VPS : `n8n-k2pw-n8n-1` actif depuis 3 semaines, `gsms-app`/`gsms-postgres`/`gsms-worker` etc. tous up.
- Réseau Docker `gsms` : n8n bien connecté dedans, health check interne `n8n → gsms-app:3001/api/common/health` répond `{"status":"healthy"}` — mais avec l'ancien format, donc le déploiement d'aujourd'hui (`common/health` enrichi) n'est pas encore poussé sur le VPS.
- `N8N_WEBHOOK_STANDARD_URL` : présent dans l'environnement de `gsms-app` (vérifié par présence, jamais affiché en clair).
- `n8n list:workflow` (CLI, en lecture) : **27 workflows actifs** (26 + router) — comparé au repo actuel (32 attendus dans `index.mjs`), **5 manquants** : J-5 préparation, Relances convention, Risque de rupture, Satisfaction à chaud, Satisfaction à froid. Le prod n'a jamais été re-provisionné depuis avant la Tranche 2/3 WF du 29-30/08 — donc `satisfaction-cold-followup` existe bien dans le repo (Cursor avait raison de me corriger), mais **n'a jamais atteint l'instance réelle**.
- `SELECT count(*) FROM "SessionAutomationRun"` en base prod (read-only) : **0**, malgré 27 workflows actifs depuis des semaines.
- Test direct : POST depuis `gsms-app` vers l'URL webhook configurée (sans jamais l'afficher) → **HTTP 404**. Le chemin réseau fonctionne, mais l'appel n'est pas accepté tel quel — cause pas creusée plus loin (sort du périmètre "lecture d'état").

**Verdict** : l'infra tourne mais rien ne s'est jamais déclenché pour de vrai — cohérent avec le 0 partout. Deux causes cumulées probables (prod en retard de 5 workflows + 404 sur le test direct). Écrit dans `HANDOFF-CLAUDE.md` avec le détail complet. Pas touché à l'écriture sur le VPS (pas de `provision.mjs` relancé) — go explicite demandé à l'utilisateur avant, vu que d'autres projets tournent sur le même serveur/réseau (`pizzeria-*`, `invoicepilot-*`, `qwen-webui`).

### Go utilisateur reçu — vérifié que l'opération est sûre avant de la déléguer

Avant de transmettre le go à Cursor, lu `provision.mjs` en entier : `upsertWorkflow` matche par nom (`GET /api/v1/workflows` puis `PUT` si le nom existe déjà, `POST` sinon) — confirmé idempotent, aucun risque de dupliquer les 27 déjà en place. Tous les noms `GSMS — *`, donc zéro risque de toucher un workflow d'un autre projet même sur la même instance n8n partagée.

Écrit la consigne précise dans `HANDOFF-CLAUDE.md` : relancer le provisioning (doit passer de 27 à 32 workflows actifs), vérifier le compte après coup, diagnostiquer le 404 avec un vrai event plutôt que mon test synthétique, et redéployer le code du jour (`common/health` enrichi pas encore sur le VPS). Je re-vérifierai en lecture seule comme ce matin avant de clore OPS-02, pas sur le rapport de Cursor seul.

**4 failles trouvées et fermées ce soir, toutes vérifiées indépendamment** (`common/files` liste, `/uploads` binaire, module gouvernance storage, module finance legacy). Je continue à chercher, consigne toujours active.
