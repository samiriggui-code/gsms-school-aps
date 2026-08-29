# Handoff Cursor → Claude

Cursor écrit ici (nouvelle entrée datée en haut) : fin de chantier, question, blocage, décision à trancher. Claude surveille ce fichier en direct pendant la session et relaie à l'utilisateur.

---

## 2026-08-29 — P5/P6 Option A : doctrine only

`PERMISSION_AUDIT.md` : P5 → **P5′ reporté** ; P6 → **P6′ mitigé app-layer** (`instructor-access.ts`). Pas de touche moteur.

### Où en est le framework (réponse à ta question)

| Item | État |
|---|---|
| **G1-D** | ✅ Clos (flag ON, smoke, tests) |
| **G1-E** | ✅ Clos (legacy `ENTITY_REGISTRY` / `lib/framework` supprimés ; build vert confirmé des deux côtés) |
| **Vague 1 DocType** | Terminée |
| **IAM audit P1–P6** | Clos pour ce soir (P4 code `b3d6622` ; P5/P6 docs only) |
| Hors scope volontaire | WF-35–37, ExternalExchange, EVE |

Rien d’urgent côté code Cursor — idle jusqu’à prochaine consigne.

---

## 2026-08-29 — P4 commité + draft P5/P6 (attente ack)

### Commit P4

`b3d6622` — `fix(iam): DocPerm P4 declarations for SystemLog, FundingCase, SubcontractorRecord`

### Draft P5/P6

[`docs/framework/P5-P6-PERMLEVEL-RECORD-DRAFT.md`](framework/P5-P6-PERMLEVEL-RECORD-DRAFT.md)

**Verdict :**
- **P6** besoin formateur/session **réel** mais **déjà mitigé** : rôle `formateur` → `/formateur` + `assertInstructorOwnsSession` / `trainerUserId` (pas `crm.academique.*`). `ifOwner`/`condition` typés, **non lus** par `hasPermission`. `ownerField` = set-on-create only.
- **P5** : `permlevel` partiellement runtime (`buildMetaResponse`) ; **aucun** usage métier déclaré → reporter.

Reco Cursor : **option A reporter** (évent. note doctrine) ; option B = brancher `condition` FormationSession après ack.

Pas de code sur `permission-engine.ts`.

---

## 2026-08-29 — P4 C→B→A2 livrés (ack)

Pas de touche `permission-engine.ts`. Déclarations + IAM + API RH.

| Item | Détail |
|---|---|
| **C** SystemLog | `read` seul (`iam.logs.view`) |
| **B** FundingCase | create/write = `crm.finance.edit` ; **delete** = `crm.securite.edit` |
| **A2** SubcontractorRecord | read = conformite.view ; create/delete = ressources.edit ; **write** = `governance.conformite.edit` |
| API | GET view · POST ressources.edit · PATCH conformite.edit |
| Doctrine | `PERMISSION_AUDIT.md` P4 → P4′ · draft §7 |

### Seed `governance.conformite.edit` (jugement)

| Rôle | Motif |
|---|---|
| **admin** | a déjà conformite.view + édition large |
| **collaborateur** | a conformite.view sans ressources.edit → valide ST / pièces sans créer la fiche |
| manager | ressources.edit sans conformite.view → crée, ne valide pas (volontaire) |
| superadmin | `*` inchangé |

**Vérifs :** `test:doctype` 9/9 · harden 2/2 · `tsc --noEmit` **0**

Fichiers clés : `domains/audit|funding|organisation/doctypes.ts`, `crm-permissions.ts`, `permission-domains.ts`, `permissions.js`, `crm-role-permissions.js`, routes `sous-traitants`.

---

## 2026-08-29 — P4 DocPerm : design (pas de code engine)

**Verdict :** `PermissionEngine` + `DocPermission` gèrent déjà read/write/create/delete avec slugs distincts. `protectRoute` mappe HTTP → `DocAction` + `hasPermission`.

Inventaire bootstrap : **29/30 SPLIT** view≠mutate ; seul `SystemLog` SAME (`iam.logs.view` aussi sur mutate).

`PERMISSION_AUDIT.md` P4 est **périmé** (ère ENTITY_REGISTRY).

Draft : [`docs/framework/P4-DOCPERM-ACTIONS-DRAFT.md`](framework/P4-DOCPERM-ACTIONS-DRAFT.md)

Candidats (déclarations, pas engine) :
1. **SystemLog** — retirer write/delete sous `logs.view`
2. **FundingCase** — restreindre `delete` (cancel métier suffit)
3. **SubcontractorRecord** — optionnel `governance.conformite.edit` (ack IAM)

**Attente ack Claude** sur les 3 décisions §6 du draft avant tout code.

---

## 2026-08-29 — backlog committé (8 commits sujets)

Depuis `64b4621`, commits séparés (pas un blob) :

| SHA (court) | Sujet |
|---|---|
| `987f6b7` | feat(organisation): WF-39 subcontractors + WF-40 disability referent (+ UTF-8 schema comments) |
| `f3a4e6a` | feat(conformite): OF compliance dashboard |
| `2d4a13f` | feat(n8n): satisfaction cold + hot followup crons |
| `a279a68` | test(doctype): harden fail-open renforcé |
| `469d8ce` | chore(qualiopi): Evidence backfill script |
| `b502881` | feat(funding): EDOF LHEO + checklists EDOF/OPCO/FT |
| `6f66e16` | feat(lms): admin cours/inscriptions + LmsChapter |
| `eca935e` | docs: HANDOFF + SUIVI |

Hors liste Claude-5 : EDOF/LMS aussi dans le backlog — inclus en commits 6–7.

**Exclus (volontaire)** : `.tmp-*.txt`, dumps PDF/JSON/xlsx recherche, docs VISIO/HERMES hors chantier.

Prêt pour prochain chantier Claude (financeurs non vérifiés / P4–P6).

---

## 2026-08-29 — nettoyage encodage `schema.prisma`

Mojibake commentaires (`é`→`Ã©` / double `ÃÂ©`) corrigé **ligne par ligne** uniquement si motif mojibake (`Ã` / `Â.` / `â€`) — pas de re-encode aveugle du fichier entier (préserve les accents déjà corrects, ex. WF-40).

| Métrique | Valeur |
|---|---|
| Lignes corrigées | **128** |
| `Ã` restants | **0** |
| Méthode | `Buffer.from(s, 'latin1').toString('utf8')` itéré (jusqu’à 5×) |

Ex. avant → après : `piÃÂ¨ces` → `pièces` ; `lÃ¢ÂÂÃÂ©cole` → `l’école`.

**Vérifs :** `prisma validate` ✅ · `migrate diff --exit-code` **0** · `test:doctype` **9/9** · `tsc --noEmit` **0** · `test:doctype:harden` **2/2**

Aucun changement de modèles / enums — commentaires seulement.

---

## 2026-08-29 — audit permissions DocTypes (régression fail-open)

**Résultat : 0 trou fail-open** — aucun `role: '*'` sans `requires.anyPermissionSlugs` / `allPermissionSlugs` sur le bootstrap CRM réel.

### Inventaire (30 DocTypes)

| Module | DocTypes |
|---|---|
| core.iam | User, Role |
| crm | Candidature, Company, Contact, FinanceDevis, Lead, TrainingRequest |
| training | Formation, FormationSession, FormationSessionParticipant, FormationVenueRoom |
| funding | FundingCase, FundingDocument, FundingProvider |
| documents | DocumentRequest, DocumentRequirementTemplate, FileAsset |
| quality / qualiopi | ComplianceDossier, ComplianceDossierItem, QualityIncident, SatisfactionSurvey |
| evidence | Evidence, EvidenceIndicatorLink |
| organisation | SubcontractorRecord |
| rh / lms / audit | LeaveRequest, LmsCourse, LmsChapter, LmsEnrollment, SystemLog |

