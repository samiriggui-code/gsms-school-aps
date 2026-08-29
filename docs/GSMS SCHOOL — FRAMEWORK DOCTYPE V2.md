# GSMS SCHOOL — FRAMEWORK DOCTYPE V2

## Alignement Frappe + adaptation Organisme de Formation

> **IMPORTANT — CE DOCUMENT REMPLACE LES INTERPRÉTATIONS PRÉCÉDENTES DU FRAMEWORK DOCTYPE.**  
> Date d’adoption : 29 août 2026  
> Ancien TODO : [`docs/FRAMEWORK_TODO.md`](./FRAMEWORK_TODO.md) → redirect ici  
> Audits factuels : [`docs/framework/`](./framework/)

Le framework DocType de GSMS doit être conçu en s’inspirant **explicitement** de l’architecture du **Frappe Framework**.

- Il ne faut **pas** copier ERPNext.
- Il ne faut **pas** copier le code Frappe (AGPL).
- Il faut **comprendre et adapter** les principes structurels de Frappe.

```text
FRAPPE FRAMEWORK  =  framework meta-data driven
GSMS              =  framework métier OF meta-data driven
```

======================================================================
0. PROBLÈME À CORRIGER
======================================================================

LE CHANTIER DOCTYPE A DÉRIVÉ.

IL EST PARTI VERS :

LMS · LAB · COURSES · LESSONS · EXPÉRIMENTATIONS UI

ALORS QUE LE DOCTYPE FRAMEWORK DOIT ÊTRE LE SOCLE DE TOUT GSMS.

IL EXISTE AUSSI UN DRIFT DES PERMISSIONS :

DOCTYPE REGISTRY ≠ PERMISSION REGISTRY

CERTAINS ÉLÉMENTS SONT DÉSYNCHRONISÉS.

IL FAUT STOPPER CE DRIFT.

**AUCUNE NOUVELLE FEATURE LMS AVANT RÉPARATION DU SOCLE.**

======================================================================
1. CE QUE FRAPPE FAIT RÉELLEMENT
======================================================================

Dans Frappe :

| Concept | Rôle |
|---------|------|
| DocType | définition metadata du document |
| Document | instance runtime d’un DocType |
| DocField | metadata d’un champ |
| DocPerm | metadata de permissions rattachées au DocType |
| Meta | représentation compilée/enrichie des métadonnées |
| Controller | comportement du document |
| Workflow | machine d’état attachée à un DocType |
| Custom Field | extension locale du schéma |
| Property Setter | override d’une propriété metadata |
| Custom DocPerm | override/extensions des permissions |
| Child DocType | lignes structurées appartenant au parent |
| Single DocType | configuration singleton |
| Virtual DocType | DocType dont les données ne viennent pas nécessairement de la base principale |
| REST Resource API | API générique générée autour des documents |

**GSMS DOIT REPRENDRE CETTE SÉPARATION.**

======================================================================
2. RÈGLE ARCHITECTURALE PRINCIPALE
======================================================================

**DOCTYPE FRAMEWORK N’APPARTIENT À AUCUN DOMAINE.**

Il n’appartient pas au LMS, CRM, QUALIOPI, FINANCE, FUNDING.

```text
DOCTYPE FRAMEWORK
        │
        ├── CRM
        ├── TRAINING
        ├── FUNDING
        ├── DOCUMENTS
        ├── QUALITY
        ├── EVIDENCE
        ├── QUALIOPI
        ├── AUDIT
        ├── FINANCE
        └── LMS
```

LE LMS EST UN CLIENT DU FRAMEWORK.  
LE FRAMEWORK NE DOIT JAMAIS IMPORTER LE LMS.

======================================================================
3. MODÈLE CENTRAL
======================================================================

Séparer explicitement :

`DocTypeDefinition` · `Document` · `DocField` · `DocPermission` · `DocMeta` · `DocController`

Exemple :

```json
{
  "name": "Session",
  "module": "training",
  "label": "Session de formation",
  "table": "...",
  "fields": [],
  "permissions": [],
  "naming": {},
  "workflow": "SessionLifecycle",
  "flags": {}
}
```

`Document` = instance réelle (`Session SES-2026-045`).  
`DocType` = définition (`Session`).

======================================================================
4. DOCTYPE METADATA
======================================================================

Définition déclarative. Exemple :

