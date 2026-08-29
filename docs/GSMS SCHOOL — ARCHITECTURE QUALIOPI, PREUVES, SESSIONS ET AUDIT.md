# GSMS SCHOOL — ARCHITECTURE QUALIOPI, PREUVES, SESSIONS ET AUDIT

## 1. VISION FONDAMENTALE

GSMS School ne doit surtout pas traiter Qualiopi comme un simple module administratif contenant 32 cases à cocher.

Le principe architectural fondamental est :

**L'activité normale de l'organisme de formation doit produire automatiquement les données et les preuves nécessaires à la conformité Qualiopi.**

Qualiopi est donc présent transversalement dans GSMS School.

Cependant, il existe bien un **module Qualiopi dédié**.

La distinction est essentielle :

**Le module Qualiopi ne sert pas principalement à saisir les preuves.**

Il sert à :

- retrouver les preuves produites par l'activité ;
- les rattacher aux exigences appropriées ;
- contrôler leur présence ;
- contrôler leur cohérence ;
- analyser leur couverture ;
- identifier les éléments manquants ;
- analyser une session ;
- analyser un indicateur ;
- analyser plusieurs sessions ;
- préparer un audit ;
- simuler un audit ;
- produire un dossier de preuves ;
- aider l'organisme à corriger les problèmes détectés.

Architecture générale :

```text
ACTIVITÉ MÉTIER
      ↓
DONNÉES OPÉRATIONNELLES
      ↓
ARTEFACTS / ÉVÉNEMENTS
      ↓
EVIDENCE ENGINE
      ↓
PREUVES QUALIOPI
      ↓
QUALIOPI ENGINE
      ↓
COUVERTURE DES EXIGENCES
      ↓
AUDIT ENGINE
      ↓
MODULE QUALIOPI
      ↓
ASSISTANT IA QUALIOPI
```

---

# 2. LA SESSION EST L'UNITÉ OPÉRATIONNELLE CENTRALE

Une formation abstraite ne suffit pas.

GSMS doit faire une distinction claire entre :

```text
PROGRAMME
    ↓
ACTION DE FORMATION
    ↓
SESSION
    ↓
CRÉNEAUX
    ↓
APPRENANTS
```

La **session de formation** est l'une des unités centrales permettant de produire et retrouver les preuves.

Exemple :

```text
Programme :
Formation HACCP

Session :
HACCP-2026-0042

Dates :
12/10/2026 → 14/10/2026

Formateur :
Jean Dupont

Apprenants :
12

Entreprise :
Restaurant ABC

Financeur :
OPCO

Modalité :
Présentiel
```

Cette session doit devenir un véritable objet métier possédant son cycle de vie.

---

# 3. CYCLE DE VIE AUTOMATISÉ D'UNE SESSION

Le modèle observé chez VisioFormation est particulièrement intéressant : la session déclenche automatiquement des actions selon son calendrier.

Exemple de logique :

```text
J-15
→ convention entreprise
→ contrat particulier

J-10
→ convocation
→ convention d'intervention formateur

J-5
→ évaluation préformation
→ rappel

J0
→ welcome mail
→ documents pédagogiques
→ émargement

PENDANT
→ émargements
→ évaluations intermédiaires
→ suivi pédagogique
→ bilans formateur
→ incidents éventuels

FIN
→ évaluation finale
→ satisfaction apprenant
→ questionnaire entreprise
→ questionnaire formateur
→ attestations
→ certificats
→ feuilles d'émargement
→ bilan pédagogique

J+1
→ éventuellement demande d'avis

J+45
→ satisfaction à froid
```

Une session ne doit donc pas être une simple ligne dans une base de données.

Elle doit être un **objet événementiel vivant**.

---

# 4. WORKFLOW ENGINE

GSMS doit disposer d'un véritable moteur de workflow.

Principe :

```text
SESSION
   ↓
EVENT
   ↓
TRIGGER
   ↓
CONDITION
   ↓
ACTION
   ↓
RESULT
```

Exemple :

```text
EVENT
session.start_date - 5 days

CONDITION
preformation_evaluation == missing

ACTION
send_preformation_evaluation()

RESULT
email_sent
```

Puis :