### Test régression

Renforcé `apps/lms-crm/scripts/harden-doctypes.test.ts` (pas `vague2-harden` : mini-graphe Vague 2 ne couvre pas Funding/Organisation — le harden CRM est le bon filet) :

- Scan générique `failOpen[]` → assert length 0
- Module `organisation` requis
- Seuil `≥ 27` DocTypes
- Samples ajoutés : `SubcontractorRecord` (`governance.conformite.view`), `SatisfactionSurvey` (`crm.academique.view`)

Inventaire one-shot : (script retiré — scan intégré dans `harden-doctypes.test.ts`)

**Vérifs :** `pnpm test:doctype:harden` **2/2** · inventaire `failOpenCount: 0`

Rien à corriger côté permissions — discipline `requires` tenue sur tout le lot de la soirée. P4–P10 (DocPerm fin, permlevel, row-level) hors périmètre, inchangés.

---

## 2026-08-29 — backfill Evidence Qualiopi (one-shot)

Script : `apps/lms-crm/scripts/backfill-qualiopi-evidence.ts`  
(`pnpm -C apps/lms-crm exec tsx --env-file=…/.env ./scripts/backfill-qualiopi-evidence.ts`)

### Résultat local `lms_solo` (1 run)

| Métrique | Valeur |
|---|---|
| Items SCHOOL_QUALIOPI VALIDATED/WAIVED | **1** |
| Backfillés | **1** |
| Déjà liés | 0 |
| Couverture avant | **0 %** (0/32) |
| Couverture après | **3 %** (1/32) |

`metadata: { backfilled: true, backfilledAt }` + `eventName: COMPLIANCE_ITEM_STATUS_CHANGED` + link indicateur via `recordStatusEvidence`. Pas de route API.

**Vérifs :** `test:doctype` 9/9 · `tsc --noEmit` **0**

---

## 2026-08-29 — WF-27 HOT cron quotidien livré (ack point 4)

Choix Claude : cron quotidien, pas de hook jFin.

| Surface | Chemin |
|---|---|
| API | `GET /api/internal/n8n/cron/satisfaction-hot-followup` — sessions `endDate` = hier → `ensureSurveysForSession` → invite HOT `PENDING` |
| Catalogue | `crm.satisfaction.hot.followup` |
| n8n | `GSMS — Satisfaction à chaud` — cron `30 10 * * *` (après froid 10h) |

Jalon jFin circuit `default` : **inchangé** (notify only). Coexistence OK.

**Vérifs :** `test:doctype` 9/9 · `tsc --noEmit` **0**.

---

## 2026-08-29 — CH-8 trou 2 : satisfaction-cold branché + draft jFin

### Point 2 — livré

| Surface | Changement |
|---|---|
| n8n provisioner | `GSMS — Satisfaction à froid` dans `deploy/gsms/n8n/workflows/index.mjs` — cron `0 10 * * *` → GET `…/cron/satisfaction-cold-followup` → dispatch digest |
| Catalogue | événement `crm.satisfaction.cold.followup` dans `standard-catalog.ts` (requis par `/api/internal/n8n/dispatch`) |

Pas dans le router webhook (cron autonome, comme RH/équipements). Re-provision n8n nécessaire en env pour activer.

### Point 4 — mini-draft (pas de code)

[`docs/framework/WF-27-JFIN-SATISFACTION-DRAFT.md`](framework/WF-27-JFIN-SATISFACTION-DRAFT.md) — CRM possède create+`sendSurveyInvite` HOT ; n8n appelle un endpoint (hook jFin **ou** cron « fin session hier »). Attente ack Claude.

Points 1 et 3 : ack, rien à coder.

**Vérifs :** `test:doctype` 9/9 · `tsc --noEmit` (voir sortie).

---

## 2026-08-29 — CH-8 audit n8n vs WF doctrine (factuel, pas de code)

Périmètre : `SessionAutomationRun` en base locale + config env + circuits provisionnés dans `deploy/gsms/n8n` + croisement avec les WF « déclenchables » déjà livrés ce soir. **Pas d’accès à une instance n8n live** (aucune URL webhook dans `.env` local).

### 1. Ce qui est réellement actif (local `lms_solo`)

| Signal | Résultat |
|---|---|
| `SessionAutomationRun.count()` | **0** (aucun circuit jamais enregistré) |
| `N8N_WEBHOOK_STANDARD_URL` / `N8N_WEBHOOK_BASE` | **absent** |
| `N8N_WEBHOOK_*_SECRET` | **absent** |
| `WORKFLOWS_N8N_STANDARD_ENABLED` | unset (donc webhook standard **off** faute d’URL — `resolveStandardWebhookUrl()` → null) |

**Verdict local :** 0 circuit n8n actif. Les `workflows.emit(...)` côté CRM no-opent le dispatch HTTP standard.

### 2. Circuits n8n **provisionnés en code** (pas prouvé « actifs » en prod)

Source : `deploy/gsms/n8n/workflows/index.mjs` + `circuits/default.json`.

**26 sous-workflows + 1 router** `GSMS — Router événements` (webhook path `gsms/standard`) :

Acquisition · Circuit session · Finance multi-financeurs · Post-examen · Attestation · Finance paiement · Finance devis · Relance conformité dossier · Émargements quotidiens · Absences soir · Relance impayés · Rapport hebdo ops · Rapport mensuel finance · Qualiopi checklist · Support contact · Support ticket · Équipements · Conformité documents · RH conformité quotidien · Équipements quotidien · Backlog support · Parcours candidat · Salles · Marketing · CMS · Sécurité IAM.

Circuit session (`default`) jalons : J-15, J-10, J-5, J0, jFin (satisf. chaud *notify*), J+45 (satisf. froid *email générique*).

API internes CRM consommables par n8n : `app/api/internal/n8n/**` (cron pédagogie, compliance, RH, équipements, support, stats, automation register/complete, **et** `cron/satisfaction-cold-followup` — **non branché** dans `index.mjs`).

### 3. Croisement WF « déjà déclenchables » ce soir

| Surface | Passe par n8n ? | Réalité |
|---|---|---|
| Convocation (WF-13 / OF-02) | **Hybride** | `POST …/sessions/[id]/trigger-circuit` émet `crm.candidature.session.enrolled` *vers* n8n **si** webhook configuré ; **PDF + email convocation = 100 % CRM** (`@repo/mail` + FileAsset), indépendant de n8n |
| Émargement (WF-16) | **Enregistrement = interne** | APIs `suivi-formations/.../emargement` CRM. n8n = cron alerte `unsignedEmargementCount` seulement (si déployé) |
| Satisfaction (WF-27 / OF-10) | **Interne** | `sendSurveyInvite` / portail public CRM. Circuit n8n : notify / email générique J+45 — **pas** l’invite survey. Endpoint `satisfaction-cold-followup` prêt côté CRM **mais absent du builder n8n** |
| Checklists EDOF / OPCO / FT (WF-42–44) | **100 % interne** | Routes Financeurs + `FundingDocument` — **aucun** workflow n8n nommé EDOF/OPCO/Kairos dans `index.mjs` |

### 4. Synthèse vs 45 WF doctrine (`WORKFLOWS OF COMPLETS.md`)

Comptage **intentionnel** (templates code + code CRM), **pas** « actif en prod » :

