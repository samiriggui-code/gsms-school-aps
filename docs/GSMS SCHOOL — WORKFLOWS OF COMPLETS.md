# GSMS SCHOOL — WORKFLOWS OF COMPLETS
## Cycle de vie formation, session, examen, satisfaction, financeurs et Qualiopi

## 1. OBJECTIF

GSMS School doit gérer le cycle de vie complet d’un organisme de formation, depuis le premier contact avec un prospect jusqu’à :

```text
INSCRIPTION
→ ANALYSE DU BESOIN
→ POSITIONNEMENT
→ FINANCEMENT
→ CONTRACTUALISATION
→ PRÉPARATION DE SESSION
→ CONVOCATION
→ FORMATION
→ ÉMARGEMENT
→ SUIVI PÉDAGOGIQUE
→ ÉVALUATIONS
→ EXAMEN / CERTIFICATION
→ FIN DE SESSION
→ SATISFACTION
→ FACTURATION
→ FINANCEUR
→ AMÉLIORATION CONTINUE
→ PREUVES
→ QUALIOPI
→ AUDIT
```

Le principe central est :

> Les workflows métier produisent les vraies données et les vraies preuves.  
> Le moteur Qualiopi observe ensuite ces données et contrôle leur couverture.

GSMS ne doit donc pas ajouter un faux workflow « Qualiopi » séparé qui oblige l’utilisateur à ressaisir les mêmes informations.

---

# 2. RÔLE DE GSMS ET DE N8N

La séparation doit être stricte.

```text
GSMS SCHOOL
= cerveau métier
= source de vérité
= règles métier
= états
= données
= documents
= preuves
= permissions
= historique

PostgreSQL
= persistance des données

n8n / Workflow Engine
= orchestration
= délais
= relances
= notifications
= appels API
= génération documentaire
= synchronisations externes

Evidence Engine
= enregistrement et rattachement des preuves

Qualiopi Engine
= contrôle des exigences

Audit Engine
= audit blanc / analyse / échantillonnage
```

n8n ne doit PAS devenir la base métier principale.

n8n doit recevoir des événements de GSMS :

```text
SESSION_CREATED
REGISTRATION_CONFIRMED
FUNDING_APPROVED
SESSION_STARTED
ATTENDANCE_MISSING
SESSION_COMPLETED
EXAM_RESULT_RECEIVED
SURVEY_COMPLETED
PAYMENT_RECEIVED
```

puis exécuter les automatisations nécessaires.

---

# 3. MODÈLE ÉVÉNEMENTIEL

Chaque workflow doit suivre :

```text
EVENT
↓
CONDITIONS
↓
ACTIONS
↓
RESULTS
↓
EVIDENCES
↓
QUALIOPI RE-EVALUATION
```

Exemple :

```text
EVENT:
SESSION_COMPLETED

CONDITION:
satisfaction_trainee_not_sent = true

ACTION:
send_satisfaction_questionnaire

RESULT:
questionnaire_sent

EVIDENCE:
SATISFACTION_REQUEST_SENT

QUALIOPI:
recalculate affected requirements
```

---

# 4. TROIS GRANDES FAMILLES DE WORKFLOWS

Il faut séparer :

```text
A. SESSION WORKFLOWS
B. ORGANIZATION WORKFLOWS
C. FUNDER WORKFLOWS
```

Les 32 indicateurs Qualiopi ne doivent PAS être forcés artificiellement dans chaque session.

Certaines preuves sont liées à la session.

D’autres sont liées à :

```text
ORGANISME
PROGRAMME
FORMATEUR
PROCESSUS
FINANCEUR
SOUS-TRAITANT
VEILLE
HANDICAP
AMÉLIORATION CONTINUE
```

---

# 5. A — SESSION WORKFLOWS

## WF-01 — Prospect → demande de formation

Déclencheur :

```text
NEW_TRAINING_REQUEST
```

Actions :

```text
créer prospect
identifier bénéficiaire
identifier entreprise éventuelle
identifier besoin initial
identifier formation demandée
identifier financement pressenti
créer opportunité CRM
```

Données :

```text
lead
contact
company
requested_training
request_date
funding_intent
```

---

# 6. WF-02 — Analyse du besoin

Déclencheur :

```text
TRAINING_REQUEST_CREATED
```

Actions :

