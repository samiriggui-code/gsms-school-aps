# GSMS SCHOOL — FUNDING CONNECTOR ARCHITECTURE V1
## CPF / EDOF — OPCO — France Travail — Entreprises — Régions — Agefiph — Transitions Pro — autres financeurs
## JSON / API / XML / n8n / Workflows / Evidence / Qualiopi

# 1. PRINCIPE FONDAMENTAL

Le financement ne doit PAS être codé directement dans les pages Session ou dans des workflows n8n indépendants.

Nous devons créer une véritable couche :

```text
FUNDING ENGINE
+
FUNDING CONNECTOR LAYER
```

Architecture :

```text
                         GSMS SCHOOL
                             │
                             ▼
                      FUNDING ENGINE
                             │
                             ▼
                    FUNDING CONNECTORS
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
      CPF                   OPCO             FRANCE TRAVAIL
      EDOF                  OPCO X                KAIROS
       │                     │                     │
 XML / PORTAL         API / PORTAL          PORTAL / API*
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                             ▼
                            n8n
                             │
                             ▼
                    EXTERNAL EXCHANGES
                             │
                             ▼
                     RESULT / STATUS
                             │
                             ▼
                        GSMS DATABASE
                             │
                   ┌─────────┴─────────┐
                   ▼                   ▼
             Evidence Engine      Qualiopi Engine
```

`*` uniquement lorsqu'une API officiellement disponible et autorisée existe.

---

# 2. NE JAMAIS SUPPOSER QUE TOUS LES FINANCEURS ONT UNE API

C’est une erreur architecturale importante à éviter.

Un financeur peut proposer :

```text
REST JSON API
SOAP API
XML IMPORT
CSV
SFTP
WEBHOOK
PORTAIL WEB
EMAIL
EDI
ACTION HUMAINE
```

GSMS doit donc avoir une abstraction unique.

```text
FundingConnector
```

avec plusieurs modes de transport.

---

# 3. TYPES DE CONNECTEURS

Créer :

```text
ConnectorTransport {
    REST_JSON
    SOAP_XML
    XML_FILE
    CSV_FILE
    SFTP
    WEBHOOK
    EMAIL
    MANUAL_PORTAL
}
```

Ainsi GSMS peut traiter CPF et un OPCO avec la même logique métier même si leur technologie d’échange est complètement différente.

---

# 4. EXEMPLE CPF / EDOF

Situation actuelle vérifiée :

EDOF permet actuellement de gérer son catalogue par :

```text
SAISIE MANUELLE
```

ou :

```text
IMPORT XML
```

Le portail officiel fournit un kit XML et une spécification d’import.

Il existe trois niveaux dans le catalogue :

```text
FORMATION
↓
ACTION
↓
SESSION
```

Le catalogue peut être mis à jour en important un nouveau fichier XML contenant l’état souhaité du catalogue.

Le kit XML officiel a encore été mis à jour en juin 2026.

DONC :

GSMS ne doit PAS coder :

```text
POST https://edof/api/session
```

en supposant qu’une API publique existe.

À la place :

```text
CPFConnector
```

peut actuellement implémenter :

```text
CATALOG_EXPORT
=
XML
```

et :

```text
DOSSIER_MANAGEMENT
=
MANUAL_ASSISTED
```

jusqu’à ce qu’une API officielle utilisable soit disponible.

---

# 5. EXPORT CATALOGUE CPF

Architecture :

```text
GSMS PROGRAM
↓
GSMS ACTION
↓
GSMS SESSION
↓
CPF MAPPER
↓
EDOF XML GENERATOR
↓
XSD VALIDATION
↓
XML FILE
↓
EDOF IMPORT
```

Exemple :

```text
Programme GSMS
ID PROGRAM-001

↓

CPF Mapper

↓

formation
action
session

↓

catalogue-edof.xml
```

---

# 6. IMPORTANT : LE MODÈLE GSMS RESTE INTERNE

GSMS ne doit jamais adopter directement le modèle EDOF comme modèle principal.

Mauvais :

```text
GSMS Program
=
EDOF Formation
```

Correct :

```text
GSMS Program
↓
External Mapping
↓
EDOF Formation
```

Créer :

```text
ExternalEntityMapping
```

Exemple :

```json
{
  "provider": "EDOF",
  "internal_type": "PROGRAM",
  "internal_id": "PROGRAM-001",
  "external_type": "FORMATION",
  "external_id": "GSMS-HACCP-001"
}
```

---

# 7. LE CONNECTEUR CPF

Structure :

```text
connectors/
└── cpf/
    ├── connector
    ├── mapping
    ├── catalog
    ├── xml
    ├── validation
    ├── dossier
    ├── status
    └── evidence
```

Fonctions :