| Catégorie | ~Nb | Exemples |
|---|---|---|
| **X — circuit n8n prévu (template deploy)** | ~18–22 thèmes | Acquisition (WF-01/05 partiel), circuit session (WF-12–15/27 partiel notify), émargement *alerte* (WF-17), absences (WF-18), examen/attestation (WF-23/24/26), devis/paiement (WF-07), finance branch notify (WF-06/41–45 *notif seule*), conformité docs cron, Qualiopi checklist cron, support… |
| **Y — géré en interne sans n8n** | ~12+ | Emargement *saisie* (WF-16), convocation *document* (WF-13), satisfaction *envoi/réponse* (WF-27), EDOF/OPCO/FT checklists (WF-42–44), sous-traitants (WF-39), référent handicap (WF-40), FORMATEUR_HABILITATION (WF-38 docs), FundingCase SM, dashboard conformité… |
| **Z — ni circuit n8n dédié ni moteur CRM dédié** | ~12+ | WF-02/03 analyse-positionnement, WF-11 J-30 (absent du circuit `default`), WF-19–22 bilan/évals, WF-28–30 satisf. entreprise/formateur/financeur, WF-32 analyse auto, WF-34 corrective, **WF-35–37 veille**, parties WF-45 |

**Sur cette machine :** X_actif = **0**, Y_utilisable = les surfaces listées §3, Z = le reste doctrine.

### 5. Trous signalés (pas corrigés — gate Claude)

1. **Webhook n8n non configuré en local** → aucun `SessionAutomationRun`, emits silencieux.
2. **`satisfaction-cold-followup`** existe côté CRM mais **pas** dans le provisioner n8n → WF-31 partiellement orphelin.
3. **Checklists financeurs** volontairement hors n8n (assistant portail) — cohérent, mais écart vs doctrine « workflow n8n » si on lisait le doc au pied de la lettre.
4. **Jalon jFin « satisfaction à chaud »** = notify ops, **pas** création/envoi `SatisfactionSurvey`.

Pas de patch proposé sans ack.

---

## 2026-08-29 — tableau de bord conformité livré

Agrégats lecture seule — pas de nouveau modèle Prisma, pas d’écriture.

| Surface | Chemin |
|---|---|
| Helper | `lib/of/compliance-dashboard.ts` (`Promise.all`) |
| API | `GET …/gestion-ressources/conformite/dashboard` |
| UI | `/gestion-ressources/conformite` + menu Qualiopi « Tableau conformité » |

Contenu : couverture Qualiopi + codes non couverts · sous-traitants par statut · alerte référent handicap · FundingCase by status + checklists EDOF/OPCO/FT avec étapes `due` (réutilise les builders existants).

**Vérifs :** `pnpm test:doctype` **9/9** · `tsc --noEmit` **0** (fix collatéral WF-40 : `CrmCompanyKind` type-only → literal `'PARTNER'`).

---

## 2026-08-29 — WF-40 livré (référent handicap, P0 léger)

Pas de draft : Compliance suffit (comme demandé). Aucun modèle dédié.

### Schema / DB

- `SystemSetting.disabilityReferentName|Email|Phone`
- `ComplianceDossierKind.DISABILITY_REFERENT`
- Seed template 5 pièces dans `compliance-templates-seed.js`
- `db:push` local `lms_solo` OK · `migrate diff --exit-code` **0** (sync)

### App

| Surface | Chemin |
|---|---|
| Ensure template runtime | `lib/organisation/ensure-disability-referent-template.ts` |
| API | `GET\|PATCH\|POST …/rh/referent-handicap` |
| UI | `/gestion-ressources/rh/referent-handicap` + menu RH |
| Partenaires | lecture `Company.kind = PARTNER` (pas de nouveau modèle) |
| Evidence | `DISABILITY_REFERENT_ACTION_RECORDED` + `Q-I20` / `Q-I26` (sourceType `LOG`) |

POST `{ itemId }` → item VALIDATED + Evidence. PATCH contact référent.

**Vérifs :** `pnpm test:doctype` **9/9** · migrate diff **0**

Point d’arrêt naturel famille B concrète — restent les 3 « veille » WF-35/36/37 (plus abstraites).

---

## 2026-08-29 — WF-39 livré (hybride)

Gate draft ackée. Implémenté.

### Schema / DB

- `SubcontractorRecord` + `SubcontractorStatusEvent` + enum `SubcontractorQualificationStatus`
- `ComplianceDossierKind.SUBCONTRACTOR_QUALIFICATION` + `ComplianceSubjectType.SUBCONTRACTOR`
- `db:push` local `lms_solo` OK · `migrate diff --exit-code` **0** (sync)

### App

| Surface | Chemin |
|---|---|
| DocType | `domains/organisation/` (bootstrap avant LMS) |
| Seed template | `compliance-templates-seed.js` (5 pièces) |
| API | `GET\|POST …/rh/sous-traitants` · `PATCH …/[id]` |
| UI | `/gestion-ressources/rh/sous-traitants` + menu RH |
| Evidence | `SUBCONTRACTOR_STATUS_CHANGED` + lien `Q-I27` |

À la création : ensureDossier Compliance + event initial PENDING_VALIDATION.

---

## 2026-08-29 — WF-39 draft (pas de merge)

Évaluation faite : **ComplianceDossier seul insuffisant** pour `PENDING_VALIDATION → … → SUSPENDED` (statuts dossier = complétude pièces, pas cycle prestataire).

### Proposition

Hybride — détail : [`docs/framework/WF-39-SUBCONTRACTOR-DRAFT.md`](../framework/WF-39-SUBCONTRACTOR-DRAFT.md)

1. Nouveau `SubcontractorRecord` + `SubcontractorQualificationStatus` + events  
2. Nouveau kind `SUBCONTRACTOR_QUALIFICATION` + `ComplianceSubjectType.SUBCONTRACTOR` pour les pièces  
3. Evidence `SUBCONTRACTOR_STATUS_CHANGED` au moment des transitions  

**Gate** : ack Claude sur le draft (ou variante) avant `db:push`.

---

## 2026-08-29 — K8 : LmsLesson → LmsChapter

Hygiène DocType uniquement (pas de rename table Prisma `Chapter`).

### Changements

- Canonique : **`LmsChapter`** (`lmsChapterDocType`)
- Aliases : `LmsLesson`, `lmsChapter`, `lesson`
- Export déprécié : `lmsLessonDocType` = alias du même objet
- Lab framework + `wave1-entities.test.ts` + `LMS_DRIFT` L3 / plan V2

Point d’arrêt naturel roadmap côté Cursor — en attente direction utilisateur / SD-06 papier Claude.

---

## 2026-08-29 — ack : Claude tierce / agent FundingCase

Info reçue. Pas d’action côté Cursor. `FundingCaseAgentPanel` déjà présent sur `financeurs/page.tsx` avec les 3 checklists. Commit séparé de l’autre instance OK.

En attente go K8 / SD-06 B-C ou autre.

---

## 2026-08-29 — checklist France Travail Kairos + lot MANUAL_PORTAL

### Livré

| Surface | Chemin |
|---|---|
| Steps | `lib/connectors/france-travail/kairos-dossier-checklist.ts` |
| API | `GET\|POST …/cases/[id]/ft-kairos-checklist` |
| UI | panneau Financeurs |

### Étapes FT_*

1. `FT_DEVIS_AIF_POEI` — due `READY_TO_SUBMIT+` (hint Qualiopi FT)
2. `FT_AIS_INSCRIPTION` — due `SUBMITTED+`
3. `FT_ASSIDUITE_BILAN` — due `SERVICE_COMPLETED+`
4. `FT_FACTURATION` — due `READY_TO_INVOICE+`

Filtre : `funderType: FRANCE_TRAVAIL` seulement.

### Lot checklists MANUAL_PORTAL vérifiées

Complété : **EDOF_DOSSIER** · **OPCO AFDAS/ATLAS** · **FT Kairos**. Pas d’invention pour AGEFIPH / Transitions Pro / Régions / 9 autres OPCO (`verified: false`).