```text
EVENT
72 hours later

CONDITION
evaluation.status != completed

ACTION
send_reminder()
```

Autre exemple :

```text
EVENT
training_slot.completed

CONDITION
attendance_signature == missing

ACTION
request_signature()
```

Le workflow doit être configurable.

Il ne faut surtout pas coder en dur toutes les règles Qualiopi directement dans les pages React.

---

# 5. PRINCIPE : UNE ACTION MÉTIER PEUT PRODUIRE UNE PREUVE

C'est probablement le principe le plus important de toute l'architecture.

L'utilisateur ne doit PAS refaire une saisie Qualiopi lorsqu'une information existe déjà dans GSMS.

Exemple :

```text
FORMATEUR
   ↓
remplit son bilan quotidien
   ↓
GSMS enregistre le bilan
   ↓
Evidence Engine
   ↓
création/référencement de la preuve
   ↓
indicateur(s) concerné(s)
```

Autre exemple :

```text
APPRENANT
   ↓
signe son émargement
   ↓
présence enregistrée
   ↓
feuille individuelle mise à jour
   ↓
preuve créée
   ↓
Evidence Engine
```

Même logique pour :

```text
questionnaire
évaluation
convention
contrat
convocation
signature
émargement
bilan formateur
programme
objectif pédagogique
réclamation
incident
action corrective
email
message pédagogique
facture
paiement
attestation
certificat
document formateur
```

L'utilisateur travaille normalement.

**GSMS construit la traçabilité Qualiopi derrière lui.**

---

# 6. NE PAS CONFONDRE DOCUMENT ET PREUVE

Une preuve n'est pas forcément uniquement un PDF.

Une preuve peut être :

```text
DOCUMENT
EVENT
SIGNATURE
DATABASE RECORD
EMAIL
QUESTIONNAIRE
EVALUATION
MESSAGE
LOG
STATISTIQUE
HISTORIQUE
VALIDATION
RELATION ENTRE PLUSIEURS DONNÉES
```

Exemple :

Une preuve d'accompagnement pédagogique pourrait combiner :

```text
messages échangés
+
évaluations intermédiaires
+
compte-rendu formateur
+
présence
+
progression LMS
```

Il faut donc créer une véritable abstraction :

```text
Evidence
```

et pas simplement :

```text
UploadedFile
```

---

# 7. EVIDENCE ENGINE

Créer un moteur central chargé de gérer les preuves.

Conceptuellement :

```text
Evidence {
    id
    type
    source_type
    source_id
    created_at
    session_id?
    program_id?
    learner_id?
    trainer_id?
    company_id?
    organization_id?
    indicator_links[]
    validity
    status
    metadata
    immutable_reference
}
```

Une même preuve peut éventuellement participer à plusieurs exigences.

Il ne faut donc pas forcément créer :

```text
1 preuve = 1 indicateur
```

mais plutôt permettre :

```text
1 preuve
    ↓
N relations
    ↓
indicateurs/exigences
```

---

# 8. LES PREUVES N'ONT PAS TOUTES LA MÊME PORTÉE

C'est essentiel.

Il serait incorrect d'imposer :

> Chaque session doit posséder 32 documents correspondant aux 32 indicateurs.

Les preuves peuvent exister à différents niveaux.

GSMS doit au minimum gérer :

```text
ORGANIZATION_EVIDENCE
PROGRAM_EVIDENCE
SESSION_EVIDENCE
LEARNER_EVIDENCE
TRAINER_EVIDENCE
COMPANY_EVIDENCE
PROCESS_EVIDENCE
```

Exemple :

### Preuve organisme

```text
veille réglementaire
procédure qualité
politique handicap
processus réclamation
```

### Preuve programme

```text
objectifs
prérequis
durée
modalités
programme
méthodes pédagogiques
```

### Preuve formateur

```text
CV
qualification
compétences
certifications
formation continue
```

### Preuve session

```text
convention
convocation
émargement
évaluation
questionnaire
bilan
attestation
```

### Preuve apprenant

```text
positionnement
évaluation
présence
progression
satisfaction
```

---

# 9. QUALIOPI ENGINE

Au-dessus de l'Evidence Engine doit exister un moteur Qualiopi.