```text
cpf.catalog.build()

cpf.catalog.validate()

cpf.catalog.export_xml()

cpf.dossier.prepare()

cpf.dossier.get_checklist()

cpf.dossier.record_external_status()

cpf.dossier.record_service_done()

cpf.dossier.record_payment()
```

Certaines fonctions sont automatiques.

Certaines servent uniquement à assister l’utilisateur lorsque l’action finale doit être faite sur EDOF.

---

# 8. MANUAL ASSISTED CONNECTOR

Concept extrêmement important.

Si aucune API officielle n’existe :

GSMS ne devient pas aveugle.

Créer :

```text
MANUAL_ASSISTED
```

Exemple :

EVE / GSMS :

```text
Dossier CPF #882
```

GSMS sait que l’étape actuelle est :

```text
SERVICE_DONE_REQUIRED
```

Il affiche :

```text
Action externe requise :
Déclarer la sortie de formation dans EDOF.
```

Utilisateur effectue l’action.

Puis :

```text
MARK_EXTERNAL_ACTION_COMPLETED
```

GSMS stocke :

```text
performed_by
performed_at
external_reference
comment
supporting_document
```

Ainsi le processus reste traçable.

---

# 9. FUNDING CASE

Créer un objet universel :

```text
FundingCase
```

Exemple :

```json
{
  "id": "FUND-000882",

  "organization_id": "ORG-001",

  "learner_id": "LEARNER-992",

  "session_id": "SESSION-045",

  "funder_type": "CPF",

  "funder_id": "EDOF",

  "external_reference": null,

  "requested_amount": 1800,

  "approved_amount": null,

  "currency": "EUR",

  "status": "READY_TO_SUBMIT",

  "transport": "MANUAL_PORTAL",

  "created_at": "2026-08-29T10:00:00Z"
}
```

---

# 10. STATE MACHINE FINANCEMENT

Tous les financeurs utilisent une state machine interne commune.

```text
DRAFT
↓
DOCUMENTS_REQUIRED
↓
READY_TO_SUBMIT
↓
SUBMITTED
↓
PENDING
↓
APPROVED
   │
   ├── PARTIALLY_APPROVED
   │
   └── REJECTED
↓
SERVICE_IN_PROGRESS
↓
SERVICE_COMPLETED
↓
JUSTIFICATION_REQUIRED
↓
READY_TO_INVOICE
↓
INVOICED
↓
PAYMENT_PENDING
↓
PAID
↓
CLOSED
```

Les statuts externes sont convertis vers les statuts GSMS.

---

# 11. NE PAS UTILISER DIRECTEMENT LES STATUTS DU FINANCEUR

Exemple fictif :

```text
OPCO A :
ACCORD_TOTAL

OPCO B :
PRISE_EN_CHARGE_ACCEPTEE

CPF :
ACCEPTED
```

GSMS normalise :

```text
APPROVED
```

Créer :

```text
ExternalStatusMapping
```

---

# 12. CONNECTOR INTERFACE

Tous les connecteurs implémentent idéalement :

```text
FundingConnector
```

Interface conceptuelle :

```text
identify_funder()

get_requirements()

build_application()

validate_application()

submit_application()

get_status()

sync_status()

submit_supporting_document()

declare_service_started()

declare_service_completed()

build_invoice_payload()

submit_invoice()

get_payment_status()

cancel()

get_external_link()
```

MAIS chaque connecteur déclare ses capacités.

---

# 13. CAPABILITY MODEL

Exemple CPF :

```json
{
  "provider": "EDOF",

  "capabilities": {
    "catalog_export": true,
    "catalog_transport": "XML_FILE",

    "application_api": false,

    "status_api": false,

    "invoice_api": false,

    "manual_portal": true
  }
}
```

Exemple futur :

```json
{
  "provider": "OPCO_X",

  "capabilities": {
    "application_api": true,
    "status_api": true,
    "document_upload_api": true,
    "invoice_api": true,
    "webhook": true
  }
}
```

---

# 14. POURQUOI LE CAPABILITY MODEL EST IMPORTANT

Ainsi le workflow dit :

```text
SUBMIT FUNDING CASE
```

et non :

```text
HTTP POST OPCO_X
```

Funding Engine demande :

```text
connector.submit_application()
```

Puis le connecteur décide :

```text
API
```

ou :

```text
GENERATE XML
```

ou :

```text
CREATE MANUAL TASK
```

---

# 15. OPCO

Il ne faut surtout pas construire :

```text
OPCO WORKFLOW
```

comme si tous les OPCO utilisaient le même portail.

Créer :

```text
OPCOConnector
```

puis :