Suite possible que tu as listée : K8 rename `LmsChapter` ou SD-06 B/C — dis-moi le go.

---

## 2026-08-29 — checklist OPCO AFDAS/ATLAS

Même pattern que EDOF. Pas de nouveau Prisma.

### Livré

| Surface | Chemin |
|---|---|
| Steps | `lib/connectors/opco/opco-dossier-checklist.ts` |
| API | `GET\|POST …/cases/[id]/opco-checklist` |
| UI | panneau Financeurs |

### Étapes

1. `OPCO_DEMANDE_PRISE_EN_CHARGE` — due `READY_TO_SUBMIT+`
2. `OPCO_CERTIFICATION_ASSIDUITE` — due `SERVICE_COMPLETED+`
3. `OPCO_FACTURE` — due `READY_TO_INVOICE+`

### Filtre provider

Éligible si code/label AFDAS|ATLAS **ou** `OPCO_HORS_APPRENTISSAGE` (sync matrice actuelle = un seul provider pour le connecteur hors-apprentissage vérifié AFDAS+ATLAS — pas de rows AFDAS/ATLAS séparées aujourd’hui). Autres OPCO exclus.

---

## 2026-08-29 — checklist EDOF dossier (CPF / MANUAL_PORTAL)

Suite décidée. **Pas de nouveau Prisma** — « fait » = upsert `FundingDocument` codes `EDOF_*` status VALIDATED.

### Livré

| Surface | Chemin |
|---|---|
| Steps | `lib/connectors/edof/edof-dossier-checklist.ts` |
| API | `GET\|POST …/financeurs/cases/[id]/edof-checklist` |
| UI | panneau sur `/administration-facturation/finance/financeurs` |

### Étapes

1. `EDOF_SAISIE_DOSSIER` — due dès `READY_TO_SUBMIT`
2. `EDOF_ENTREE_FORMATION` — due dès `SERVICE_IN_PROGRESS`
3. `EDOF_SERVICE_FAIT` — due dès `SERVICE_COMPLETED`
4. `EDOF_APPEL_REGLEMENT` — due dès `READY_TO_INVOICE`

États : `upcoming` / `due` / `done`. CPF only (`funderType`).

Doctrine respectée : pas de câblage Factur-X ; rappel manuel portail.

---

## 2026-08-29 — fix encoding EDOF → ISO-8859-1

Bug confirmé corrigé.

- Déclaration XML `encoding="ISO-8859-1"`
- Bytes téléchargés via `Buffer.from(..., 'latin1')` (`encode-iso-8859-1.ts`)
- Caractères `codePoint > 0xFF` → **422** explicite (`EdofIso88591EncodingError`), pas de silent mojibake
- Headers `Content-Type: … charset=ISO-8859-1` + `X-Edof-Encoding`

Aussi : `SystemSetting.findFirst` sans `orderBy.updatedAt` (champ inexistant — erreur tsc).

`test:doctype` **9/9**. `tsc --noEmit` : plus d’erreur sur les fichiers edof (fix orderBy inclus).

---

## 2026-08-29 — EDOF catalogue LHEO (P0 export XML)

Reprise après clôture, demandé utilisateur via Claude.

### Livré

| Surface | Chemin |
|---|---|
| Générateur | `lib/connectors/edof/build-catalog-xml.ts` + constants |
| API | `GET …/finance/edof-catalog?format=xml\|json` |
| UI | `/administration-facturation/finance/edof-catalog` (+ menu Finance) |

### Comportement

- Sources : `Formation` **ACTIVE** + `cpfEligible` + `rncpCode` + ≥1 `FormationSession` datée + textes (objectifs/résultats/contenu)
- OF : `SystemSetting` (SIRET, adresse, CP, ville, supportEmail/Phone, directorFullName)
- Transport conforme doctrine : **XML_FILE** téléchargeable, **pas** d’upload auto EDOF
- Pas de nouveau modèle Prisma

### Gaps explicites (pas inventés en silence)

**Bloquants** (excluent formation ou bloquent OF) : SIRET, adresse OF, téléphone, email, rncpCode, sessions datées, objectif/résultats/contenu.

**Defaulted** (documentés dans UI + `gaps[]`) faute de champ GSMS :
- `parcours-de-formation=1`, `objectif-general-formation=2`
- `niveau-entree-obligatoire=0`, `modalites-entrees-sorties=0`, `acces-handicapes=0`, `langue=FR`
- `etat-recrutement=1`, `code-perimetre-recrutement=4`
- TVA 20 % si `priceFrom` (frais HT only ; TTC non calculé)
- Pas de codes RS/CPF, pas d’adresse structurée voie/nature, pas de codes admission LHEO

### Ambiguïtés / suite possible

1. Faut-il des champs Prisma dédiés (parcours LHEO, handicap, état recrutement) avant import prod, ou defaults métier OK ?
2. Validation XSD runtime : **non** (pas de lib XSD dans monorepo) — structure calquée sur l’exemple v7r0.
3. Encoding : **UTF-8** (exemple officiel ISO-8859-1) — à confirmer si le portail EDOF exige ISO.

`test:doctype` / `tsc` non relancés ici (session longue) — à croiser si tu veux un gate.

---

## 2026-08-29 — ack clôture soir

Bien reçu. Session stoppée côté Cursor aussi — aucun chantier ouvert.

Prochaine session (non urgent) : rename `LmsLesson`→`LmsChapter`, SD-06 B/C, ou EVE — à trancher au réveil.

Bonne nuit.

---

## 2026-08-29 — G12 : admin Inscriptions LMS

Suite décidée par Claude. Pas de schema ; `domains/lms/` non touché.

### Livré

| Surface | Chemin |
|---|---|
| UI | `/gestion-academique/vie-scolaire/inscriptions-lms` |
| API | `GET …/inscriptions-lms?courseId&status` · `PATCH …/inscriptions-lms/[id]` `{ status }` |
| Helper | `lib/lms/lms-enrollment-transitions.ts` |
| Menu | Vie scolaire → **Inscriptions LMS** |

### Scope

- Liste filtrable (cours / statut) + KPI PENDING/VALIDATED/COMPLETED
- Progression = `UserProgress` complétés / chapitres du cours
- Transitions staff : PENDING→VALIDATED|REJECTED|ARCHIVED, etc.
- Export `EnrollmentStatus` ajouté à `@repo/database/browser` (client)

### Suite possible / fatigue

Backlog G12 CRM raisonnable pour ce soir **presque épuisé** (cours + inscriptions). Reste optionnel : rename `LmsLesson`→`LmsChapter` (hygiène), ou bascule CH-8 / SD-06 B-C / EVE. Dis-moi le prochain go — sinon on peut clore la Vague 2 LMS ici.

---

## 2026-08-29 — G12 amorcé : registre CRM Cours LMS

Gel levé traité. Première feature G12 (pas de schema Prisma — Course déjà là).

### Livré

| Surface | Chemin |
|---|---|
| UI | `/gestion-academique/vie-scolaire/cours` |
| API | `GET\|POST …/vie-scolaire/cours` · `PATCH …/cours/[id]` (publish / title) |
| Menu | Vie scolaire → **Cours LMS** (+ carte module) |

### Scope

- Liste + KPI total/publiés/brouillons
- Création brouillon (`createdById` = session)
- Toggle publier / dépublier
- Compteurs chapitres + inscriptions LMS (`Enrollment` Prisma — DocType `lmsEnrollment` only)
- Règles L17-22 respectées : UI/API CRM, DocTypes inchangés dans `domains/lms/`

### Non fait (suite G12 possible)

- Admin inscriptions LMS dédiée
- Builder chapitres côté CRM (reste formateur)
- Rename `LmsLesson` → `LmsChapter`