Il connaît :

```text
CRITÈRES
INDICATEURS
EXIGENCES
CONDITIONS D'APPLICATION
TYPES DE PREUVES POSSIBLES
RÈGLES DE COUVERTURE
```

Il ne doit pas simplement vérifier :

```text
PDF EXISTS = TRUE
```

Il doit pouvoir déterminer quelque chose comme :

```text
INDICATOR
      ↓
APPLICABILITY
      ↓
REQUIRED EVIDENCE TYPES
      ↓
AVAILABLE EVIDENCE
      ↓
DATA CONSISTENCY
      ↓
COVERAGE
      ↓
STATUS
```

Statuts possibles :

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

Éviter autant que possible de déclarer automatiquement :

```text
COMPLIANT
```

simplement parce qu'un document existe.

La décision finale de conformité reste une question d'audit.

GSMS doit principalement parler de :

**couverture des exigences**.

---

# 10. LE MODULE QUALIOPI

Nous voulons effectivement un module Qualiopi dédié.

Mais ce module est essentiellement une **console de contrôle transversal**.

Exemple de navigation :

```text
QUALIOPI

├── Dashboard
├── 7 critères
├── 32 indicateurs
├── Sessions
├── Preuves
├── Alertes
├── Non-conformités
├── Amélioration continue
├── Audits
├── Audit blanc
└── Assistant IA
```

---

# 11. VUE PAR INDICATEUR

L'utilisateur doit pouvoir sélectionner un indicateur.

Exemple :

```text
QUALIOPI
→ INDICATEUR 30
```

GSMS analyse alors l'ensemble des données concernées.

Exemple d'affichage :

```text
INDICATEUR 30

Sessions analysées : 187

Couvertes : 183
À contrôler : 4

Apprenants interrogés : 1 742
Entreprises interrogées : 284
Formateurs interrogés : 53

Taux réponse apprenants : 91 %
Taux réponse entreprises : 74 %
Taux réponse formateurs : 88 %
```

Puis :

```text
ANOMALIES

Session HACCP-0045
→ questionnaire entreprise jamais envoyé

Session DEV-0032
→ questionnaire envoyé
→ aucune réponse
→ aucune relance

Session SST-0078
→ satisfaction apprenant manquante
```

Actions :

```text
VOIR SESSION
VOIR PREUVES
RELANCER
CRÉER ACTION CORRECTIVE
EXCLURE / JUSTIFIER
```

---

# 12. VUE PAR SESSION

Inversement, l'utilisateur doit pouvoir prendre UNE session et demander :

> Montre-moi sa couverture Qualiopi.

Exemple :

```text
SESSION
HACCP-2026-0045

QUALIOPI COVERAGE
```

GSMS rassemble alors :

```text
programme
+
preuves organisme applicables
+
preuves formateur
+
preuves session
+
preuves apprenants
+
preuves entreprise
+
preuves processus
```

pour construire la vue de contrôle.

Exemple :

```text
INDICATEUR X
✓ couvert

INDICATEUR Y
✓ couvert

INDICATEUR Z
⚠ preuve partielle

INDICATEUR ...
N/A
```

Important :

Cela ne signifie PAS :

> cette session doit remplir les 32 indicateurs.

Cela signifie :

> pour chaque exigence applicable au contexte de cette session, GSMS vérifie si les éléments nécessaires peuvent être démontrés.

---

# 13. MATRICE SESSION × INDICATEUR

Une vue extrêmement intéressante serait :

```text
                 SESSION 1    SESSION 2    SESSION 3
INDICATEUR 1        ✓            ✓            ✓
INDICATEUR 2        ✓            ✓            ⚠
INDICATEUR 3        N/A          N/A          N/A
INDICATEUR 4        ✓            ⚠            ✓
...
INDICATEUR 30       ✓            ✕            ✓
INDICATEUR 31       ✓            ✓            ✓
INDICATEUR 32       ✓            ✓            ✓
```

Cette matrice permet immédiatement d'identifier :

- les anomalies isolées ;
- les problèmes récurrents ;
- les processus défaillants ;
- les formations problématiques ;
- les formateurs concernés ;
- les preuves manquantes.

---