```text
OPCOAdapter:Afdas

OPCOAdapter:Akto

OPCOAdapter:Atlas

OPCOAdapter:Constructys

OPCOAdapter:EP

OPCOAdapter:Ocapiat

OPCOAdapter:Opcommerce

OPCOAdapter:Opco2i

OPCOAdapter:Mobilites

OPCOAdapter:Sante

OPCOAdapter:Uniformation
```

Chaque adapter peut déclarer :

```text
API
PORTAL
FILE
EMAIL
```

selon les possibilités réelles.

---

# 16. CONNECTEUR OPCO GÉNÉRIQUE

Workflow :

```text
FUNDING_REQUEST_CREATED
↓
IDENTIFY OPCO
↓
LOAD OPCO RULES
↓
BUILD REQUIRED DOCUMENT LIST
↓
CHECK DOCUMENTS
↓
READY_TO_SUBMIT
↓
CONNECTOR
```

Connector :

```text
IF api_supported
    → API CALL

ELSE IF file_supported
    → GENERATE FILE

ELSE
    → MANUAL PORTAL TASK
```

---

# 17. IDENTIFICATION OPCO

Créer éventuellement :

```text
Company
↓
Convention collective
↓
IDCC
↓
OPCO Resolver
↓
OPCO
```

Mais toujours permettre une validation humaine.

Stocker :

```text
company.opco_id
company.idcc
company.collective_agreement
```

---

# 18. DOSSIER OPCO

```json
{
  "funder": "OPCO_ATLAS",

  "company": "COMPANY-551",

  "learner": "LEARNER-221",

  "program": "PROGRAM-77",

  "session": "SESSION-900",

  "documents": [
    "PROGRAM",
    "QUOTE",
    "AGREEMENT"
  ],

  "amount_requested": 2100,

  "status": "READY_TO_SUBMIT"
}
```

---

# 19. FRANCE TRAVAIL

Pour France Travail, GSMS doit également disposer d’un connecteur spécifique.

Les dispositifs peuvent inclure notamment :

```text
AIF
autres dispositifs France Travail
cofinancement CPF
```

Le processus AIF est aujourd’hui dématérialisé : l’organisme établit le devis en ligne, le demandeur le valide et celui-ci est ensuite transmis à France Travail. Cela ne suffit cependant pas à conclure qu’une API publique générale est disponible pour GSMS.

Donc :

```text
FranceTravailConnector
```

doit pouvoir commencer en :

```text
MANUAL_ASSISTED
```

et migrer vers API si une interface partenaire officielle est obtenue.

---

# 20. FRANCE TRAVAIL WORKFLOW

```text
TRAINING_REQUEST
↓
FRANCE_TRAVAIL_FUNDING_SELECTED
↓
CREATE FUNDING CASE
↓
CHECK REQUIRED INFORMATION
↓
PREPARE QUOTE
↓
READY_FOR_KAIROS / EXTERNAL PORTAL
↓
EXTERNAL SUBMISSION
↓
WAIT DECISION
↓
APPROVED / REJECTED
↓
TRAINING
↓
ENTRY DECLARATION
↓
ATTENDANCE
↓
EXIT
↓
SUPPORTING DOCUMENTS
↓
INVOICE
↓
PAYMENT
```

Les étapes exactes sont pilotées par le `FranceTravailConnector`, pas codées directement dans Session.

---

# 21. AUTRES FINANCEURS

Même système pour :

```text
AGEFIPH
REGION
TRANSITIONS PRO
ENTREPRISE
APPRENTISSAGE
AUTOFINANCEMENT
AUTRE FINANCEUR PUBLIC
```

Tous deviennent :

```text
FundingProvider
+
FundingConnector
```

---

# 22. JSON INTERNE CANONIQUE

Même si le système externe utilise XML, SOAP ou formulaire Web, GSMS doit parler JSON en interne.

Exemple :

```json
{
  "funding_case_id": "FUND-882",

  "provider": {
    "type": "OPCO",
    "code": "ATLAS"
  },

  "beneficiary": {
    "learner_id": "L-992"
  },

  "company": {
    "company_id": "C-551"
  },

  "training": {
    "program_id": "P-001",
    "session_id": "S-045"
  },

  "financial": {
    "training_cost": 1800,
    "requested_amount": 1800
  },

  "documents": [],

  "status": "READY_TO_SUBMIT"
}
```

---

# 23. CONNECTOR MAPPING

Puis :

```text
CANONICAL GSMS JSON
↓
PROVIDER MAPPER
↓
EXTERNAL FORMAT
```

Exemple CPF :

```text
GSMS JSON
↓
EDOF Mapper
↓
XML
```

Exemple OPCO API :

```text
GSMS JSON
↓
OPCO Mapper
↓
JSON PROVIDER PAYLOAD
```

---

# 24. INBOUND ET OUTBOUND