```text
envoyer questionnaire d’analyse du besoin
collecter contexte professionnel
collecter objectifs
collecter contraintes
collecter attentes
identifier entreprise
identifier financeur
identifier besoins d’adaptation
```

Sortie :

```text
NEEDS_ANALYSIS_COMPLETED
```

Cette étape doit pouvoir produire une preuve Qualiopi.

Le JSON d’audit que nous avons analysé contient justement une exigence d’analyse du besoin en lien avec le bénéficiaire, l’entreprise ou le financeur.

---

# 7. WF-03 — Positionnement initial

Déclencheur :

```text
NEEDS_ANALYSIS_COMPLETED
```

Actions :

```text
questionnaire préformation
test de niveau
auto-évaluation
entretien
analyse prérequis
```

Résultats :

```text
level
skills_before
prerequisites_status
adaptation_required
```

Evidence :

```text
ENTRY_ASSESSMENT
POSITIONING_COMPLETED
```

Le JSON Qualiopi prévoit explicitement le positionnement et l’évaluation des acquis à l’entrée.

---

# 8. WF-04 — Accessibilité / handicap

Déclencheurs possibles :

```text
REGISTRATION_CREATED
NEEDS_ANALYSIS_COMPLETED
SPECIAL_NEED_DECLARED
```

Actions :

```text
identifier besoin spécifique
notifier référent handicap
évaluer adaptation
contacter partenaire externe si nécessaire
documenter solution
```

Statuts :

```text
NO_ADAPTATION_REQUIRED
ADAPTATION_PENDING
ADAPTATION_APPROVED
ADAPTATION_IMPLEMENTED
```

---

# 9. WF-05 — Qualification du dossier

Le système vérifie :

```text
identité
coordonnées
prérequis
analyse du besoin
positionnement
programme
date
financement
documents obligatoires
consentements
```

Résultat :

```text
APPLICATION_COMPLETE
```

ou :

```text
APPLICATION_INCOMPLETE
```

Si incomplet :

```text
création liste pièces manquantes
relance automatique
alerte gestionnaire
```

---

# 10. WF-06 — Choix du financement

GSMS doit définir :

```text
funding_type
```

Valeurs possibles :

```text
SELF_FUNDED
COMPANY
CPF
OPCO
FRANCE_TRAVAIL
REGION
AGEFIPH
TRANSITIONS_PRO
APPRENTICESHIP
OTHER
```

Ensuite :

```text
IF CPF
→ CPF WORKFLOW

IF OPCO
→ OPCO WORKFLOW

IF COMPANY
→ COMPANY FUNDING WORKFLOW

IF SELF_FUNDED
→ INDIVIDUAL PAYMENT WORKFLOW
```

---

# 11. WF-07 — Devis

Actions :

```text
calcul prix
appliquer tarif
appliquer remise autorisée
identifier TVA
identifier financeur
générer devis
envoyer devis
```

Cycle :

```text
DRAFT
→ SENT
→ VIEWED
→ ACCEPTED
→ REJECTED
→ EXPIRED
```

---

# 12. WF-08 — Convention / contrat

Selon situation :

```text
entreprise
→ convention de formation

particulier
→ contrat de formation

formateur externe
→ convention / contrat d’intervention
```

Cycle :

```text
GENERATED
→ SENT
→ VIEWED
→ SIGNED
→ ARCHIVED
```

En cas d’absence de signature :

```text
J+2 reminder
J+5 reminder
alerte gestionnaire
```

---

# 13. WF-09 — Validation inscription

Préconditions :

```text
prérequis OK
financement OK ou procédure définie
contrat/convention OK
session disponible
```

Résultat :

```text
REGISTRATION_CONFIRMED
```

La personne devient officiellement :

```text
LEARNER
```

sur la session.

---

# 14. WF-10 — Création session

Objet :

```text
Session {
 id
 program_id
 start_date
 end_date
 modality
 location
 trainer
 learners[]
 funders[]
 slots[]
 status
}
```

Cycle :

```text
DRAFT
→ PLANNED
→ CONFIRMED
→ READY
→ RUNNING
→ COMPLETED
→ CLOSED
→ ARCHIVED
```

---

# 15. WF-11 — Contrôle J-30

Déclencheur :

```text
SESSION_START - 30 DAYS
```

Contrôler :