# 14. AUDIT ENGINE

GSMS doit disposer d'un moteur différent du moteur Qualiopi :

```text
Audit Engine
```

Son travail :

```text
sélectionner un périmètre
↓
constituer un échantillon
↓
récupérer les exigences applicables
↓
récupérer les preuves
↓
contrôler la couverture
↓
identifier les anomalies
↓
produire un rapport
```

---

# 15. AUDIT D'UNE SESSION

L'utilisateur peut choisir :

```text
AUDIT
→ SESSION
→ HACCP-2026-0045
```

GSMS produit alors :

```text
SESSION AUDIT REPORT

Programme : HACCP
Session : HACCP-2026-0045
Formateur : ...
Entreprise : ...
Financeur : OPCO
Apprenants : 12
Modalité : présentiel
```

Puis contrôle les exigences applicables.

Chaque contrôle doit permettre de descendre jusqu'à la preuve réelle.

```text
EXIGENCE
↓
JUSTIFICATION
↓
PREUVES
↓
SOURCE
```

---

# 16. SIMULATION D'AUDIT QUALIOPI

Créer une fonctionnalité :

# SIMULER UN AUDITEUR

C'est une fonction importante de GSMS.

Le logiciel constitue un échantillon de sessions et vérifie ce qu'un auditeur pourrait découvrir.

Exemple :

```text
AUDIT BLANC #2026-008

3 sessions sélectionnées :

HACCP-2026-0045
DEV-WEB-2026-0032
SST-2026-0078
```

Puis :

```text
32 indicateurs référencés
X applicables au périmètre
X correctement couverts
X à contrôler
X anomalies détectées
```

---

# 17. MODE ÉCHANTILLON ALÉATOIRE

Ajouter :

```text
🎲 ÉCHANTILLON ALÉATOIRE
```

GSMS sélectionne des sessions terminées.

L'objectif est de pouvoir tester :

> Si l'auditeur tombait aujourd'hui sur ces sessions, qu'est-ce que nous serions capables de lui montrer ?

Cette fonctionnalité doit permettre à l'organisme de découvrir les problèmes avant l'audit réel.

---

# 18. MODE ÉCHANTILLON STRATIFIÉ

Encore plus intéressant que le hasard pur.

GSMS peut construire un échantillon représentatif :

```text
1 session récente
1 session ancienne

1 B2B
1 B2C

1 présentiel
1 distanciel

1 financement OPCO
1 financement entreprise
1 financement particulier

plusieurs formateurs
plusieurs programmes
```

Le moteur doit rester configurable.

Il ne faut pas prétendre reproduire automatiquement la méthodologie exacte d'un auditeur réel.

Il s'agit d'un :

```text
AUDIT BLANC / SIMULATEUR DE RISQUE
```

---

# 19. MODE RISK-BASED

GSMS peut également sélectionner volontairement les sessions présentant le plus de risques.

Exemple de Risk Score :

```text
signature manquante
+20

questionnaire manquant
+10

absence non justifiée
+15

bilan formateur absent
+15

réclamation
+20

évaluation manquante
+15

document expiré
+10

incohérence de dates
+25
```

Puis :

```text
SESSION RISK SCORE

HACCP-0045      72/100
DEV-0032        63/100
SST-0078        58/100
```

Bouton :

```text
AUDITER LES SESSIONS À RISQUE
```

C'est différent d'une prédiction de non-conformité.

Le Risk Score sert à **prioriser les contrôles internes**.

---

# 20. QUALIOPI COVERAGE SCORE

GSMS peut également produire un indicateur interne de couverture.

Exemple :

```text
QUALIOPI READINESS

Organisation       94 %
Programmes          98 %
Sessions            91 %
Formateurs          87 %
Satisfaction        96 %
Amélioration        82 %
```

Mais attention :

**Ce score n'est pas une certification Qualiopi.**

Il représente uniquement :

```text
niveau de couverture interne détecté par GSMS
```

Il faut éviter tout wording trompeur du type :

```text
100 % = CERTIFIÉ
```

---

# 21. TRAÇABILITÉ DES PREUVES

Chaque preuve doit être traçable.

Exemple :