Il faut gérer les deux sens.

OUTBOUND :

```text
GSMS
↓
FINANCEUR
```

Exemple :

```text
demande
document
facture
déclaration
```

INBOUND :

```text
FINANCEUR
↓
GSMS
```

Exemple :

```text
accord
refus
demande complément
paiement
changement statut
```

---

# 25. WEBHOOK

Si un financeur fournit un webhook :

```text
FINANCEUR
↓
WEBHOOK
↓
GSMS CONNECTOR
↓
NORMALIZE EVENT
↓
EVENT BUS
```

Exemple :

```json
{
  "event": "funding.status_changed",

  "provider": "OPCO_X",

  "external_reference": "EXT-9921",

  "status": "APPROVED"
}
```

---

# 26. POLLING

Si API disponible mais aucun webhook :

```text
n8n Schedule Trigger
↓
Funding Connector
↓
GET external statuses
↓
compare
↓
update GSMS
```

Par exemple :

```text
every 4 hours
```

selon contraintes et limites API.

---

# 27. MANUAL STATUS

Si aucune API :

```text
TASK
↓
USER CHECKS PORTAL
↓
USER RECORDS RESULT
↓
FundingCase Updated
```

Cela reste un événement :

```text
funding.status_recorded
```

---

# 28. EXTERNAL EXCHANGE

Créer une table importante :

```text
ExternalExchange
```

Exemple :

```json
{
  "id": "EXTEX-001",

  "connector": "EDOF",

  "funding_case_id": "FUND-882",

  "direction": "OUTBOUND",

  "operation": "CATALOG_EXPORT",

  "transport": "XML_FILE",

  "request_reference": "catalog-2026-08.xml",

  "status": "COMPLETED",

  "performed_at": "2026-08-29T12:00:00Z"
}
```

---

# 29. EXTERNAL EXCHANGE POUR API

```json
{
  "direction": "OUTBOUND",

  "operation": "SUBMIT_APPLICATION",

  "transport": "REST_JSON",

  "connector": "OPCO_X",

  "external_reference": "REQ-88291",

  "http_status": 201,

  "status": "SUCCESS"
}
```

Ne jamais stocker secrets ou tokens API dans ce journal.

---

# 30. N8N

n8n sert à orchestrer.

Il NE possède PAS :

```text
FundingCase
```

comme source de vérité.

Workflow :

```text
GSMS Event
↓
n8n
↓
Funding Connector API
↓
External Provider
↓
Result
↓
GSMS callback
```

---

# 31. GSMS REST API POUR N8N

Exemple :

```text
GET /api/funding/cases/{id}

POST /api/funding/cases/{id}/events

POST /api/funding/cases/{id}/documents

POST /api/funding/cases/{id}/status

POST /api/external-exchanges
```

---

# 32. N8N NE DOIT PAS RECEVOIR TOUTE LA LOGIQUE MÉTIER

Mauvais :

```text
n8n:

IF CPF
...
IF OPCO
...
IF AIF
...
IF REGION
...
```

Correct :

```text
GSMS
↓
connector action
↓
n8n execution
```

Les règles appartiennent au Funding Engine / Connector Registry.

---

# 33. WORKFLOW FUNDING ROUTER

Créer un workflow générique :

```text
WF-FUNDING-ROUTER
```

Entrée :

```json
{
  "event": "funding.action_required",

  "funding_case_id": "FUND-882",

  "action": "SUBMIT_APPLICATION"
}
```

Puis :

```text
LOAD FUNDING CASE
↓
LOAD CONNECTOR
↓
LOAD CAPABILITY
↓
EXECUTE
```

---

# 34. CONNECTOR ACTION

Exemple :

```text
provider = CPF

action = EXPORT_CATALOG

transport = XML_FILE
```

↓

```text
GENERATE XML
↓
VALIDATE XML
↓
SAVE FILE
↓
CREATE EXTERNAL TASK
```

---

# 35. AUTRE CONNECTOR

```text
provider = OPCO_X

action = GET_STATUS

transport = REST_JSON
```

↓

```text
HTTP REQUEST
↓
NORMALIZE RESPONSE
↓
POST GSMS EVENT
```

---

# 36. N8N SUBWORKFLOWS

Créer des briques réutilisables :

```text
FUNDING_CONNECTOR_EXECUTE

FUNDING_API_REQUEST

FUNDING_WEBHOOK_RECEIVE

FUNDING_STATUS_SYNC

FUNDING_FILE_EXPORT

FUNDING_XML_VALIDATE

FUNDING_DOCUMENT_SEND

FUNDING_MANUAL_TASK

FUNDING_RETRY

FUNDING_CALLBACK_GSMS

EVIDENCE_REGISTER
```