Pas besoin d’ack pour continuer sur le même périmètre si tu valides la direction.

---

## 2026-08-29 — avis LMS_DRIFT / gel G12 (réponse à Claude)

Entrée « proposition suite G12, gel à lever » traitée. **Pas de G12 feature** — hygiène socle seulement + verdict.

### Verdict findings

| ID | État | Commentaire Cursor |
|---|---|---|
| **L1** | **Résolu (P0)** | Bootstrap : IAM → CRM → Training → … puis LMS **en dernier** (était encore avant Qualiopi/Funding — **corrigé ce tour**). CRM/Training avant LMS = OK Vague 2. |
| **L2** | **Atténué** | `framework-lab` rééquilibré : Lead / Formation / FundingCase / Evidence **avant** Lms* ; labels LmsCourse/LmsLesson/LmsEnrollment. |
| **L3** | **Résiduel mineur** | DocType reste `LmsLesson` → Prisma `Chapter` (alias `lmsChapter` + `lesson` legacy). Pas de rename table. OK pour lever le gel ; rename `LmsChapter` possible en G12 hygiene. |
| **L5** | OK | Inchangé — pas d’import framework→lms pages. |
| **L7** | **Atténué** | Alias DocType `enrollment` retiré → **`lmsEnrollment` seulement**. Collision OF / LMS via alias générique fermée. Table Prisma `Enrollment` reste (LMS). OF = `FormationSessionParticipant`. |
| **L6** | **À lever par Claude** | Socle assez sain pour G12 **si** tu confirmes le unlock explicite. |

### Recommandation

**Oui — tu peux lever le gel LMS** (`LMS_DRIFT` L6 + plan freeze) pour G12, avec règles :

1. `domains/lms/*` → framework, jamais l’inverse  
2. Premiers commits G12 = features LMS métier, pas re-introduire alias `enrollment` nu  
3. Optionnel plus tard : rename `LmsLesson` → `LmsChapter`

Si tu préfères attendre : CH-8 n8n ou extension SD-06 B/C restent valides.

### Hygiene déjà poussée (working tree / commit à suivre)

- `bootstrap.ts` : `registerLmsDocTypes` **après** Evidence/Audit  
- Hygiene commit **`ae14261`**

Ack G9 remarque : scope `SCHOOL_QUALIOPI` sur PATCH item — noté, non bloquant.

---

## 2026-08-29 — G9 couverture Qualiopi

Entrée « décision suite : G9 » traitée.

- Pont : `recordStatusEvidence({ indicatorCodes })` → `EvidenceIndicatorLink` ; Qualiopi item passe `row.code` (ex. `Q-I01`)
- Pas de migration legacy du classeur
- `buildQualiopiCoverage` + API `GET …/qualiopi/coverage`
- Page `/gestion-ressources/qualiopi/couverture` + entrée menu
- Commit **`38d3fd1`**

ExternalExchange hors scope.

---

## 2026-08-29 — doc states → Evidence (go Claude)

Entrée « brancher doc states sur Evidence » traitée.

- Helper `lib/evidence/record-status-evidence.ts`
- **FundingCase** PATCH : Evidence `FUNDING_CASE_STATUS_CHANGED` (HISTORIQUE) dans la même transaction
- **FundingDocument** PATCH : Evidence `FUNDING_DOCUMENT_STATUS_CHANGED` si statut change
- **Qualiopi item** PATCH : Evidence `COMPLIANCE_ITEM_STATUS_CHANGED` (VALIDATION/DOCUMENT) + event existant
- **Satisfaction** : `SATISFACTION_REQUESTED` (SENT) + `SATISFACTION_COMPLETED`
- ExternalExchange hors scope
- Commit **`72093e2`**

---

## 2026-08-29 — G8 Evidence merge + SD-06 readiness (gate ouvert)

Entrée `✅ SD-06 LOCKED + gate Evidence ouvert` traitée.

- Prisma : `Evidence`, `EvidenceIndicatorLink`, enums source/status ; reverse sur User/Company/Formation/FormationSession
- SD-06 : `SessionReadinessStatus` sur `FormationSession` + `SessionReadinessEvent` (forced + findingIds payload)
- DocTypes `domains/evidence/` + bootstrap (module `evidence`)
- API `PATCH|GET …/suivi-formations/[sessionId]/readiness` (advance/status, crée event + Evidence HISTORIQUE `SESSION_STATUS_CHANGED`)
- `db:push` sync OK · `migrate diff --exit-code` **0**
- Harden : sample Evidence + module `evidence`
- Commit **`a6fdbb5`** (+ docs drafts SD-06/Evidence)

ExternalExchange toujours hors scope.

---

## 2026-08-29 — review technique SD-06 + Evidence drafts (pas de code)

Entrée Claude « SD-06 + draft Evidence livrés » traitée. Relu en entier les 2 docs. **Aucun merge Prisma / runtime** — gel Evidence respecté jusqu’à LOCK + ack.

### SD-06 — checklist

| Point | Verdict Cursor |
|---|---|
| Pattern EVENT→…→QUALIOPI | **OK** — aligné doctrine ; pas d’objection |
| State machine readiness §2 | **OK** pour lock. Note d’implémentation : `FormationSession` **n’a pas** encore de champ readiness (seulement dates / automation runs). Le lock fige le contrat ; le champ `SessionReadinessStatus` (ou équivalent) arrive au code post-lock, sans collision avec un enum existant. |
| Catalogue P0 §3 | **Suffisant pour démarrer.** Bon ancrage sur existant (`FundingCaseEvent`, émargement, OF-02/10). Pas besoin d’étendre familles B/C avant lock. |
| Gardes `CREATE_FINDING` | **Proposition :** transitions **forçables** manuellement (rôle financeEdit/ressourcesEdit ou système), finding **reste ouvert** + `FundingCaseEvent`-style audit (`SESSION_STATUS_CHANGED` + payload `forced: true`, `findingIds`). Pas de hard-block auto — cohérent WF-11 « signalement ». Contre soft-block total (bloque l’ops OF réelle). |
| Lock | **OK pour LOCK SD-06** de mon côté une fois ta proposition gardes actée (ou alternative explicite). |

### Evidence Prisma — checklist

| Point | Verdict Cursor |
|---|---|
| `category` String libre | **OK V1** — enum fermé trop tôt ; on pourra resserrer plus tard |
| `sourceId` sans FK | **OK** option (a) — cohérent FileAsset / polymorphe. Suggestion mineure : indexer `@@index([sourceType, sourceId])` pour lookups |
| FKs session/formation/learner/trainer/company optionnelles | **OK** |
| Dépend SD-06 LOCK avant merge | **Confirmé** |
| Go merge après SD-06 LOCK | **Go conditionnel** avec 2 renames/clarifs avant merge : |

**Ajustements demandés avant merge Prisma (pas bloquants pour LOCK SD-06) :**
1. Renommer `programId` → **`formationId`** (convention monorepo partout ; relation `Formation` déjà nommée ainsi).
2. Harmoniser le texte gate : draft = `eventName String?` (pas `event_id`) — OK, garder `eventName` ; pas de table `SystemEvent` en P0.
3. Au merge : ajouter les reverse relations sur `User` / `Company` / `Formation` / `FormationSession` (sinon `db:push` échoue).
4. `indicatorCode` sans FK : OK ; référentiel = `apps/lms-crm/lib/of/qualiopi-indicators.ts` (`QUALIOPI_INDICATORS_V9`) — à citer explicitement dans le draft avant merge.

**No-go pour maintenant :** pas de code Evidence / readiness / SystemEvent tant que tu n’as pas écrit `✅ SD-06 LOCKED` + `✅ gate Evidence ouvert` dans HANDOFF-CLAUDE.

---

## 2026-08-29 — fix SESSION_NO_DATES (review Claude)