```text
Evidence #EV-92821

Type:
attendance_sheet

Generated from:
Session HACCP-2026-0045

Created:
14/10/2026 18:04

Participants:
12

Signatures:
12/12

Trainer signature:
YES

Source:
AttendanceService

Hash:
...

Version:
3

Related indicators:
[...]

Status:
VALID
```

On doit pouvoir répondre à :

```text
QUI ?
QUOI ?
QUAND ?
POUR QUELLE SESSION ?
À PARTIR DE QUEL PROCESSUS ?
QUELLE VERSION ?
QUEL INDICATEUR ?
```

---

# 22. VERSIONNAGE

Ne jamais simplement écraser une preuve importante.

Exemple :

```text
programme_v1
programme_v2
programme_v3
```

L'audit doit pouvoir retrouver :

> Quelle version était applicable au moment où cette session a eu lieu ?

Même principe pour :

```text
conventions
programmes
questionnaires
procédures
documents qualité
```

---

# 23. NON-CONFORMITÉ / ANOMALIE

Lorsqu'un problème est détecté :

```text
Finding
```

Exemple :

```text
Finding #F-482

Session:
HACCP-0045

Indicator:
...

Problem:
questionnaire entreprise manquant

Severity:
medium

Detected:
automatic

Status:
OPEN
```

Puis :

```text
OPEN
↓
ACTION_REQUIRED
↓
ACTION_IN_PROGRESS
↓
RESOLVED
↓
VERIFIED
```

---

# 24. NE JAMAIS FABRIQUER UNE PREUVE

Règle absolue.

L'IA ne doit jamais résoudre :

```text
émargement manquant
```

en fabriquant un émargement.

Elle doit proposer :

```text
RELANCER L'APPRENANT
```

Même chose :

```text
questionnaire manquant
→ envoyer questionnaire

bilan formateur absent
→ demander bilan

document expiré
→ demander nouvelle version

signature absente
→ demander signature

information incohérente
→ demander validation humaine
```

**Une absence de preuve reste une absence de preuve jusqu'à ce qu'une véritable action métier produise la preuve.**

---

# 25. ASSISTANT IA QUALIOPI

L'IA doit être construite au-dessus des moteurs précédents.

Elle ne doit PAS constituer elle-même le système Qualiopi.

Architecture :

```text
AI
↓
Qualiopi API
↓
Audit Engine
↓
Qualiopi Engine
↓
Evidence Engine
↓
Business Data
```

L'IA peut répondre :

> Montre-moi les sessions présentant des problèmes d'émargement.

> Pourquoi l'indicateur X est-il marqué à contrôler ?

> Quelles preuves avons-nous pour cette session ?

> Qu'est-ce qui manque pour HACCP-0045 ?

> Prépare-moi un audit blanc.

> Choisis trois sessions au hasard et contrôle-les.

> Contrôle toutes les sessions du formateur Dupont.

> Trouve les sessions ayant des questionnaires entreprise manquants.

> Prépare les preuves concernant l'indicateur 30.

---

# 26. L'IA DOIT JUSTIFIER SES RÉPONSES

Une réponse Qualiopi ne doit jamais être :

```text
Cette session est conforme.
```

sans explication.

Elle doit produire quelque chose comme :

```text
INDICATEUR X

STATUS:
TO_REVIEW

REASON:
Le questionnaire entreprise attendu n'a pas été complété.

SESSION:
HACCP-0045

EXPECTED:
company_satisfaction_questionnaire

FOUND:
questionnaire_sent = TRUE
questionnaire_completed = FALSE

REMINDER:
2 reminders sent

AVAILABLE ACTION:
send_reminder
```

L'utilisateur doit toujours pouvoir remonter :

```text
IA
↓
raisonnement métier affichable
↓
règle
↓
preuve
↓
donnée source
```

---

# 27. DASHBOARD QUALIOPI

Dashboard possible :