---

# 37. IDEMPOTENCE

Indispensable.

Exemple :

```text
idempotency_key:

FUND-882:SUBMIT_APPLICATION:V1
```

Avant envoi :

```text
already sent ?
```

Oui :

```text
SKIP
```

Cela évite :

```text
double demande
double facture
double déclaration
```

---

# 38. RETRIES

Pour API :

```text
REQUEST
↓
FAIL
↓
RETRY
```

Exemple :

```text
5 minutes
30 minutes
2 hours
```

Puis :

```text
MANUAL_REVIEW_REQUIRED
```

---

# 39. NE PAS RETRY UNE ERREUR MÉTIER

HTTP 500 :

```text
retry
```

Mais :

```text
CERTIFICATION_NOT_ELIGIBLE
```

ne doit pas être retry automatiquement.

Créer :

```text
TECHNICAL_ERROR

BUSINESS_ERROR

AUTH_ERROR

VALIDATION_ERROR

MANUAL_ACTION_REQUIRED
```

---

# 40. DOCUMENTS

Chaque financeur peut demander des documents différents.

Créer :

```text
FundingRequirement
```

Exemple :

```json
{
  "provider": "OPCO_X",

  "workflow_stage": "APPLICATION",

  "required_documents": [
    "QUOTE",
    "PROGRAM",
    "AGREEMENT"
  ]
}
```

---

# 41. DOCUMENT CHECKLIST

Funding Engine produit :

```text
FundingChecklist
```

Exemple :

```text
Programme              OK
Devis                   OK
Convention              MISSING
RIB                     OK
Attestation Qualiopi    OK

READY TO SUBMIT:
NO
```

---

# 42. QUALIOPI ET FINANCEURS

Les workflows financeurs génèrent aussi des preuves Qualiopi potentielles.

Exemple :

```text
demande financeur
accord de financement
analyse du besoin entreprise
questionnaire entreprise
évaluation financeur
réclamation financeur
```

Mais :

```text
FINANCEMENT
≠
QUALIOPI
```

La relation passe par Evidence Engine.

---

# 43. EXEMPLE

```text
OPCO APPROVAL RECEIVED
↓
FundingCase
↓
Document
↓
Evidence Engine
↓
Evidence:
FUNDING_AGREEMENT
```

Puis Qualiopi Engine détermine si cette preuve est pertinente pour une exigence.

---

# 44. AUTRE EXEMPLE

```text
COMPANY NEEDS ANALYSIS
↓
needs_analysis.completed
↓
Evidence Engine
↓
NEEDS_ANALYSIS
↓
Qualiopi Engine
```

Le financeur ou l’entreprise devient une partie prenante du processus qualité.

---

# 45. QUESTIONNAIRE FINANCEUR

Après formation :

```text
SESSION COMPLETED
↓
FUNDER SATISFACTION WORKFLOW
↓
SURVEY
↓
RESPONSE
↓
Evidence Engine
↓
QUALITY ENGINE
```

Cela participe notamment au recueil et à la prise en compte des appréciations des parties prenantes.

---

# 46. QUALIOPI RESTE TRANSVERSAL

Le référentiel actuel reste organisé autour de :

```text
7 critères
```

avec :

```text
22 indicateurs communs
+
10 indicateurs spécifiques selon les situations
```

Le moteur Qualiopi doit donc observer aussi les événements issus des financeurs.

---

# 47. QUALIOPI CONNECTOR LINK

Créer :

```text
FundingEvent
↓
EvidenceRule
↓
Evidence
↓
QualiopiRequirement
```

Pas :

```text
OPCO Workflow
↓
IF indicator 4 = true
```

---

# 48. EVE ET FINANCEURS

EVE se branche au-dessus de Funding Engine.

Utilisateur :

> Eve, où en est le dossier OPCO de Martin ?

EVE :

```text
funding.get_case()
```

Puis :

> Le dossier a été envoyé le 18 août et reste en attente. La prochaine relance est prévue demain.

---

# 49. EVE ET ACTION MANUELLE

Utilisateur :

> Pourquoi le dossier CPF n’avance pas ?

EVE :

```text
funding.get_case()
↓
connector.get_next_action()
```

Réponse :

> GSMS a préparé le dossier. L’étape suivante doit être effectuée dans EDOF. Je peux t’ouvrir le dossier et te montrer les informations à reporter.

Voilà comment l’IA reste utile même sans API.

---

# 50. EVE ET API

Si API officielle disponible :

Utilisateur :

> Vérifie le dossier OPCO.

EVE :

```text
funding.sync(FUND-882)
```

↓

Connector

↓

API

↓

status

EVE :

> Le dossier vient de passer en accord total.

---

# 51. CREDENTIALS