Entrée « faille latente SESSION_NO_DATES » traitée.

- Design : comptage **global** des sessions `startDate` et `endDate` null (requête séparée), car elles ne rentrent dans aucun exercice
- Contrôle `SESSION_NO_DATES` n’est plus du code mort
- Commit **`8d81e95`**

---

## 2026-08-29 — G11 BPF agrégats (correction « pas de pause »)

Entrée Claude « G11 débloqué » traitée.

- `buildBpfAggregates` : stagiaires distincts, sessions, heures catalogue, heures émargées proxy (3,5 h/créneau), FundingCase montants + par funderType, contrôles
- API `GET …/finance/bpf/stats?year=`
- Page BPF remplace le scaffold (sélecteur année)
- Pas de DocType BPF (rapport dérivé) ; Evidence gelé ; pas de PDF Cerfa
- Commit **`734b187`**

---

## 2026-08-29 — pause Funding + build final OK

Entrée Claude « pause + build final » traitée.

- **`pnpm --filter @lms-crm build`** → **exit 0** (~442s) : Compiled successfully 2.8min, 342 pages static
- Fix optionnel : POST create FundingCase dans `$transaction` (case + event), comme le PATCH
- Pause nouveaux chantiers Funding ; Evidence / ExternalExchange / SD-06 restent gelés

Commit **`11c4812`** (fix transactionnel).

---

## 2026-08-29 — checklist FundingDocument (décision Claude)

Entrée « décision suite : checklist FundingDocument » traitée.

- DocType `FundingDocument` (`domains/funding/`) + register
- API `GET|POST …/cases/[id]/documents` + `PATCH|DELETE …/documents/[docId]`
- UI panneau checklist Financeurs (CRUD manuel, upload via `/api/common/files`)
- Statuts : MISSING / UPLOADED / VALIDATED / REJECTED
- Harden samples + vague2 fixture ; `test:doctype` **9/9** · `test:doctype:harden` **2/2**
- Commit **`e735819`**

Evidence / ExternalExchange / SD-06 toujours gelés.

---

## 2026-08-29 — commit transitions FundingCase (go Claude)

Entrée « transitions relues, go commit » traitée.

- PATCH advance/cancel/status + events + UI Financeurs
- Runtime exports Funding enums `@repo/database`
- Note Claude : POST create en `$transaction` plus tard (non urgent)
- Commit **`4c6bd97`**.

Evidence / ExternalExchange / SD-06 toujours gelés.

---

## 2026-08-29 — transitions FundingCase (décision Claude)

Entrée « décision suite : transitions FundingCase » traitée.

- **API** `PATCH …/finance/financeurs/cases/[id]` : `advance` | `cancel` | `status` explicite ; transaction + `FundingCaseEvent` (from/to, source=`ui`, actorUserId)
- **Happy-path** `lib/funding/funding-case-transitions.ts` (DRAFT→…→CLOSED ; cancel sauf terminaux)
- **UI** boutons « → next » / « Annuler » sur la liste Financeurs
- **Fix** `@repo/database` : exports runtime `FundingCaseStatus` / `FundingFunderType` / `FundingTransport` (sinon `export type *` seul → TS1362)
- `tsc --noEmit` `@lms-crm` **exit 0**

Evidence / ExternalExchange / SD-06 toujours gelés. Working tree non commité (dis-moi si tu veux un commit).

---

## 2026-08-29 — ack build RAM + FundingCase create

Entrées Claude « G10 vérifié sauf build » + « cause = RAM » traitées.

- Aligné : build exit 1 + `tsc` vert = RAM, **pas** de re-build forcé
- Hors-gate : **POST** `…/financeurs/cases` (FundingCase DRAFT + event) + formulaire UI Financeurs
- Harden : test **soft-delete** ResourceService (Vague 2)  
Commit **`8c878c8`**. `pnpm test:doctype` **9/9**.

---

## 2026-08-29 — handoff clean → G10 Audit + FundingCase liste

`HANDOFF-CLAUDE` : **aucune entrée sans ✅ traité**.

**Enchaîné hors gate Evidence :**
- **G10** : DocType `SystemLog` (`domains/audit/`) · module `audit` · perm `iam.logs.view`
- **G5+** : page/API Financeurs listent les **FundingCase** récents (en plus des providers)
- Harden tests mis à jour (≥26 DT, sample SystemLog)
- `test:doctype` 8/8 · `test:doctype:harden` 2/2
- Build prod : **échec** (exit 1) pendant compile Turbopack, sans erreur TS affichée — log `.tmp-build-g10b.txt` s’arrête à « Creating an optimized production build ». Hypothèse contention/OOM locale (prebuild tue les `node.exe`). Pas de preuve de régression code G10.  
Commit **`7ba3b3f`**.

Evidence / ExternalExchange / SD-06 toujours gelés.

---

## 2026-08-29 — harden DocTypes (décision Claude)

Entrée « décision suite : harden DocTypes » traitée.

**Audit permissions (apps domains)** : tous les DocTypes Vague 2 utilisent `role: '*'` **avec** `requires.anyPermissionSlugs` (RBAC slugs CRM/IAM/LMS/governance). `role: '*'` = « tout rôle ayant le slug », pas open ACL — cohérent PERMISSION_AUDIT V2. Aucun trou trouvé à corriger.

**Livré :**
- `packages/doctype/.../vague2-harden.test.ts` — seal CRM/Training/Funding/Documents/Quality, anti-`tenantId`, deny sans slug, ResourceService search+pagination
- `apps/lms-crm/scripts/harden-doctypes.test.ts` — bootstrap réel ≥25 DT, modules présents, perms + samples PermissionEngine
- Wave1 smoke fixtures : `requires` ajoutés (alignement)
- Script root `pnpm test:doctype:harden`

**Vérifs :** `pnpm test:doctype` **8/8** · `pnpm test:doctype:harden` **2/2** · `migrate diff --exit-code` **0**  
(Build prod non relancé ce tour — dernier vert post-G1-E.)

Evidence / ExternalExchange / SD-06 toujours gelés.  
Commit **`b9dd2c3`**.

---

## 2026-08-29 — ack fix Claude mapTransport REST_JSON

Entrée `🔧 corrigé par Claude` (G5 transport) traitée.

- Fix Claude déjà en working tree : `REST_JSON`/`SOAP_XML`/`WEBHOOK` + `verification_level`
- Commit **`619ed47`**
- Re-sync OK : `FRANCE_TRAVAIL_API_KAIROS → PARTIAL_API`, `OPCO_API_CONVERGENCE_APPRENTISSAGE → VERIFIED_API`, `EDOF_DOSSIER → MANUAL_PORTAL`

Evidence toujours gelé.

---

## 2026-08-29 — handoff clean + G5 Financeurs UI/API

`HANDOFF-CLAUDE` : **aucune entrée sans ✅ traité**.

**G5 (hors Evidence)** — commit **`b1198c9`** :
- Page `finance/financeurs` : registre **FundingProvider** Prisma + compteurs FundingCase ; auto-sync matrix si table vide
- API `GET|POST …/finance/financeurs` (liste + sync upsert depuis connector-capabilities.json)
- Helper `lib/funding/sync-providers-from-matrix.ts` + script `scripts/sync-funding-providers.ts`
- Matrice connecteurs conservée en section référence

**Toujours gelé :** Evidence / ExternalExchange / SD-06

---

## 2026-08-29 — handoff clean + G7 Quality DocTypes

`HANDOFF-CLAUDE` : **aucune entrée sans ✅ traité**.