```text
QUALIOPI READINESS

──────────────────────────

Organisation
██████████████████░ 94 %

Sessions
████████████████░░░ 88 %

Programmes
███████████████████ 98 %

Formateurs
███████████████░░░░ 82 %

──────────────────────────

À TRAITER

🔴 4 preuves manquantes
🟠 12 preuves à contrôler
🟡 7 signatures en attente
🔵 14 questionnaires sans réponse

──────────────────────────

SESSIONS À RISQUE

HACCP-0045       HIGH
DEV-0032         HIGH
SST-0078         MEDIUM

──────────────────────────

PROCHAIN AUDIT

Audit surveillance
XX jours

[PRÉPARER L'AUDIT]
```

---

# 28. AMÉLIORATION CONTINUE

La conformité ne s'arrête pas à la collecte documentaire.

Les problèmes doivent alimenter un moteur d'amélioration.

Exemple :

```text
QUESTIONNAIRE
↓
mauvaise satisfaction
↓
SIGNAL
↓
INCIDENT / FINDING
↓
ROOT CAUSE
↓
ACTION CORRECTIVE
↓
OWNER
↓
DEADLINE
↓
IMPLEMENTATION
↓
VERIFICATION
↓
CLOSURE
```

Même logique pour :

```text
réclamation
incident
abandon
échec
problème formateur
problème pédagogique
problème administratif
```

---

# 29. BOUCLE COMPLÈTE

Voici finalement la boucle que GSMS School doit construire :

```text
PROGRAMME
        ↓
ACTION DE FORMATION
        ↓
SESSION
        ↓
WORKFLOW ENGINE
        ↓
─────────────────────────────
│ convention                 │
│ convocation                │
│ positionnement             │
│ émargement                 │
│ évaluations                │
│ questionnaires             │
│ suivi pédagogique          │
│ bilan formateur            │
│ attestations               │
│ facturation                │
│ incidents                  │
─────────────────────────────
        ↓
EVENTS + DOCUMENTS + DATA
        ↓
EVIDENCE ENGINE
        ↓
QUALIOPI ENGINE
        ↓
INDICATORS / REQUIREMENTS
        ↓
COVERAGE
        ↓
FINDINGS
        ↓
AUDIT ENGINE
        ↓
─────────────────────────────
│ audit session              │
│ audit indicateur           │
│ audit organisme            │
│ audit échantillon          │
│ audit aléatoire            │
│ audit risk-based           │
─────────────────────────────
        ↓
AI QUALIOPI
        ↓
EXPLICATION
        ↓
CORRECTIVE ACTION
        ↓
WORKFLOW ENGINE
        ↓
NOUVELLE PREUVE RÉELLE
        ↓
RE-EVALUATION
```

Cette boucle est le cœur du système.

---

# 30. RELATION AVEC CRM / LMS / FACTURATION

Qualiopi ne doit pas dupliquer les autres modules.

```text
CRM
→ entreprises
→ prospects
→ devis
→ contrats

TRAINING MANAGEMENT
→ programmes
→ sessions
→ formateurs
→ apprenants

LMS
→ progression
→ contenu
→ quiz
→ temps d'apprentissage

ATTENDANCE
→ présence
→ signatures

ASSESSMENT
→ positionnement
→ évaluations

SURVEY
→ satisfaction

DOCUMENTS
→ conventions
→ convocations
→ attestations

FINANCE
→ factures
→ paiements
→ financeurs

QUALITY
→ incidents
→ réclamations
→ actions correctives
```

Tous alimentent :

```text
EVIDENCE ENGINE
```

Puis :

```text
QUALIOPI ENGINE
```

Il n'existe donc qu'UNE vérité métier.

---

# 31. RÈGLE ANTI-DUPLICATION

Exemple interdit :

L'utilisateur saisit le questionnaire dans :

```text
SURVEY MODULE
```

puis doit aller dans :

```text
QUALIOPI
→ INDICATEUR X
→ AJOUTER PREUVE
```

pour ajouter exactement le même questionnaire.

**INTERDIT.**

GSMS doit automatiquement connaître la relation.

```text
Survey completed
↓
Evidence generated/referenced
↓
Relevant Qualiopi requirement updated
```

---

# 32. CE QUE LE MODULE QUALIOPI EST DONC RÉELLEMENT

Le module Qualiopi n'est pas :

> l'endroit où l'on fait Qualiopi.

Il est :

> **l'endroit où l'on observe, contrôle, analyse et démontre comment l'ensemble de GSMS School couvre les exigences Qualiopi.**