Les secrets externes ne doivent jamais passer au LLM.

Architecture :

```text
EVE
↓
tool call
↓
GSMS Connector
↓
Secret Vault
↓
External API
```

Jamais :

```text
LLM
↓
API TOKEN
```

---

# 52. CONNECTOR CREDENTIALS

Créer :

```text
ConnectorCredential
```

avec :

```text
tenant_id
provider
credential_reference
environment
status
expires_at
```

Les vrais secrets restent :

```text
Vault / Secret Manager
```

---

# 53. MULTI-TENANT

Très important si plusieurs organismes utilisent GSMS.

Chaque organisme peut avoir :

```text
son compte EDOF
ses OPCO
son compte France Travail
ses identifiants
ses paramètres
```

Donc :

```text
tenant
↓
connector configuration
↓
credentials
```

---

# 54. CONNECTOR CONFIG

```json
{
  "tenant_id": "ORG-001",

  "provider": "EDOF",

  "enabled": true,

  "transport": "XML_FILE",

  "settings": {
    "catalog_export": true
  }
}
```

---

# 55. ENVIRONNEMENTS

Prévoir :

```text
SANDBOX
TEST
PRODUCTION
```

lorsque le fournisseur le permet.

---

# 56. VERSION DES CONNECTEURS

Important car les formats changent.

Exemple :

```text
EDOF XML VERSION 2026-06
```

Donc :

```text
ConnectorVersion
```

et :

```text
MappingVersion
```

---

# 57. VERSIONNER LES XSD

Pour EDOF :

```text
edof/
schemas/
2026-06/
...
```

Ne jamais télécharger dynamiquement une nouvelle spécification et l’utiliser directement en production.

---

# 58. VALIDATION AVANT EXPORT

Pipeline :

```text
GSMS DATA
↓
MAPPER
↓
XML
↓
XSD VALIDATOR
↓
BUSINESS VALIDATOR
↓
EXPORT
```

Si erreur :

```text
EXPORT BLOCKED
```

---

# 59. RAPPORT DE VALIDATION

Exemple :

```text
EDOF EXPORT

82 offres

78 valides

4 bloquées

PROGRAM-18
Certification inactive

PROGRAM-27
Téléphone invalide

PROGRAM-41
Session dupliquée

PROGRAM-52
Champ obligatoire absent
```

---

# 60. IMPORT DU COMPTE-RENDU EDOF

Prévoir également :

```text
EDOF IMPORT REPORT
↓
GSMS PARSER
↓
ERRORS
↓
PROGRAM / ACTION / SESSION
```

Même si cette étape nécessite actuellement un fichier récupéré par l’utilisateur.

---

# 61. ACTION CORRECTIVE

Exemple :

```text
EDOF REJECTION
↓
ExternalExchange FAILED
↓
Finding
↓
Correction
↓
NEW EXPORT
```

---

# 62. WORKFLOW COMPLET CPF

```text
PROGRAM CREATED
↓
CPF ELIGIBILITY CHECK
↓
EXTERNAL MAPPING
↓
CATALOG EXPORT READY
↓
BUILD XML
↓
VALIDATE
↓
EXPORT
↓
EDOF MANUAL IMPORT
↓
IMPORT RESULT
↓
SYNC GSMS STATUS


LEARNER CPF REQUEST
↓
FundingCase
↓
Eligibility
↓
Positioning
↓
Prerequisites
↓
Proposal
↓
External EDOF action
↓
Accepted
↓
Enrollment
↓
Training
↓
Attendance
↓
Assessment
↓
Training completed
↓
External completion action
↓
Invoice / payment process
↓
Close FundingCase
```

---

# 63. WORKFLOW COMPLET OPCO

```text
COMPANY
↓
IDENTIFY OPCO
↓
Training Request
↓
Needs Analysis
↓
Quote
↓
Convention
↓
FundingCase
↓
Required Documents
↓
Submit
↓
Wait
↓
Approval
↓
Training
↓
Attendance
↓
Completion
↓
Supporting Documents
↓
Invoice
↓
Payment
↓
Close
```

---

# 64. WORKFLOW COMPLET FRANCE TRAVAIL

```text
LEARNER
↓
Funding intention
↓
France Travail case
↓
Training / session
↓
Quote
↓
External submission
↓
Learner validation
↓
France Travail decision
↓
Training entry
↓
Attendance
↓
Training exit
↓
Supporting documents
↓
Invoice
↓
Payment
↓
Close
```

---

# 65. ARCHITECTURE GLOBALE