```json
{
  "name": "Session",
  "module": "training",
  "label": "Session de formation",
  "naming": {
    "strategy": "series",
    "pattern": "SES-{YYYY}-{#####}"
  },
  "fields": [],
  "permissions": [],
  "workflow": "SessionLifecycle",
  "flags": {
    "is_child": false,
    "is_single": false,
    "is_virtual": false,
    "is_submittable": false
  }
}
```

======================================================================
5. DOCTYPE REGISTRY
======================================================================

Une source runtime : **DocTypeRegistry**

Responsabilités :

`register_definition()` · `get_definition()` · `get_meta()` · `has_doctype()` · `list_doctypes()` · `resolve_controller()` · `resolve_table()` · `resolve_workflow()` · `resolve_naming()`

Le Registry ne doit pas être un duplicata JSON du frontend.  
Le frontend consomme le metadata backend.

**SOURCE DE VÉRITÉ : BACKEND DOCTYPE METADATA**

======================================================================
6. META LAYER
======================================================================

**DocMeta** n’est pas juste le JSON brut.

DocMeta = base definition + custom fields + property overrides + custom permissions + runtime configuration.

```text
DocTypeDefinition
↓ Customizations
↓ Permission Overrides
↓ DocMeta
↓ Runtime
```

Cela évite de modifier le schéma standard à chaque personnalisation.

======================================================================
7. DOCFIELD
======================================================================

Chaque champ = objet metadata :

`fieldname` · `label` · `fieldtype` · `required` · `default` · `options` · `read_only` · `hidden` · `unique` · `searchable` · `index` · `permlevel` · `depends_on` · `description`

```json
{
  "fieldname": "trainer_id",
  "label": "Formateur",
  "fieldtype": "Link",
  "options": "Trainer",
  "required": true
}
```

======================================================================
8. TYPES DE CHAMPS
======================================================================

Taxonomie contrôlée :

Data · Text · Long Text · Integer · Decimal · Boolean · Date · Datetime · Time · Select · Link · Table · JSON · File · Image · Currency · Percent · Email · Phone

Ne pas laisser n’importe quel module inventer son fieldtype.

======================================================================
9. LINK
======================================================================

Comme Frappe : **Link** = référence vers un autre DocType.

Exemple : `Session.trainer_id` → fieldtype Link, options Trainer.

Permet : validation · search · permissions · metadata UI · dependency graph.

======================================================================
10. CHILD DOCTYPE
======================================================================

Un Child DocType n’est **PAS** une entité métier autonome. Il appartient à son parent.

Exemple : `SessionScheduleRow` avec `parent`, `parentfield`, `parenttype`, `idx`.

**ATTENTION :** `Enrollment` ne doit probablement **PAS** être Child DocType (permissions, workflow, documents, finance, evidence, lifecycle propre).

CHILD = composant structurel du parent.  
NORMAL DOCTYPE = entité métier indépendante.

======================================================================
11. SINGLE DOCTYPE
======================================================================

Settings : une seule instance **par école / instance** (singleton).

Exemples : `GSMSSettings` · `QualiopiSettings` · `FundingSettings` · `NotificationSettings` · `EveSettings`

Ne pas créer une table de centaines de pseudo-enregistrements de settings.

======================================================================
12. VIRTUAL DOCTYPE
======================================================================

Virtual DocType = metadata GSMS + UI/API/permissions GSMS + source externe.

Exemples futurs : ExternalEDOFOffer · ExternalOPCOCase · ExternalFranceTravailCase · PennylaneInvoiceView

**IMPORTANT :** ne pas utiliser Virtual DocType comme raccourci pour dupliquer FundingCase.  
Les données critiques GSMS restent dans GSMS. Virtual = vue/adaptateur externe.

======================================================================
13. DOCUMENT
======================================================================

Runtime Document porte :

`doctype` · `name` · `owner` · `creation` · `modified` · `modified_by` · `docstatus` · `data`

Méthodes : `insert()` · `save()` · `delete()` · `submit()` · `cancel()` · `reload()` · `validate()` · `has_permission()` · `check_permission()` · `get_before_save()`

======================================================================
14. CHAMPS SYSTÈME
======================================================================

Minimum standard (inspiration Frappe) :

`name` · `owner` · `creation` · `modified` · `modified_by` · `docstatus`

Éventuellement : `version`

Soft delete (`deleted_at` / `deleted_by`) uniquement si décision framework globale.