C'est une différence architecturale fondamentale.

---

# 33. PRINCIPE À IMPOSER AUX AGENTS DE CODE

Claude, Cursor ou tout autre agent travaillant sur GSMS School doit respecter cette règle :

**AVANT DE CRÉER UNE FONCTIONNALITÉ QUALIOPI, CHERCHER D'ABORD SI LA DONNÉE OU L'ACTION EXISTE DÉJÀ DANS LE DOMAINE MÉTIER.**

Si elle existe :

```text
NE PAS LA DUPLIQUER.
```

Créer plutôt :

```text
EVENT
EVIDENCE MAPPING
QUALIOPI RULE
AUDIT PRESENTATION
```

---

# 34. QUESTIONS OBLIGATOIRES POUR CHAQUE NOUVELLE FEATURE

Chaque fonctionnalité GSMS doit être analysée selon :

### 1. Quelle opération métier réalise-t-elle ?

### 2. Quel événement produit-elle ?

### 3. Quelle donnée durable produit-elle ?

### 4. Cette donnée constitue-t-elle une preuve potentielle ?

### 5. Pour quelle exigence ?

### 6. Quelle est sa portée ?

```text
organisation ?
programme ?
session ?
apprenant ?
formateur ?
entreprise ?
processus ?
```

### 7. Comment prouver son authenticité ?

### 8. Quelle est sa durée de validité ?

### 9. Doit-elle être versionnée ?

### 10. Comment l'Audit Engine la retrouvera-t-il ?

---

# 35. OBJECTIF PRODUIT FINAL

GSMS School doit permettre à un responsable d'organisme de formation de travailler normalement toute l'année.

Les preuves se constituent progressivement grâce à son activité réelle.

Puis, lorsqu'un audit approche, il ne doit pas passer plusieurs semaines à rechercher :

```text
emails
PDF
émargements
questionnaires
programmes
preuves formateurs
évaluations
réclamations
captures d'écran
documents dispersés
```

Il doit pouvoir ouvrir :

```text
GSMS SCHOOL
→ QUALIOPI
→ AUDIT
```

et obtenir une vue structurée de ce que le système possède réellement.

Encore mieux :

**GSMS doit pouvoir détecter les trous avant que l'auditeur ne les découvre.**

---

# 36. DOCTRINE FINALE

Retenir définitivement :

```text
QUALIOPI ≠ FORMULAIRE
QUALIOPI ≠ 32 CHECKBOXES
QUALIOPI ≠ DOSSIER DE PDF
QUALIOPI ≠ MODULE ISOLÉ
```

Le modèle GSMS est :

```text
ACTIVITÉ RÉELLE
      ↓
TRAÇABILITÉ
      ↓
PREUVES
      ↓
QUALIOPI
      ↓
CONTRÔLE
      ↓
AUDIT
      ↓
AMÉLIORATION CONTINUE
```

Le module Qualiopi existe bien.

Mais :

**LES MODULES MÉTIER PRODUISENT LES PREUVES.**

**L'EVIDENCE ENGINE LES CENTRALISE ET LES RELIE.**

**LE QUALIOPI ENGINE ÉVALUE LEUR COUVERTURE.**

**L'AUDIT ENGINE LES ÉCHANTILLONNE ET LES CONTRÔLE.**

**LE MODULE QUALIOPI LES REND VISIBLES ET EXPLOITABLES.**

**L'IA EXPLIQUE LES PROBLÈMES ET AIDE À LES CORRIGER.**

Et surtout :

**L'IA NE FABRIQUE JAMAIS LA CONFORMITÉ.**

Elle montre ce qui existe réellement, ce qui manque réellement et déclenche, après validation lorsque nécessaire, les vraies actions métier permettant de compléter le dossier.

---

# 37. PHRASE DIRECTRICE POUR TOUT LE PROJET

> **Dans GSMS School, on ne "remplit" pas Qualiopi après avoir réalisé une formation. La réalisation et la gestion normales de la formation construisent progressivement la preuve Qualiopi ; le module Qualiopi sert ensuite à contrôler, démontrer et auditer cette réalité.**

C'est ce principe qui doit guider toute l'architecture future de GSMS School.