```text
formateur
salle
matériel
programme
planning
accessibilité
financement
documents
prérequis
capacité
```

Si problème :

```text
CREATE_FINDING
```

---

# 16. WF-12 — J-15 contractualisation

Actions :

```text
vérifier conventions
vérifier contrats
vérifier signatures
vérifier financeurs
relancer documents manquants
```

---

# 17. WF-13 — J-10 convocation

Envoyer :

```text
convocation
programme
planning
plan d’accès
modalités de connexion
contacts
informations pratiques
règlement
modalités d’évaluation
informations accessibilité
```

Créer :

```text
CONVOCATION_SENT
PRETRAINING_INFORMATION_SENT
```

Le questionnaire de satisfaction fourni vérifie précisément l’information préalable : convocation, plan d’accès, programme et but de la formation.

Cela permet ensuite de comparer :

```text
preuve d’envoi
VS
perception du stagiaire
```

---

# 18. WF-14 — J-5 préparation pédagogique

Actions :

```text
envoyer positionnement final si nécessaire
envoyer test préformation
collecter attentes
rappeler horaires
vérifier besoins spécifiques
vérifier matériel
```

---

# 19. WF-15 — J0 entrée en formation

Déclencheur :

```text
SESSION_STARTED
```

Actions :

```text
ouvrir présence
ouvrir ressources pédagogiques
envoyer message de bienvenue
confirmer formateur
activer espace apprenant
ouvrir suivi pédagogique
```

---

# 20. WF-16 — Émargement

Pour chaque créneau :

```text
SLOT_STARTED
↓
ouvrir émargement
↓
signature apprenant
↓
signature formateur
↓
horodatage
↓
contrôle présence
```

Support :

```text
mobile
web
QR code
tablette
```

Résultat :

```text
ATTENDANCE_CONFIRMED
```

---

# 21. WF-17 — Signature manquante

Déclencheur :

```text
SLOT_COMPLETED
AND
signature_missing
```

Actions :

```text
notifier apprenant
notifier formateur
relancer
alerter administration
```

La preuve ne doit jamais être fabriquée.

---

# 22. WF-18 — Gestion absence

Déclencheur :

```text
LEARNER_ABSENT
```

Actions :

```text
enregistrer absence
demander justification
notifier formateur
notifier entreprise si applicable
notifier financeur si nécessaire
```

Statuts :

```text
UNJUSTIFIED
JUSTIFICATION_REQUESTED
JUSTIFIED
RESOLVED
```

---

# 23. WF-19 — Prévention rupture de parcours

Déclencheurs :

```text
absence
LMS inactivity
failed assessment
trainer warning
learner complaint
multiple missed sessions
```

Alors :

```text
DROP_OUT_RISK
↓
contact apprenant
↓
analyse cause
↓
contact entreprise si applicable
↓
proposition corrective
↓
suivi
↓
résolution
```

Le JSON Qualiopi contient précisément une exigence relative à l’engagement des bénéficiaires et à la prévention des ruptures de parcours.

---

# 24. WF-20 — Bilan formateur quotidien

Après chaque créneau :

```text
SLOT_COMPLETED
↓
demander compte-rendu formateur
```

Informations :

```text
contenu réalisé
objectifs travaillés
avancement
difficultés
incidents
absences
adaptations
observations
```

Evidence :

```text
TRAINER_DAILY_REPORT
```

---

# 25. WF-21 — Évaluation formative

Pendant la formation :

```text
quiz
exercice
cas pratique
mise en situation
observation formateur
```

Stocker :

```text
objective_id
learner_id
score
result
feedback
attempt
timestamp
```

---

# 26. WF-22 — Évaluation finale

Déclencheur :

```text
SESSION_ENDING
```

Contrôler l’atteinte des objectifs.

Résultat :

```text
OBJECTIVE_1 ACQUIRED
OBJECTIVE_2 ACQUIRED
OBJECTIVE_3 PARTIAL
```

Le JSON d’audit inclut explicitement l’évaluation de l’atteinte des objectifs de la prestation.

---

# 27. WF-23 — Certification / examen

Si formation certifiante :

```text
TRAINING_COMPLETED
↓
vérifier heures
↓
vérifier évaluations
↓
vérifier conditions de présentation
↓
inscrire candidat
↓
générer convocation examen
↓
EXAM_SCHEDULED
```