**GSMS School = single-tenant (une école, une DB). PAS de `tenant_id`. PAS de SaaS multi-clients.**

Le skill Frappe multi-site / isolation tenant **ne s’applique pas** au produit GSMS School.

======================================================================
14bis. PERSONNALISATION « ÉCOLE » (pas multi-tenant)
======================================================================

Custom Field / Property Override / Custom Permission = overlay de **cette** instance école.

Ce n’est **pas** un modèle `tenant_id` en base. Ne pas introduire de colonne tenant « au cas où ».

======================================================================
15. NAME N’EST PAS JUSTE UN UUID
======================================================================

Chaque Document possède `doctype` + `name`.

Exemple : doctype Session · name `SES-2026-00045`

======================================================================
16. NAMING STRATEGY
======================================================================

Stratégies : manual · autoincrement · field · series · expression · random · UUID · controller/script

**GSMS V1 :** UUID_INTERNAL · SERIES · FIELD · MANUAL

Exemples : Learner → LRN-000001 · Session → SES-2026-0045

Le moteur de naming **ne doit pas** être codé dans Session.

======================================================================
17. CONTROLLER
======================================================================

Chaque DocType peut avoir un Controller (SessionController, FundingCaseController, …).

Le core Document ne doit pas connaître HACCP, CPF ou Qualiopi.

======================================================================
18. DOCUMENT LIFECYCLE
======================================================================

Insertion : before_insert → before_naming → naming → before_validate → validate → before_save → DB insert → after_insert → on_update

Update : before_validate → validate → before_save → DB update → on_update

Submit : before_validate → validate → before_submit → submit → on_submit

Cancel : before_cancel → cancel → on_cancel

GSMS peut simplifier les noms, mais ne doit pas casser cette séparation.

======================================================================
19. VALIDATION
======================================================================

Trois niveaux :

1. **Framework** — required, type, length, link, unique, permission  
2. **DocType** — ex. Session.start_date < end_date  
3. **Business service** — règles multi-entités

Ne pas mettre toutes les règles métier dans le JSON metadata.

======================================================================
20. DOCSTATUS
======================================================================

DocStatus : DRAFT · SUBMITTED · CANCELLED

Séparé du **Business Status**.

Exemple Session : docstatus DRAFT · status CONFIRMED

Ne pas mélanger lifecycle documentaire et lifecycle métier.

======================================================================
21. SUBMITTABLE DOCUMENTS
======================================================================

Exemples : Invoice · AttendanceSheet · SignedAgreement · AuditReport

Après submit : modifications normales interdites. Corrections via amend / version / champs autorisés.

======================================================================
22. PERMISSIONS — CORRECTION MAJEURE
======================================================================

**NE PAS** créer un registre de permissions indépendant qui devine les permissions à partir du nom du DocType.

Chez Frappe : permissions associées au metadata du DocType.

```js
Session.permissions = [
  { role: "TrainingManager", permlevel: 0, read: true, create: true, write: true, delete: false },
  { role: "Trainer", permlevel: 0, read: true, write: false }
]
```

Le Permission Engine lit **DocMeta**.

======================================================================
23. DOCPERM
======================================================================

`DocPermission` : role · permlevel · if_owner · read · write · create · delete · submit · cancel · amend · report · export · import · print · email · share

Pas obligé de tout implémenter immédiatement — modèle extensible.

======================================================================
24. PERMISSION LEVEL
======================================================================

Chaque champ peut avoir permlevel 0 / 1 / 2.

Exemple FundingCase : level 0 status/provider/learner/session · level 1 amounts · level 2 margin/notes internes.

TrainingManager → 0 · FinanceManager → 0+1+2

======================================================================
25. USER PERMISSIONS / RECORD RESTRICTIONS
======================================================================

Rôles seuls insuffisants.

Exemple : Trainer lit Session **seulement si** `session.trainer_id = current user's Trainer`.

Couches : Role Permission + Record Permission + Link Permission

======================================================================
26. CHILD PERMISSIONS
======================================================================

Child DocType hérite du parent. Pas de ACL autonome injustifiée (ex. pas de `sessionschedule.read`).

======================================================================
27. CUSTOM PERMISSIONS
======================================================================

STANDARD (fourni GSMS) + CUSTOM (override **instance école**).  
Ne pas modifier directement la définition standard.

======================================================================
28. CUSTOM FIELD
======================================================================