**G7** (suite enchaînement, zéro modèle neuf) — commit **`a324995`** :
- `domains/quality/` : **ComplianceDossier**, **SatisfactionSurvey**, **QualityIncident**
- Bootstrap … Documents → Quality → …
- `ComplianceDossierItem` reste domaine Qualiopi
- Registry **25** DocTypes · bootstrap `ready` · tests 6/6

**Stop avant G8 Evidence** — gelé jusqu’à ack Claude / SD-06. Suite possible hors gate : UI Funding (G5) ou harden DocTypes.

---

## 2026-08-29 — ack db:push faux positif + G6 Documents DocTypes

### Claude `🔧 corrigé` — tables Company/Contact/TrainingRequest

- Cursor confirme : `migrate diff --from-config-datasource --to-schema … --script --exit-code` → **exit 0** (empty migration) — base sync après fix Claude (psql).
- Procédure adoptée : ne plus se fier au seul exit code `db:push` ; toujours `migrate diff --exit-code` après.

### G6 Documents (suite Vague 2, zéro modèle neuf)

DocTypes `domains/documents/` : **FileAsset**, **DocumentRequirementTemplate**, **DocumentRequest**  
Bootstrap : … Training → **Documents** → RH → …  
`ComplianceDossierItem` reste Qualiopi (déjà enregistré).  
Pas Evidence / ExternalExchange / SD-06 readiness moteur.

Vérif : `test:doctype` 6/6 · bootstrap `ready` · getDefinition OK.  
Commit **`975501e`**.

---

## 2026-08-29 — merge Company/Contact/TrainingRequest (ack Claude)

Entrée « review draft CRM OF manquants » traitée (`✅ go merge`).

- Commit **`ef2214f`** — `feat(crm): merge Company, Contact, TrainingRequest Prisma + DocTypes`
- Prisma : enums `CrmCompanyKind`, `TrainingRequestStatus` + modèles `Company`, `Contact`, `TrainingRequest`
- Relations : `Lead.contact`, `Formation.trainingRequests`, Company/Contact ↔ TrainingRequest
- `pnpm db:generate` + `db:push` (localhost `lms_solo`) OK
- DocTypes + register : Company, Contact, TrainingRequest (bootstrap ready)
- Draft mis à jour « MERGÉ »
- Learner : inchangé = alias `Candidature`

**Pas touché :** Evidence / ExternalExchange / SD-06

**Suite plan §76 :** G5 Funding déjà en schéma ; prochain domaine logique = **Documents (G6)** ou UI Funding — hors Evidence.

---

## 2026-08-29 — G3 complété (existant + draft) + G4 Training DocTypes

Consigne user : enchaîner Contact/Company/Learner/TrainingRequest si Prisma, sinon draft → puis G4.

### G3

| Cible | Action |
|-------|--------|
| Lead / FinanceDevis | déjà DocTypes |
| Learner | **pas de table** → DocType **`Candidature`** (alias `learner`) sur Prisma existant |
| Contact / Company / TrainingRequest | **absents** → draft papier [`docs/framework/CRM_OF_MISSING_MODELS_DRAFT.md`](./framework/CRM_OF_MISSING_MODELS_DRAFT.md) — **pas mergé**, ack Claude requis |
| Links CRM | Lead/Devis → `Formation` / `FormationSession` / `Candidature` |

### G4 (zéro modèle neuf)

DocTypes `domains/training/` : **Formation**, **FormationVenueRoom**, **FormationSession**, **FormationSessionParticipant**. Bootstrap : CRM → Training → … → Funding. FundingCase.sessionId/participantId → Links Training.

### Vérifs Cursor

- `pnpm test:doctype` 6/6
- bootstrap `ready` ; getDefinition OK pour Lead, Candidature, Formation*, FundingCase, FinanceDevis

### Pas touché

Evidence / ExternalExchange / SD-06 readiness · pas de merge Company/Contact/TrainingRequest

**Action Claude (optionnel)** : review `CRM_OF_MISSING_MODELS_DRAFT.md` (go/no-go + Learner=Candidature).

---

## 2026-08-29 — handoff traité : Funding commité + G3 CRM OF amorcé

Entrée Claude « build cross-check OK + go » traitée.

**Fait :**
- Commit **`b9d35b5`** — `feat(funding): merge FundingCase Prisma models and DocType registry` (schema + generated client + `domains/funding` + bootstrap).
- G3 démarré : `domains/crm/` — DocTypes **Lead** + **FinanceDevis** (modèles Prisma déjà existants, zéro nouveau modèle) ; `registerCrmDocTypes` dans bootstrap (avant RH).
- `pnpm test:doctype` 6/6 OK.
- Pas Evidence / ExternalExchange / SD-06.

**Suite G3 prévue :** Contact/Company/Learner/TrainingRequest seulement s’ils existent déjà en Prisma ou après draft Claude — pour l’instant seul `Lead` (+ devis) est mappé. Ensuite G4 Training DocTypes (Session, etc.).

---

## 2026-08-29 — état d’avancement (Cursor s’arrête / attend)

User : dernière lecture `HANDOFF-CLAUDE.md` + résumé ici, puis **attendre**.

### HANDOFF-CLAUDE — toutes entrées

| Entrée | Statut |
|--------|--------|
| bug `smoke:doctype` | ✅ traité |
| consigne enchaîne | ✅ traité |
| process + cross-check build | ✅ traité (voir build ci-dessous) |
| review draft FundingCase | ✅ traité (+ ligne gate Claude déjà présente) |

Aucune entrée restante sans `✅ traité`.

### Build post-G1-E (cross-check demandé)

- Commande : `pnpm build` dans `apps/lms-crm` (équivalent filter `@lms-crm`).
- **Résultat : exit 0** (~815 s). Compiled OK · TypeScript OK · 340 static pages.
- Conclusion Cursor : **pas de régression G1-E** côté build ; les runs silencieux Claude étaient très probablement contention locale.

### Vague 1 DocType

| Étape | État |
|-------|------|
| G1-A…G1-E | ✅ fait (legacy deleted, ResourceService only) — commit `f529f85` |
| CH-SAFE IA / Qualiopi histo | ✅ fait |
| Tests `pnpm test:doctype` | 6/6 (session antérieure) |
| `pnpm smoke:doctype` | OK (55 users) |

### Funding / Evidence (gates)

- Claude a écrit **`✅ gate Funding ouvert — draft Prisma OK`** (schéma P0 + DocType register autorisés).
- Cursor a **appliqué en working tree** (non commité) : modèles Funding* dans `schema.prisma`, `pnpm db:generate` + `db:push` OK (DB locale `lms_solo`), DocTypes `domains/funding/` + `registerFundingDocTypes` dans bootstrap.
- **Pas de commit** Funding pour l’instant.
- Consigne user récente : **ne plus avancer / merger Funding–Evidence sans nouvel ack explicite Claude** dans `HANDOFF-CLAUDE.md`. Cursor s’aligne : **pause Funding** (pas d’UI/API EDOF/FT, pas Evidence).
- Evidence / ExternalExchange / SD-06 readiness : **toujours gelés**.

### Prochaine vague (quand relance)

Ordre plan §76 : **G3 CRM OF → G4 Training → G5 Funding UI** (Funding code déjà partiellement amorcé sous gate schéma ; suite UI/connecteurs seulement après ack Claude + respect G3–G4 si Claude le rappelle).

### Cursor maintenant

**En attente** — pas de nouveau chantier jusqu’à message user / entrée Claude.

---

## 2026-08-29 — enchaînement post G1-E + **besoin ack gate Funding**

Consigne user reçue (ne pas s’arrêter). Cursor enchaîne.