Puis :

```text
EXAM_COMPLETED
↓
RESULT_RECEIVED
```

Résultats :

```text
PASS
FAIL
ABSENT
PARTIAL
```

Données :

```text
certifier
exam_center
exam_date
candidate_number
score
blocks_acquired
certificate_number
```

Le JSON Qualiopi prévoit explicitement le respect des conditions formelles de présentation à une certification.

---

# 28. WF-24 — Échec examen

```text
FAIL
↓
analyser résultat
↓
proposer rattrapage
↓
notifier apprenant
↓
notifier financeur si nécessaire
↓
nouvelle date
```

---

# 29. WF-25 — Clôture pédagogique

À la fin :

```text
SESSION_COMPLETED
```

Vérifier :

```text
émargements
heures
évaluations
bilans formateur
incidents
progression
examen
documents
```

Résultat possible :

```text
READY_TO_CLOSE
```

ou :

```text
COMPLETED_WITH_FINDINGS
```

---

# 30. WF-26 — Attestation et certificat

Si conditions remplies :

```text
générer attestation
générer certificat de réalisation
générer relevé de compétences
générer document de fin
```

Ne jamais délivrer un document si les conditions métier correspondantes ne sont pas remplies.

---

# 31. WF-27 — Satisfaction stagiaire à chaud

Le premier JSON fourni peut servir de base de questionnaire.

Il contient les informations d’identification de la formation et du formateur, puis des questions de satisfaction sur :

```text
information préalable
accueil
animation
moyens pédagogiques
contenu
échanges
organisation matérielle
mise en pratique
appréciation générale
```



Workflow :

```text
SESSION_COMPLETED
↓
WAIT 1 HOUR
↓
SEND SURVEY
↓
WAIT 48 HOURS
↓
response ?
```

Si oui :

```text
store response
calculate score
generate evidence
```

Si non :

```text
send reminder
```

---

# 32. WF-28 — Satisfaction entreprise

Envoyer au responsable / commanditaire.

Évaluer :

```text
adéquation au besoin
organisation
communication
atteinte des objectifs
impact observé
formateur
recommandation
```

---

# 33. WF-29 — Satisfaction formateur

Évaluer :

```text
organisation
profil des participants
matériel
conditions
programme
objectifs
support administratif
incidents
```

---

# 34. WF-30 — Satisfaction financeur

Si pertinent :

```text
qualité administrative
réalisation
respect engagements
documents
communication
```

---

# 35. WF-31 — Satisfaction à froid

Déclencheur configurable :

```text
SESSION_END + 30 DAYS
SESSION_END + 45 DAYS
SESSION_END + 90 DAYS
```

Évaluer :

```text
mise en pratique des compétences
impact professionnel
transfert des acquis
utilité
évolution
besoins complémentaires
```

---

# 36. WF-32 — Analyse automatique des satisfactions

Chaque réponse alimente :

```text
QUALITY_METRIC
```

Si score < seuil :

```text
QUALITY_ALERT
↓
CREATE_FINDING
```

Si commentaire critique :

```text
MANUAL_REVIEW_REQUIRED
```

---

# 37. WF-33 — Réclamation

Canaux :

```text
portail
email
formulaire
téléphone enregistré manuellement
```

Cycle :

```text
OPEN
→ ACKNOWLEDGED
→ INVESTIGATING
→ ACTION_REQUIRED
→ RESOLVED
→ CLOSED
```

---

# 38. WF-34 — Action corrective

Une anomalie peut provoquer :

```text
Finding
↓
root cause
↓
corrective action
↓
owner
↓
deadline
↓
implementation
↓
verification
↓
closure
```

---

# 39. B — ORGANIZATION WORKFLOWS

Certains indicateurs Qualiopi ne concernent pas une session particulière.

Ils doivent disposer de workflows organisme.

---

# 40. WF-35 — Veille réglementaire

Workflow périodique :

```text
SCHEDULE
↓
collect sources
↓
detect change
↓
qualify relevance
↓
create veille item
↓
assign owner
↓
analyse impact
↓
record action
```

Le JSON d’audit contient une exigence spécifique de veille légale et réglementaire.

---

# 41. WF-36 — Veille métiers / emplois / compétences