```text
                              GSMS
                                │
                                ▼
                         FUNDING ENGINE
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
           FundingCase     Requirements     State Machine
                │               │               │
                └───────────────┼───────────────┘
                                ▼
                       CONNECTOR REGISTRY
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
   CPF/EDOF                   OPCO                FRANCE TRAVAIL
       │                        │                        │
       ▼                        ▼                        ▼
   XML/Portal             API/Portal/File          Portal/API*
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                ▼
                               n8n
                                │
                  ┌─────────────┼─────────────┐
                  ▼             ▼             ▼
                 API           XML          MANUAL
                  │             │             │
                  └─────────────┼─────────────┘
                                ▼
                        EXTERNAL SYSTEM
                                │
                                ▼
                         EXTERNAL RESULT
                                │
                                ▼
                       NORMALIZATION LAYER
                                │
                                ▼
                          FUNDING EVENT
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
         FundingCase       Evidence Engine      Finance
                                │
                                ▼
                         Qualiopi Engine
                                │
                                ▼
                            Audit Engine
```

---

# 66. RÈGLE ABSOLUE

```text
NE PAS COUPLER GSMS DIRECTEMENT À EDOF.

NE PAS COUPLER GSMS DIRECTEMENT À UN OPCO.

NE PAS COUPLER GSMS DIRECTEMENT À FRANCE TRAVAIL.

GSMS PARLE À UN CONNECTEUR.

LE CONNECTEUR PARLE AU SYSTÈME EXTERNE.
```

Ainsi si demain :

```text
EDOF XML
```

devient :

```text
EDOF API
```

on remplace :

```text
EDOFConnectorV1
```

par :

```text
EDOFConnectorV2
```

sans réécrire :

```text
sessions
CRM
facturation
Qualiopi
EVE
n8n
```

---

# 67. RÈGLE N8N

```text
N8N
= ORCHESTRATEUR

PAS
= SOURCE DE VÉRITÉ
```

Il peut :

```text
appeler API
déposer fichier
attendre
relancer
recevoir webhook
transformer payload
envoyer callback
```

Mais :

```text
FundingCase
ExternalExchange
Documents
Evidence
Status
```

restent dans GSMS.

---

# 68. RÈGLE JSON

```text
GSMS PARLE JSON EN INTERNE.
```

Puis :

```text
JSON GSMS
↓
CONNECTOR
↓
JSON / XML / SOAP / CSV / PORTAL
```

Cela empêche la technologie du financeur de contaminer tout le projet.

---

# 69. RÈGLE QUALIOPI

```text
FINANCEUR
↓
EVENT
↓
EVIDENCE
↓
QUALIOPI
```

Jamais :

```text
FINANCEUR
↓
CASE QUALIOPI HARDCODÉ DANS N8N
```

---

# 70. RÈGLE EVE

```text
EVE
↓
FUNDING TOOLS
↓
FUNDING ENGINE
↓
CONNECTOR
```

Jamais :

```text
EVE
↓
OPENROUTER
↓
API OPCO DIRECTE
```

---

# 71. ARCHITECTURE DE RÉPERTOIRES CONSEILLÉE

```text
funding/

├── domain/
│   ├── funding_case
│   ├── funding_provider
│   ├── requirements
│   ├── statuses
│   └── events
│
├── connectors/
│
│   ├── base/
│   │   ├── connector
│   │   ├── capabilities
│   │   ├── mapping
│   │   └── transport
│   │
│   ├── edof/
│   │   ├── connector
│   │   ├── mapper
│   │   ├── xml
│   │   ├── validator
│   │   └── schemas/
│   │
│   ├── france_travail/
│   │   ├── connector
│   │   └── workflows
│   │
│   ├── opco/
│   │   ├── resolver
│   │   └── adapters/
│   │       ├── atlas
│   │       ├── akto
│   │       ├── afdas
│   │       └── ...
│   │
│   ├── agefiph/
│   ├── transitions_pro/
│   └── region/
│
├── exchanges/
│   ├── outbound
│   ├── inbound
│   ├── webhook
│   └── audit
│
└── services/
    ├── funding_service
    ├── connector_service
    ├── status_service
    └── evidence_service
```

---

# 72. CE QU’IL FAUT IMPÉRATIVEMENT CONSTRUIRE AVANT LES CONNECTEURS

Avant de coder EDOF, OPCO ou France Travail :

```text
1. FundingProvider

2. FundingCase

3. FundingStatus

4. FundingRequirement

5. ConnectorRegistry

6. ConnectorCapabilities

7. ExternalEntityMapping

8. ExternalStatusMapping

9. ExternalExchange

10. FundingEvent

11. FundingDocumentLink

12. FundingEvidenceLink
```

Ensuite seulement :

```text
EDOF Connector

OPCO Connectors

France Travail Connector

Agefiph Connector

etc.
```

---

# 73. OBJECTIF FINAL

Un dossier GSMS doit pouvoir traverser :