Extension **instance** sans patcher le DocType standard. DocMeta compile Standard + Custom fields.

======================================================================
29. PROPERTY OVERRIDE
======================================================================

Équivalent Property Setter (ex. required=false → instance required=true). Ne pas patcher le DocType de base.

======================================================================
30. CUSTOMIZATION LAYER
======================================================================

```text
STANDARD DOCTYPE → CUSTOM FIELDS → PROPERTY OVERRIDES → CUSTOM PERMISSIONS → COMPILED DOCMETA
```

Consommateurs : Document Runtime · API · UI · Permission Engine

======================================================================
31. REST RESOURCE API
======================================================================

```text
GET/POST     /api/resource/{doctype}
GET/PATCH/DELETE /api/resource/{doctype}/{name}
```

Listing · filter · pagination · field selection · CRUD selon permissions.

======================================================================
32. META API
======================================================================

`GET /api/meta/{doctype}` → name · label · fields · permissions utilisateur · naming · workflow · actions · search fields · frontend hints

React construit des composants génériques autour de ce metadata.

======================================================================
33. PAS TOUT EN CRUD
======================================================================

CRUD = email, téléphone…  
COMMAND = session.confirm() · funding.submit() · invoice.issue() · audit.run() · attendance.sign()

→ RESOURCE API + COMMAND API

======================================================================
34. COMMAND API
======================================================================

```text
POST /api/actions/session/{name}/confirm
POST /api/actions/funding-case/{name}/submit
…
```

Charge Document → permission → validation → business service → save → events

======================================================================
35. WORKFLOW
======================================================================

WorkflowDefinition : document_type · state_field · states · transitions

Exemple FundingCaseLifecycle : DRAFT → … → PAID → CLOSED

======================================================================
36. WORKFLOW TRANSITION
======================================================================

source_state · target_state · allowed_roles · condition · action

Le moteur accepte : human · system · external transition

======================================================================
37. WORKFLOW ≠ N8N
======================================================================

DOCTYPE WORKFLOW = état métier.  
N8N = orchestration de tâches.

n8n poll OPCO → Funding Engine → Workflow transition → APPROVED

**Ne jamais utiliser n8n comme machine d’état principale.**

======================================================================
38. EVENTS
======================================================================

Lifecycle générique : doctype.before_insert · after_insert · before_update · after_update · submitted · cancelled

Domaines : session.confirmed · enrollment.confirmed · funding.approved · attendance.signed · survey.completed · complaint.created · invoice.issued

n8n écoute principalement les **événements métier**.

======================================================================
39. HOOKS
======================================================================

Modules étendent sans modifier le controller source. Hooks déclarés · traçables · testables. Pas d’import circulaire caché.

======================================================================
40. QUALIOPI — POINT CAPITAL
======================================================================

**QUALIOPI NE DOIT PAS POSSÉDER LES DONNÉES MÉTIER.**

Mauvais : `QualiopiIndicator12 { compliant: true }`

Correct :

```text
Business Document → Domain Event → Evidence Engine → Evidence → EvidenceLink → Qualiopi Engine → IndicatorCoverage
```

======================================================================
41–52. DOCTYPES PAR DOMAINE
======================================================================

**Qualiopi (contrôle) :** QualiopiCriterion · QualiopiIndicator · EvidenceRule · IndicatorCoverage · Audit · AuditSample · AuditFinding

**Evidence :** Evidence (source_doctype + source_name) · EvidenceLink

**Ordre domaines :** CORE → CRM → TRAINING → FUNDING → DOCUMENTS → QUALITY → EVIDENCE → QUALIOPI → AUDIT → FINANCE → **LMS**

**CRM :** Lead · Contact · Company · Learner · TrainingRequest · Opportunity · NeedsAnalysis · Positioning

Chaîne : Lead → TrainingRequest → NeedsAnalysis → Positioning → FundingCase → Enrollment → Session

**Training :** Program · Session · Enrollment · Trainer · Room · ScheduleSlot · AttendanceSheet · AttendanceEntry · Assessment · CertificationResult

**Funding :** FundingProvider · FundingCase · FundingRequirement · ExternalExchange · ExternalEntityMapping · ExternalStatusMapping · ConnectorConfiguration

**Documents :** DocumentTemplate · GeneratedDocument · SignatureRequest · SignedDocument · DocumentVersion