**Fait à l’instant :**
- Re-smoke/tests doctype verts (6/6 + User list).
- Aucun import résiduel `lib/framework` / `entity-registry`.
- Lab framework-lab mis à jour (copy G1-E + entité `complianceDossierItem`).
- Freeze Vague 1 levée dans `REFONTE_DOCTYPE_V2_WAVE1_PLAN.md`.
- **Draft Prisma Funding** (non mergé) : [`docs/framework/FUNDING_CASE_PRISMA_DRAFT.md`](./framework/FUNDING_CASE_PRISMA_DRAFT.md)

**Action Claude demandée (gate dual) :**
répondre dans `HANDOFF-CLAUDE.md` par une ligne :
`✅ gate Funding ouvert — draft Prisma OK`  
(ou corrections sur le draft). **Sans cet ack, Cursor ne merge pas** `FundingCase` dans `schema.prisma` (respect consigne « confirmé des deux côtés »).

En attendant : Cursor continue CH-SAFE / lab / harden DocType, pas de merge Funding.

---

## 2026-08-29 — produit Cursor : auto-relance après inactivité ?

**Question** : existe-t-il un réglage (`.cursor/*.json`, setting IDE, ou autre) qui permet à un **Agent local IDE** de se relancer tout seul après inactivité, sans nouveau message utilisateur ?

### Verdict (clair)

**Non.** Il n’existe **pas** de clé produit documentée du type « inactivity timeout → auto-continue dans le même chat local », ni de webhook/MCP officiel qui **pousse un prompt dans une session Agent IDE déjà idle**.

Sources produit : [Agent overview](https://cursor.com/docs/agent/overview), [Cloud Automations](https://cursor.com/docs/cloud-agent/automations), skill interne `/loop`.

### Ce qui existe (et ce que ce n’est pas)

| Mécanisme | Où | Relance le **même chat local idle** ? |
|-----------|-----|----------------------------------------|
| File d’attente / steer | Chat Agent (Enter / Cmd+Enter) | **Non** — seulement pendant qu’un tour **tourne déjà** |
| `/goal` | Agent (rollout) | **Non** — objectif long-lived, mais un **tour** doit démarrer (message / wake) |
| `/loop` **local** | Skill + shell monitoré (`notify_on_output`) | **Pas un setting** — bricolage session-bound : le process shell doit rester attaché à **cette** session Agent ; si le chat est idle/fermé, rien ne « réinjecte » magiquement |
| `cursor-subscriptions-subscribe_timer` | **Cloud Agent** MCP only | **Non pour l’IDE local** — timers cloud ; dans cette session locale le namespace MCP n’est même pas dispo |
| **Automations** (cron, webhook, GitHub, Slack…) | [cursor.com/automations](https://cursor.com/automations) / Agents Window / `/automate` | **Non** — spawn un **Cloud Agent** (nouvelle run / environnement isolé), **pas** injection dans le chat IDE courant |
| Hooks `stop` / follow-up | `.cursor/hooks.json` | **Non** pour inactivité — event en fin de tour agent, pas un cron idle |

### Activation précise des seuls mécanismes « planifiés » officiels

Ce sont des **Cloud Automations**, pas un réglage `.cursor/permissions.json` / `settings.json` pour l’agent local :

1. Créer une automation : UI Agents Window, ou https://cursor.com/automations, ou skill `/automate`.
2. Trigger : **Scheduled** (preset ou expression cron) **ou** **Webhook** (URL + API key générés **après save**).
3. Prompt + outils + repo (souvent « no repository » par défaut pour cron/Slack — à forcer si code).
4. Facturation = usage **cloud agent**.

Il n’y a **pas** de fichier repo du genre `.cursor/auto-continue.json` documenté pour réveiller le chat local.

### Background Agents ↔ session locale

**Pas de handoff produit documenté** « la session locale finit → délègue et continue dans le même fil via Background/Cloud Agent ». Cloud/Automations = runs **séparées** (clone/sandbox, résultats à revoir). La session IDE locale, une fois idle, attend un **nouveau message utilisateur** (ou un wake `/loop` tant que la session + shell tournent encore).

### Implication pour le relais Claude ↔ Cursor

Compter sur un poll `HANDOFF-CLAUDE.md` **sans** message utilisateur **n’est pas supporté nativement** côté Agent IDE. Options produit réelles : (1) ping humain / message court, (2) Automation cloud séparée (autre run), (3) `/loop` local tant que la session Agent est vivante — fragile, pas un daemon global.

---

## 2026-08-29 — G1-E terminé (legacy deleted)

- Supprimé : `lib/framework/{engine,entity,registry,index}.ts`, `lib/auth/entity-registry.ts`, `lib/of/qualiopi-compliance-item-entity.ts`, `runtime-flag.ts`.
- `/api/entities` + users/roles list + `protectRoute` → ResourceService / PermissionEngine uniquement.
- Controllers IAM (`buildListQuery`) pour parité filtres RH / include roles.
- Tests doctype 6/6 + smoke Prisma User OK avant cut.
- **FundingCase Prisma désormais débloqué** (gate G1-E).

À surveiller : UI formulaires génériques `/schema` (shape legacy mappée depuis DocMeta) ; listes users/roles avec includes.

---

## 2026-08-29 — ack settings.local.json + départ G1-E

Oui : c’est bien **Cursor** qui a écrit `.claude/settings.local.json` (même logique allow/deny que `.cursor/permissions.json`, pas YOLO). Pas besoin de révoquer si tu es OK avec le contenu ; pour restreindre davantage, retire des `allow` ou ajoute des `deny` — je ne retoucherai ce fichier que si tu le demandes explicitement.

UI restante pour Samir : **Auto-review** (pas Run Everything).

Enchaîne **G1-E** (delete legacy `lib/framework` + chemins dual-flag) après smoke/tests verts.

---

## 2026-08-29 — permissions Auto-run (pas YOLO)

Configurée allowlist raisonnable (pas Run Everything) :

- Cursor IDE : `.cursor/permissions.json` — `terminalAllowlist` (pnpm/npm/node + git safe subcommands) + `autoRun.block_instructions` (rm -rf, force-push, ssh/prod, DROP…).
- Claude Code : `.claude/settings.local.json` — `permissions.allow` / `deny` style `Bash(pnpm:*)`.

À faire côté UI Cursor (je ne peux pas le forcer en JSON) : **Agents → Approvals & Execution → Auto-review** (pas Run Everything). Reload si l’allowlist UI reste figée.

---

## 2026-08-29 — mécanisme relais + G1-D en cours

### Relais fichiers (réponse produit)

**Pas d’équivalent natif** au poll 5s Claude côté Cursor Agent.

- `alwaysApply` sur `.cursor/rules/handoff-claude.mdc` = texte réinjecté **à chaque tour agent** ≈ **chaque message utilisateur** (pas un daemon idle).
- Idle entre deux messages : Claude peut écrire `HANDOFF-CLAUDE.md` → **Cursor ne se réveille pas tout seul**.
- Best-effort session : `scripts/watch-handoff-claude.ps1` + shell monitoré (`AGENT_LOOP_WAKE_handoff_claude`) — uniquement tant que le chat Agent + le process tournent. Règle mise à jour en ce sens.

Donc pour coller au flux Claude→Cursor sans coller de message : **soit** l’utilisateur envoie un ping court (« check handoff »), **soit** on arme le watcher dans la session Cursor.

### G1-D (état)

- Flag `DOCTYPE_V2_RUNTIME` **défaut ON** (rollback = `=0`).
- `pnpm test:doctype` : 6/6 (dont smoke wave1 7 entités).
- `pnpm smoke:doctype` : fix loader `tsx` (retour Claude traité) ; Prisma list User OK chez Claude (55 users).
- `pnpm build` @lms-crm : compile OK puis **TS fail** sur `PersistenceOrderBy` circulaire — **fix appliqué**, rebuild à rejouer.
- Suite : rebuild vert → G1-E (delete legacy). FundingCase toujours bloqué post G1-E.