```text
INSCRIPTION
↓
FINANCEUR IDENTIFIÉ
↓
DOSSIER CONSTITUÉ
↓
PIÈCES CONTRÔLÉES
↓
ENVOI / ACTION PORTAIL
↓
DÉCISION
↓
FORMATION
↓
PRÉSENCE
↓
SERVICE RÉALISÉ
↓
JUSTIFICATIFS
↓
FACTURATION
↓
PAIEMENT
↓
PREUVES
↓
QUALIOPI
↓
AUDIT
```

sans que l’utilisateur perde la traçabilité simplement parce qu’une partie du processus a lieu sur une plateforme externe.

---

# 74. DOCTRINE FINALE À IMPOSER À CLAUDE / CURSOR

```text
GSMS SCHOOL DOIT ÊTRE CAPABLE DE COMMUNIQUER AVEC LES FINANCEURS SANS DÉPENDRE DE LEUR TECHNOLOGIE.

LE MODÈLE INTERNE EST JSON ET CANONIQUE.

CHAQUE FINANCEUR EST REPRÉSENTÉ PAR UN CONNECTEUR.

UN CONNECTEUR DÉCLARE SES CAPACITÉS.

UN CONNECTEUR PEUT UTILISER REST, JSON, XML, SOAP, CSV, SFTP, WEBHOOK OU UNE ACTION HUMAINE SUR PORTAIL.

N8N ORCHESTRE LES ÉCHANGES.

N8N N'EST PAS LA BASE MÉTIER.

POSTGRESQL CONSERVE LE DOSSIER ET SON ÉTAT.

EXTERNAL EXCHANGE CONSERVE LA TRACE DES COMMUNICATIONS.

LES ÉVÉNEMENTS FINANCEURS PRODUISENT DES PREUVES.

LES PREUVES ALIMENTENT QUALIOPI.

QUALIOPI N'EST JAMAIS HARDCODÉ DANS LES CONNECTEURS.

EVE UTILISE LE FUNDING ENGINE ET NE PARLE JAMAIS DIRECTEMENT AUX SYSTÈMES FINANCEURS.

SI UNE API OFFICIELLE EST DISPONIBLE :
UTILISER L'API.

SI UN IMPORT XML EST OFFICIEL :
UTILISER XML.

SI SEUL UN PORTAIL EST DISPONIBLE :
CRÉER UN WORKFLOW MANUAL_ASSISTED.

NE JAMAIS INVENTER UNE API QUI N'EXISTE PAS.

NE JAMAIS SCRAPER UN PORTAIL AUTHENTIFIÉ COMME SI C'ÉTAIT UNE INTÉGRATION OFFICIELLE.

NE JAMAIS PERDRE LA TRAÇABILITÉ SOUS PRÉTEXTE QUE L'ACTION EST EXTERNE.
```

# 75. POINT IMPORTANT ACTUEL — CPF / EDOF

À la date actuelle, GSMS doit partir sur cette hypothèse concrète :

```text
CATALOGUE CPF / EDOF
=
GSMS
↓
CANONICAL DATA
↓
EDOF MAPPER
↓
XML GENERATOR
↓
VALIDATION
↓
XML EXPORT
↓
IMPORT EDOF
```

et non sur une API JSON imaginaire.

EDOF documente actuellement la saisie manuelle et l’import XML pour la publication du catalogue. Le kit XML officiel a été actualisé en juin 2026.

On doit néanmoins conserver :

```text
EDOFConnector
```

comme abstraction afin que si une API partenaire officielle devient disponible ultérieurement :

```text
XML Transport
↓
API Transport
```

puisse être remplacé sans toucher au reste de GSMS.

---

# 76. RÉSULTAT ARCHITECTURAL

À la fin nous obtenons :

```text
                       GSMS SCHOOL
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
        SESSION          FINANCE          QUALITY
                            │
                            ▼
                     FUNDING ENGINE
                            │
                            ▼
                    CONNECTOR LAYER
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
     CPF/EDOF             OPCO            FRANCE TRAVAIL
        │                   │                   │
        ▼                   ▼                   ▼
       XML              API/Portal           Portal/API
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                           n8n
                            │
                            ▼
                      EXTERNAL WORLD
                            │
                            ▼
                         EVENTS
                            │
             ┌──────────────┼───────────────┐
             ▼              ▼               ▼
       FUNDING CASE       FINANCE         EVIDENCE
                                             │
                                             ▼
                                        QUALIOPI
                                             │
                                             ▼
                                          AUDIT
                                             │
                                             ▼
                                            EVE
```

Cette couche **Funding Engine + Connector Registry + n8n + Evidence/Qualiopi** doit donc faire partie du socle GSMS, pas être ajoutée à la fin comme une simple intégration.