```text
collecter sources
↓
nouvelle tendance
↓
analyse
↓
impact catalogue
↓
mise à jour programme éventuelle
```

Le même JSON Qualiopi comporte également ce contrôle.

---

# 42. WF-37 — Veille pédagogique / technologique

```text
nouvelle méthode
nouvel outil
nouvelle technologie
↓
analyse
↓
test éventuel
↓
décision
↓
adaptation des programmes
```

Également présent dans le JSON Qualiopi.

---

# 43. WF-38 — Compétences formateur

Pour chaque formateur :

```text
CV
qualification
certifications
expérience
compétences
formations suivies
évaluations
```

Workflow :

```text
document_expiring
↓
request update
```

ou :

```text
annual review
↓
competency gap
↓
development action
```

---

# 44. WF-39 — Sous-traitants

Lorsqu’un formateur ou organisme sous-traitant intervient :

```text
qualification
documents
engagements
compétences
conformité
contrat
évaluation
```

Cycle :

```text
PENDING_VALIDATION
→ APPROVED
→ ACTIVE
→ REVIEW_REQUIRED
→ SUSPENDED
```

---

# 45. WF-40 — Référent handicap

Maintenir :

```text
référent
partenaires
ressources
procédures
formations du référent
actions réalisées
```

---

# 46. C — FUNDER WORKFLOWS

Cette couche est indépendante du déroulement pédagogique.

Une même session peut être pédagogiquement terminée alors que son financement reste :

```text
PENDING
```

Il faut donc découpler les deux.

---

# 47. WF-41 — Entreprise / financement B2B

```text
demande entreprise
↓
devis
↓
validation
↓
convention
↓
session
↓
réalisation
↓
attestation
↓
facture
↓
paiement
```

---

# 48. WF-42 — OPCO

Cycle cible :

```text
identifier entreprise
↓
identifier OPCO
↓
collecter dossier
↓
demande de prise en charge
↓
SUBMITTED
↓
PENDING
↓
APPROVED / PARTIAL / REJECTED
```

Si approuvé :

```text
session
↓
émargements
↓
réalisation
↓
documents justificatifs
↓
facture
↓
demande de règlement
↓
PAID
```

Données :

```text
opco
funding_request_id
requested_amount
approved_amount
agreement_reference
submission_date
decision_date
status
supporting_documents
invoice
payment
```

---

# 49. WF-43 — CPF / EDOF

GSMS doit gérer son propre état interne.

Exemple :

```text
CPF_REQUEST
↓
TO_PROCESS
↓
prerequisites_check
↓
ACCEPTED / REJECTED
↓
REGISTRATION_CONFIRMED
↓
TRAINING_STARTED
↓
TRAINING_COMPLETED
↓
SERVICE_DONE
↓
INVOICED
↓
PAID
↓
ARCHIVED
```

GSMS doit tracer :

```text
cpf_dossier_id
learner
training
funding_amount
dates
status_history
service_done
invoice
payment
```

Il faut distinguer :

```text
AUTOMATISATION INTERNE
```

et :

```text
ACTIONS EXTERNES EDOF
```

Tout ce qui n’est pas officiellement accessible par API ou import autorisé reste une action humaine assistée.

---

# 50. WF-44 — France Travail

Modèle générique :

```text
dossier
↓
prescription / demande
↓
pièces
↓
validation
↓
formation
↓
réalisation
↓
justificatifs
↓
facturation / règlement
```

Le workflow exact doit rester paramétrable selon le dispositif.

---

# 51. WF-45 — Autres financeurs

Même moteur générique :

```text
FunderWorkflow
```

avec :

```text
rules
required_documents
deadlines
states
billing_rules
```

Pour ne pas coder un système différent pour chaque financeur.

---

# 52. FINANCEUR COMME STATE MACHINE

Créer :

```text
FundingCase
```

Statuts génériques :

```text
DRAFT
DOCUMENTS_REQUIRED
READY_TO_SUBMIT
SUBMITTED
PENDING
APPROVED
PARTIALLY_APPROVED
REJECTED
SERVICE_IN_PROGRESS
SERVICE_COMPLETED
JUSTIFICATION_PENDING
INVOICED
PAID
CLOSED
```

---

# 53. EVIDENCE ENGINE

Toutes les familles précédentes alimentent :

```text
Evidence Engine
```

Exemples :