**Quality :** SurveyTemplate · SurveyResponse · Complaint · Finding · CorrectiveAction · WatchItem

**Finance :** Quote · Invoice · Payment · CreditNote · AccountingExport

**LMS (après socle) :** Course · CourseModule · Lesson · LearningResource · Quiz · Attempt · Progress

======================================================================
53–54. UI
======================================================================

Meta-driven : ListView · FormView · Search · Filters · Link Picker · Permissions · Standard Actions

**Ne pas** reproduire Frappe Desk. GSMS = React spécialisé.

Generic vs Specialized (SessionWorkspace, FundingCaseWorkspace, QualiopiDashboard, …)

======================================================================
55. API + EVE
======================================================================

READ simple : resource API possible.  
Commandes sensibles : EVE → Domain Tool → Command API → Document/Service → Policy → Action

======================================================================
56. SINGLE-SCHOOL (PAS MULTI-TENANT / PAS SaaS)
======================================================================

GSMS School = **une école, une DB**. Pas de `tenant_id`. Pas de `tenant_scope`.

Personnalisation = overlay metadata de l’instance, pas un modèle locataires.

======================================================================
57–60. CACHE META · VERSION · MIGRATIONS
======================================================================

DocMetaCache : doctype + metadata_version

schema_version sur DocType · MigrationPlan contrôlé

**JAMAIS** boot → DROP COLUMN auto. SAFE AUTO vs MANUAL MIGRATION REQUIRED.

======================================================================
61–62. AUDIT TRAIL · SUBMITTED
======================================================================

VersionEntry : doctype · name · changed_by · changed_at · changes · operation

Documents réglementaires / SignedAttendanceSheet SUBMITTED : amendement · new version · audit trail — pas de réécriture silencieuse.

======================================================================
63. REPOSITORY STRUCTURE CIBLE
======================================================================

```text
framework/doctype/
  definition/ field/ meta/ document/ controller/ registry/
  naming/ permissions/ workflow/ customization/ events/
  persistence/ migration/ api/ tests/

domains/
  crm/ training/ funding/ documents/ quality/
  evidence/ qualiopi/ audit/ finance/ lms/
```

**AUCUN** `framework/doctype/lms` · **AUCUN** `framework/doctype/qualiopi_logic`

======================================================================
64. DÉPENDANCES
======================================================================

Autorisé : domains → doctype framework  
Interdit : doctype framework → training | lms | qualiopi

======================================================================
65–68. AUDITS OBLIGATOIRES
======================================================================

| Doc | Chemin | Statut |
|-----|--------|--------|
| DOCTYPE_INVENTORY | [`docs/framework/DOCTYPE_INVENTORY.md`](./framework/DOCTYPE_INVENTORY.md) | FAIT |
| PERMISSION_AUDIT | [`docs/framework/PERMISSION_AUDIT.md`](./framework/PERMISSION_AUDIT.md) | FAIT |
| LMS_DRIFT | [`docs/framework/LMS_DRIFT.md`](./framework/LMS_DRIFT.md) | FAIT |
| QUALIOPI_DRIFT | [`docs/framework/QUALIOPI_DRIFT.md`](./framework/QUALIOPI_DRIFT.md) | FAIT |
| ANSWERS_15 (§79) | [`docs/framework/ANSWERS_15.md`](./framework/ANSWERS_15.md) | FAIT |
| MIGRATION_PLAN | [`docs/framework/MIGRATION_PLAN.md`](./framework/MIGRATION_PLAN.md) | FAIT |

======================================================================
69–71. TESTS · BOOT
======================================================================

Tests structurels (registry, DocMeta, DocField, controller, naming, child, single, virtual, permissions, permlevel, record, workflow, lifecycle, submit/cancel, meta/resource API).

Tests anti-drift (framework ↛ domain/lms/qualiopi · child ACL · perms consistent · Qualiopi control layer · Evidence has source · n8n ≠ state store).

Boot DEV : FAIL hard sur erreur structurelle — pas de warning silencieux.

======================================================================
72. CE QU’IL NE FAUT PLUS FAIRE
======================================================================

INTERDIT :

- PermissionRegistry parallèle sans lien DocMeta  
- Permissions uniquement dans React  
- Règles DocType uniquement Pydantic/SQL  
- DocTypes créés depuis le LMS  
- Qualiopi comme base opérationnelle  
- Confondre DocStatus et BusinessStatus  
- n8n propriétaire du workflow métier  
- CRUD générique pour actions métier sensibles  
- framework dépendant du domaine  