```text
needs_analysis
positioning_result
signed_contract
convocation_sent
attendance_signature
trainer_report
assessment_result
exam_result
survey_response
complaint_resolution
funding_agreement
invoice
payment
watch_record
trainer_certificate
```

---

# 54. MODÈLE DE PREUVE

```text
Evidence {
    id

    evidence_type

    source_type
    source_id

    organization_id

    program_id?
    session_id?
    learner_id?
    trainer_id?
    company_id?
    funder_id?

    created_at

    event_id

    document_id?

    version

    validity_start?
    validity_end?

    status

    metadata

    indicator_links[]
}
```

---

# 55. UNE PREUVE PEUT COUVRIR PLUSIEURS EXIGENCES

Ne pas forcer :

```text
1 evidence
=
1 indicator
```

Prévoir :

```text
Evidence
↓
EvidenceIndicatorLink
↓
Indicator
```

---

# 56. QUALIOPI ENGINE

Le second JSON fourni devient une excellente base conceptuelle.

Il représente un audit interne contenant les 32 questions, avec :

```text
OK
KO
À réparer
N/A
```



Mais GSMS doit améliorer ce modèle.

Statuts internes recommandés :

```text
NOT_APPLICABLE
NOT_EVALUATED
MISSING
INCOMPLETE
AT_RISK
TO_REVIEW
COVERED
MANUALLY_VALIDATED
```

Le moteur ne doit pas automatiquement affirmer :

```text
COMPLIANT
```

simplement parce qu’un document existe.

---

# 57. TRANSFORMATION DU JSON QUALIOPI

Concept :

```text
Indicator {
    number
    criterion
    label
    description
}
```

Puis :

```text
IndicatorRule {
    indicator_id

    applicability_rules[]

    accepted_evidence_types[]

    automated_checks[]

    manual_checks[]

    severity
}
```

Exemple :

```text
Indicator 8

accepted_evidence:
- needs_analysis
- positioning
- pre_assessment
```

---

# 58. AUDIT INTERNE

Le JSON actuel peut aussi servir directement au mode :

```text
AUDIT MANUEL
```

L’auditeur interne répond :

```text
OK
KO
À réparer
N/A
```

et peut ajouter :

```text
commentaire
preuve
photo
document
```

Le JSON est déjà prévu pour cette logique de contrôle, avec possibilité de commentaire et de preuve/photo sur plusieurs questions.

---

# 59. AUDIT AUTOMATISÉ

À côté :

```text
AUTO AUDIT
```

GSMS calcule :

```text
requirement
↓
applicability
↓
expected evidence
↓
found evidence
↓
consistency checks
↓
coverage
```

---

# 60. AUDIT DE SESSION

Commande :

```text
AUDIT SESSION SES-2026-0045
```

Le moteur rassemble :

```text
preuves organisme
+
preuves programme
+
preuves formateur
+
preuves session
+
preuves apprenants
+
preuves financeur
```

Puis produit une synthèse.

---

# 61. AUDIT ALÉATOIRE

Fonction :

```text
SIMULATE AUDITOR
```

GSMS sélectionne quelques sessions terminées.

Puis vérifie :

```text
si un auditeur regardait ces sessions aujourd’hui,
qu’est-ce qui manquerait ?
```

---

# 62. AUDIT RISK-BASED

Les sessions peuvent recevoir un score interne.

Exemple :

```text
signature manquante
+20

bilan manquant
+15

questionnaire manquant
+10

absence non justifiée
+15

réclamation
+20

évaluation manquante
+15

incohérence documentaire
+20
```

Puis :

```text
AUDIT HIGH-RISK SESSIONS
```

---

# 63. AMÉLIORATION CONTINUE

La boucle complète :

```text
PROBLEM DETECTED
↓
Finding
↓
Root Cause
↓
Corrective Action
↓
Owner
↓
Deadline
↓
Implementation
↓
Verification
↓
Closure
```

---

# 64. BIBLIOTHÈQUE CIBLE DE WORKFLOWS

Version V1 :

```text
01 Prospect → inscription
02 Analyse du besoin
03 Positionnement
04 Handicap/accessibilité
05 Qualification dossier
06 Choix financement
07 Devis
08 Convention / contrat
09 Validation inscription
10 Création session
11 J-30 contrôle
12 J-15 contractualisation
13 J-10 convocation
14 J-5 préformation
15 J0 démarrage
16 Émargement
17 Signature manquante
18 Absence
19 Prévention rupture
20 Bilan formateur
21 Évaluation formative
22 Évaluation finale
23 Certification/examen
24 Échec/rattrapage
25 Clôture pédagogique
26 Attestation/certificat
27 Satisfaction apprenant
28 Satisfaction entreprise
29 Satisfaction formateur
30 Satisfaction financeur
31 Satisfaction à froid
32 Analyse satisfaction
33 Réclamation
34 Action corrective
35 Veille réglementaire
36 Veille métiers
37 Veille pédagogique
38 Compétences formateur
39 Sous-traitants
40 Handicap organisme
41 Entreprise/B2B
42 OPCO
43 CPF/EDOF
44 France Travail
45 Autres financeurs
46 Facturation
47 Relance paiement
48 Evidence generation
49 Qualiopi recalculation
50 Audit interne
```

La cible réaliste est donc environ :

```text
40 à 50 workflows spécialisés
```

et PAS un workflow géant.

---

# 65. ARCHITECTURE DES WORKFLOWS

Organisation recommandée :

```text
GSMS EVENT BUS
│
├── SESSION EVENTS
│   ├── registration.*
│   ├── session.*
│   ├── attendance.*
│   ├── assessment.*
│   ├── exam.*
│   └── survey.*
│
├── QUALITY EVENTS
│   ├── evidence.*
│   ├── finding.*
│   ├── complaint.*
│   └── corrective_action.*
│
├── FINANCE EVENTS
│   ├── funding.*
│   ├── invoice.*
│   └── payment.*
│
└── ORGANIZATION EVENTS
    ├── watch.*
    ├── trainer.*
    ├── subcontractor.*
    └── accessibility.*
```

---

# 66. EXEMPLE D’ÉVÉNEMENT

```json
{
  "event": "session.completed",
  "event_id": "EVT-829177",
  "organization_id": "ORG-01",
  "session_id": "SES-2026-0045",
  "occurred_at": "2026-10-14T18:00:00Z",
  "payload": {
    "learners": 12,
    "trainer_id": "TRA-82"
  }
}
```

n8n reçoit cet événement et exécute les workflows abonnés.

---

# 67. IDEMPOTENCE OBLIGATOIRE

Les workflows doivent pouvoir être rejoués sans envoyer 5 fois la même convocation.

Chaque action doit posséder :

```text
idempotency_key
```

Exemple :

```text
SES-0045:CONVOCATION:LEARNER-782
```

Avant exécution :

```text
action already completed ?
```

Si oui :

```text
SKIP
```

---

# 68. RETRY / ERREURS

Chaque workflow doit gérer :

```text
SUCCESS
RETRYING
FAILED
MANUAL_ACTION_REQUIRED
```

Exemple :

```text
email provider down
↓
retry 5 min
↓
retry 30 min
↓
retry 2 h
↓
alert admin
```

---

# 69. HUMAN-IN-THE-LOOP

Certaines actions ne doivent jamais être entièrement automatisées.

Exemples :

```text
rejet financeur
décision pédagogique
adaptation handicap complexe
validation d’une non-conformité
annulation
modification contrat
décision certification
```

n8n prépare.

GSMS demande validation.

L’humain décide.

---

# 70. JOURNAL D’AUDIT

Toute action automatique doit produire :

```text
AutomationExecution {
  workflow
  trigger
  timestamp
  inputs
  action
  result
  external_reference
  actor
  error?
}
```

C’est important à la fois pour :

```text
debug
traçabilité
preuve
audit
```

---

# 71. NE PAS COUPLER QUALIOPI AUX WORKFLOWS N8N

Règle critique :

NE PAS mettre partout :

```text
IF indicator_1
IF indicator_8
IF indicator_12
```

Les workflows produisent des faits.

Exemple :

```text
positioning.completed
```

Puis :

```text
Evidence Engine
↓
POSITIONING_EVIDENCE
```

Puis :

```text
Qualiopi Engine
↓
recalculate affected indicators
```

C’est beaucoup plus maintenable.

---

# 72. BOUCLE TECHNIQUE FINALE