======================================================================
73–74. COPIER / NE PAS COPIER
======================================================================

**Garder conceptuellement :** DocType metadata · DocField · Document · Meta · Controller lifecycle · Naming · Role/permlevel/record perms · Child/Single/Virtual · Customization · Resource API · Workflow · Hooks · Audit/version

**Ne pas copier bêtement :** Frappe Desk · MariaDB naming · ERPNext · tous fieldtypes historiques · server scripts · multitenancy Frappe exacte

GSMS = React · PostgreSQL · notre backend · RBAC · Event Bus · n8n · EVE

======================================================================
75. PHILOSOPHIE
======================================================================

Frappe : DocType = Model + metadata + permissions + lifecycle + API

GSMS : DocType = Model métier + metadata + Document runtime + controller + permissions + workflow + audit + API + UI metadata + events

======================================================================
76. ORDRE DE RÉPARATION
======================================================================

PHASE 0 FREEZE → 1 AUDIT → 2 DocTypeDefinition+DocField → 3 DocMeta → 4 Document Runtime → 5 Controller Lifecycle → 6 Permissions+permlevel → 7 Naming → 8 Child/Single/Virtual → 9 Workflow → 10 Resource+Meta API → 11 Customization → 12 CRM OF → 13 Training → 14 Funding → 15 Quality/Evidence → 16 Qualiopi/Audit → 17 Finance → 18 LMS

Détail checklist : [`MIGRATION_PLAN.md`](./framework/MIGRATION_PLAN.md)

======================================================================
77. DEFINITION OF DONE
======================================================================

Le framework n’est **pas** terminé parce qu’un formulaire s’affiche.

Il est terminé lorsque : DocTypeDefinition · DocField · DocMeta compile · Document Runtime · Controller lifecycle · Naming · Link · Child · Single · Virtual contract · Permissions metadata-driven · permlevel · record-level · Workflow · Resource API · Meta API · Custom fields · Property overrides · Audit trail · tests anti-drift · **aucune dépendance LMS dans framework** · **aucun `tenant_id`**.

======================================================================
78–79. INSTRUCTIONS AGENTS
======================================================================

« Façon Frappe » ≠ « formulaires dynamiques ».

Le cœur = une définition meta d’un type documentaire pilote : schéma · champs · runtime · permissions · lifecycle · naming · relations · workflow · API · extensions · partie UI.

**Ne rien modifier structurellement** avant réponses factuelles aux 15 questions → voir [`ANSWERS_15.md`](./framework/ANSWERS_15.md) puis plan de migration.

======================================================================
80. DOCTRINE FINALE
======================================================================

DOCTYPE ≠ écran · ≠ table · ≠ formulaire · ≠ feature LMS  

DOCTYPE = définition structurelle d’un type de document métier.  
DOCUMENT = instance · DOCFIELD = metadata champ · DOCMETA = metadata résolue · CONTROLLER = comportement · DOCPERM = accès · PERMLEVEL = accès champs · WORKFLOW = états/transitions · CUSTOM FIELD = extension · PROPERTY OVERRIDE = personnalisation · CHILD = structure dépendante · SINGLE = singleton · VIRTUAL = source externe · RESOURCE API = CRUD générique · COMMAND API = actions métier.

======================================================================
81. GSMS
======================================================================

DOCTYPE FRAMEWORK = SOCLE  
CRM = entrée métier OF · TRAINING = organisation/exécution · FUNDING = financement · DOCUMENTS · QUALITY · EVIDENCE · QUALIOPI = contrôle transversal · AUDIT · FINANCE · LMS = apprentissage digital · EVE = assistante au-dessus · N8N = orchestration externe

======================================================================
82. RÈGLE NON NÉGOCIABLE
======================================================================

LE LMS NE DOIT PLUS PILOTER LE FRAMEWORK.  
QUALIOPI NE DOIT PLUS PILOTER LE FRAMEWORK.  
LES PERMISSIONS NE DOIVENT PLUS VIVRE DANS UN REGISTRE PARALLÈLE DÉSYNCHRONISÉ DU METADATA DOCTYPE.  
LE FRAMEWORK DOCTYPE DOIT REDEVENIR LE NOYAU TECHNIQUE COMMUN DE TOUT GSMS SCHOOL.

FIN.