```text
USER / SYSTEM
      ↓
BUSINESS ACTION
      ↓
GSMS DOMAIN
      ↓
DOMAIN EVENT
      ↓
WORKFLOW ENGINE / N8N
      ↓
AUTOMATED ACTION
      ↓
RESULT
      ↓
GSMS DATABASE
      ↓
EVIDENCE ENGINE
      ↓
QUALIOPI ENGINE
      ↓
AUDIT ENGINE
      ↓
DASHBOARD / ALERT
```

---

# 73. CE QUE LES DEUX JSON NOUS APPORTENT

## JSON SATISFACTION

Il peut devenir :

```text
SurveyTemplate
```

avec :

```text
questions
types
answers
required fields
```

Il constitue une base réelle pour :

```text
WF-27 Satisfaction apprenant
```

Le modèle comporte bien un questionnaire de satisfaction stagiaire avec une liste de questions obligatoires.

## JSON AUDIT QUALIOPI

Il peut devenir :

```text
QualiopiReferenceTemplate
+
ManualAuditTemplate
```

Il représente déjà les 32 questions/indicateurs de contrôle sous forme structurée et quatre états de réponse :

```text
OK
KO
À réparer
N/A
```



---

# 74. DOCTRINE À IMPOSER À CLAUDE / CURSOR

NE PAS coder immédiatement 50 workflows n8n isolés.

Construire d’abord :

```text
EVENT MODEL
STATE MACHINES
WORKFLOW CONTRACT
EVIDENCE MODEL
QUALIOPI RULE MODEL
```

Puis implémenter progressivement les workflows.

Chaque workflow doit obligatoirement déclarer :

```text
ID
NAME

TRIGGER

APPLICABILITY

INPUTS

PRECONDITIONS

ACTIONS

WAIT / DEADLINES

REMINDERS

OUTPUTS

ERROR STATES

MANUAL ACTIONS

GENERATED EVIDENCES

BUSINESS EVENTS EMITTED
```

---

# 75. TEMPLATE STANDARD D’UN WORKFLOW

```yaml
workflow:
  id: WF-27
  name: trainee-hot-satisfaction

  trigger:
    event: session.completed

  applicability:
    session_status: completed

  actions:
    - create_survey_instance
    - send_survey

  wait:
    duration: 48h

  condition:
    survey_completed: false

  reminder:
    action: send_survey_reminder

  outputs:
    - survey_instance
    - survey_response
    - satisfaction_score

  evidence:
    - SATISFACTION_REQUEST_SENT
    - SATISFACTION_RESPONSE

  events:
    - survey.sent
    - survey.completed

  errors:
    - delivery_failed
    - invalid_email

  human_action:
    required_if:
      satisfaction_score_below: threshold
```

Ce contrat peut ensuite être traduit :

```text
YAML
→ DB
→ Workflow Engine
→ n8n JSON
```

---

# 76. OBJECTIF FINAL

L’objectif n’est pas :

> Avoir beaucoup de workflows.

L’objectif est :

> Construire un organisme de formation événementiel dont chaque processus administratif, pédagogique, financier et qualité est suivi, automatisable, traçable et auditable.

Le cycle final devient :

```text
PROSPECT
↓
BESOIN
↓
POSITIONNEMENT
↓
FINANCEMENT
↓
CONTRAT
↓
INSCRIPTION
↓
SESSION
↓
FORMATION
↓
PRÉSENCE
↓
SUIVI
↓
ÉVALUATION
↓
EXAMEN
↓
CERTIFICATION
↓
SATISFACTION
↓
FACTURATION
↓
PAIEMENT
↓
AMÉLIORATION
↓
PREUVES
↓
QUALIOPI
↓
AUDIT
```

---

# 77. RÈGLE FINALE

```text
N8N N'EST PAS GSMS.

N8N EXÉCUTE LES WORKFLOWS DE GSMS.

GSMS CONSERVE LA VÉRITÉ MÉTIER.

LES WORKFLOWS PRODUISENT LES FAITS.

LES FAITS PRODUISENT LES PREUVES.

LES PREUVES ALIMENTENT QUALIOPI.

QUALIOPI ALIMENTE L'AUDIT.

L'AUDIT ALIMENTE L'AMÉLIORATION CONTINUE.
```

Cette architecture doit être considérée comme la base de travail avant toute introduction d’EVE ou de toute autre couche IA.