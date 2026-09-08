# GSMS — Circuit métier complet : Audit + Formation + Qualiopi + Sécurité privée + Incendie

## Mise en situation principale

GSMS n'est pas un organisme de formation généraliste.

Le scénario principal doit refléter son vrai métier : **sécurité, sûreté, incendie, formation réglementée et audit de structures**.

On prend donc comme fil rouge une entreprise cliente qui n'est pas elle-même une société de sécurité privée.

> **Client : CENTRE HORIZON — enseigne recevant du public, 3 établissements**
>
> Le client possède du personnel d'accueil, une équipe technique, des responsables de site et un service interne chargé de la sûreté et de la sécurité incendie.
>
> Il demande à GSMS un **audit sûreté + incendie**, puis souhaite que GSMS l'accompagne pour traiter les écarts détectés, notamment par la formation de ses salariés.

L'objectif est de montrer le circuit complet :

```text
CLIENT ENTREPRISE / ENSEIGNE
        ↓
SITES / ÉTABLISSEMENTS
        ↓
AUDIT SÛRETÉ + INCENDIE
        ↓
CONSTATS / RISQUES / FINDINGS
        ↓
PLAN D'ACTIONS
        ├── actions techniques
        ├── actions organisationnelles
        └── besoins de formation
                    ↓
              OFFRE FORMATION
                    ↓
           DEVIS / CONVENTION
                    ↓
                 SESSION
                    ↓
        PRÉREQUIS / CONTRÔLES MÉTIER
                    ↓
                FORMATION
                    ↓
          QUALIOPI + RULESETS MÉTIER
                    ↓
          ÉVALUATIONS / EXAMENS
                    ↓
          ATTESTATIONS / PREUVES
                    ↓
             RETOUR AUDIT
                    ↓
              CONTRE-VISITE
                    ↓
                 RE-TEST
                    ↓
            FINDINGS CLÔTURÉS
```

La doctrine GSMS reste :

```text
LE MÉTIER PRODUIT LES FAITS
        ↓
EVIDENCE PROUVE
        ↓
RULE ÉVALUE
        ↓
GSMS DÉTECTE LES ÉCARTS
        ↓
L'HUMAIN CORRIGE LE MÉTIER
        ↓
GSMS RE-TESTE
        ↓
L'AUDIT TRAIL CONSERVE L'HISTORIQUE
```

---

# Étape 1 — Création du client et de ses sites

GSMS crée la structure cliente :

```text
CENTRE HORIZON
│
├── Siège
├── Site Paris
├── Site Rouen
└── Site Caen
```

Chaque site peut avoir son propre contexte :

- type d'établissement ;
- activité ;
- effectif ;
- horaires ;
- zones sensibles ;
- accès ;
- moyens de sûreté ;
- organisation incendie ;
- responsables ;
- prestataires ;
- personnel formé ;
- documents ;
- plans ;
- équipements ;
- contrats ;
- audits précédents ;
- plans d'actions.

GSMS ne doit pas considérer le client comme une simple fiche CRM.

Le client devient une **entité métier durable** autour de laquelle peuvent vivre des audits, des formations, des salariés, des sites, des preuves, des risques et des plans d'actions.

---

# Étape 2 — Demande d'audit

CENTRE HORIZON demande :

```text
MISSION
Audit sûreté + sécurité incendie
Site : Paris
```

GSMS crée une mission d'audit.

```text
CLIENT
  ↓
SITE
  ↓
AUDIT
  ↓
PÉRIMÈTRE
  ↓
RÉFÉRENTIEL / CHECKLIST APPLICABLE
  ↓
AUDITEUR
  ↓
PLANIFICATION
```

Le périmètre peut contenir deux familles différentes.

### Sûreté

```text
accès
contrôle d'accès
accueil visiteurs
livraisons
clés / badges
vidéoprotection
zones sensibles
intrusion
agression
vol
rondes
éclairage
organisation humaine
procédures
PC / poste de sécurité
gestion des incidents
```

### Incendie

```text
organisation incendie
consignes
évacuation
moyens de secours
SSI
alarmes
issues
dégagements
exercices
registre / documents
personnel
rôles et responsabilités
formation
```

IMPORTANT :

Cette mission d'audit client n'est pas une "session Qualiopi".

Elle possède son propre moteur :

```text
AUDIT ENGINE
→ observations
→ evidence
→ findings
→ risques
→ recommandations
→ plan d'actions
```

---

# Étape 3 — Visite terrain et collecte des preuves

L'auditeur GSMS se rend sur le site.

Il collecte des faits :

```text
Observation
Photo
Document
Entretien
Contrôle
Mesure
Procédure
Équipement
```

Exemple :

```text
Zone : accès livraison
Observation : porte secondaire laissée ouverte pendant certaines livraisons
Evidence : photo + observation auditeur
Risque : intrusion non autorisée
Severity : HIGH
```

Deuxième exemple :

```text
Zone : niveau 1
Observation : plusieurs salariés interrogés ne connaissent pas leur rôle en cas d'évacuation
Evidence : entretiens + contrôle documentaire
Risque : mauvaise réaction en situation d'urgence
Severity : HIGH
```

Troisième exemple :

```text
Organisation :
des responsables de site n'ont pas reçu la formation prévue par la politique interne du client.
```

Le moteur d'audit transforme ces faits en **findings**, pas en indicateurs Qualiopi.

---

# Étape 4 — Rapport d'audit

À la fin de l'audit :

```text
AUDIT CENTRE HORIZON — SITE PARIS

CRITICAL      0
HIGH          4
MEDIUM        7
LOW           3
CONFORME     24
```

Chaque finding est explicable :

```text
FINDING AUD-2026-014

Domaine :
Incendie / Organisation

Constat :
Une partie du personnel ne maîtrise pas les consignes d'évacuation.

Evidence :
- entretiens
- documents
- observations terrain

Risk :
HIGH

Recommendation :
Former les personnels concernés et organiser un exercice.

Owner :
Responsable de site

Deadline :
30 jours
```

Le finding appartient à l'audit du CLIENT.

Il ne faut pas le confondre avec un `ComplianceFinding` Qualiopi portant sur l'organisme de formation GSMS.

---

# Étape 5 — Le plan d'actions transforme certains findings en besoins de formation

C'est ici que le package **Audit + Formation** devient central.

Tous les findings ne donnent pas une formation.

Exemple :

```text
FINDING A
Porte non sécurisée
→ ACTION TECHNIQUE
→ installer / corriger le contrôle d'accès

FINDING B
Procédure visiteurs absente
→ ACTION ORGANISATIONNELLE
→ créer / valider une procédure

FINDING C
Personnel non préparé à l'évacuation
→ ACTION FORMATION

FINDING D
Équipe de sécurité à maintenir en compétence
→ ACTION FORMATION / RECYCLAGE selon le parcours concerné
```

GSMS doit donc pouvoir relier :

```text
AuditFinding
     ↓
CorrectiveAction
     ↓
TrainingNeed
     ↓
CommercialOpportunity / Devis
     ↓
Formation / Session
```

Ce lien est extrêmement important.

La formation n'arrive pas artificiellement à côté de l'audit.

**Elle peut être la réponse mesurable à un risque identifié.**

---

# Étape 6 — Proposition commerciale packagée

Le client reçoit une offre globale.

```text
PACKAGE CENTRE HORIZON

LOT 1
Audit sûreté du site

LOT 2
Audit incendie / organisation

LOT 3
Plan d'actions

LOT 4
Formation des personnels concernés

LOT 5
Contre-visite / re-test

LOT 6
Rapport final de clôture
```

Commercialement, GSMS peut donc gérer une prestation beaucoup plus riche qu'une simple vente de formation.

```text
DIAGNOSTIQUER
→ RECOMMANDER
→ FORMER
→ VÉRIFIER
→ PROUVER
```

---

# Étape 7 — Création de la formation issue de l'audit

Supposons que le finding impose une action de formation incendie adaptée au besoin du client.

GSMS crée :

```text
TrainingNeed
source = AUD-2026-014
client = CENTRE HORIZON
site = Paris
participants = 18 salariés
```

Puis :

```text
DEVIS
  ↓
ACCEPTATION
  ↓
CONVENTION / CONTRAT
  ↓
FINANCEMENT éventuel
  ↓
SESSION
```

À partir de cet instant, on entre dans le moteur **Training Management**.

Et si l'action relève de la formation professionnelle concernée par Qualiopi :

```text
FORMATION
   ↓
QUALIOPI ENGINE
```

Le finding d'audit et le contrôle Qualiopi restent reliés mais ne sont pas la même chose.

---

# Étape 8 — Analyse du besoin et positionnement

GSMS possède déjà le contexte ayant provoqué la formation :

```text
AuditFinding
→ personnel insuffisamment préparé
```

Cette information doit pouvoir alimenter l'analyse du besoin sans ressaisie inutile.

Mais l'organisme complète les informations nécessaires :

```text
objectif
public
niveau initial
contraintes
accessibilité
modalités
compétences attendues
participants
```

GSMS produit les preuves métier correspondantes.

```text
AnalyseBesoin
    ↓
Evidence
    ↓
EvidenceIndicatorLink
```

Qualiopi peut alors vérifier le processus de formation.

L'audit explique **pourquoi la formation existe**.

Qualiopi contrôle **comment GSMS organise et réalise cette formation**.

---

# Étape 9 — Pré-flight check de la session

Avant J0, GSMS ne doit pas attendre l'audit Qualiopi pour découvrir une session impossible à réaliser correctement.

Il doit pouvoir effectuer un contrôle de préparation.

```text
SESSION READINESS

✓ client
✓ convention
✓ programme
✓ participants
✓ formateur
✓ salle / moyens
✓ convocations
✓ documents
✓ prérequis généraux
✓ financement
```

Puis ajouter les règles spécifiques à la formation.

Exemple :

```text
GLOBAL TRAINING RULES
+
QUALIOPI RULES
+
FIRE / SSIAP RULES si applicable
+
PRIVATE SECURITY / CNAPS RULES si applicable
```

Le moteur doit sélectionner les règles selon le type réel de formation.

---

# Étape 10 — Cas spécifique : formation sécurité privée encadrée par le CNAPS

Si CENTRE HORIZON souhaite, par exemple, former des personnes à une activité entrant dans le champ des activités privées de sécurité, GSMS active un ruleset supplémentaire.

```text
FORMATION
type = PRIVATE_SECURITY
        ↓
CNAPS RULESET
```

Le système doit notamment pouvoir contrôler, selon le cas applicable :

```text
ORGANISME
→ autorisation d'exercice adaptée

DIRIGEANT
→ titres / agréments applicables

FORMATEUR
→ situation / titre applicable

CANDIDAT
→ autorisation préalable
   OU autorisation provisoire
   OU carte professionnelle permettant l'entrée en formation selon le cas

SESSION
→ déclaration réglementaire lorsqu'elle est requise
```

Le CNAPS indique actuellement que les organismes de formation aux activités privées de sécurité doivent détenir une autorisation d'exercice ; pour les sessions concernées, les sessions de formation et d'examen sont déclarées dans Dracar Ultimate. Le CNAPS rappelle également l'obligation de contrôler le titre permettant l'entrée du candidat en formation.

GSMS ne doit donc jamais réduire ce contrôle à :

```text
document CNAPS présent = PASS
```

Il faut pouvoir raisonner :

```text
type de titre
activité concernée
titulaire
date de validité
date d'entrée en formation
activité couverte
statut
preuve de vérification
```

Exemple :

```text
Participant : Karim B.
Formation : sécurité privée

Autorisation préalable : trouvée
Validité : OK à la date d'entrée
Activité : compatible
Vérification : enregistrée

→ PASS
```

Si le titre n'est plus valable :

```text
BLOCKING FINDING

Le participant ne satisfait pas le prérequis réglementaire contrôlé.

CORRIGER / VÉRIFIER →
Dossier participant
```

Le système doit empêcher de confondre :

```text
QUALIOPI
→ qualité du processus de formation

CNAPS
→ exigences réglementaires propres aux activités privées de sécurité
```

---

# Étape 11 — Cas spécifique : formation SSIAP / incendie

Pour un parcours SSIAP, GSMS active un autre ruleset.

```text
FORMATION
type = SSIAP
       ↓
SSIAP RULESET
```

Le cadre SSIAP relève notamment de l'arrêté du 2 mai 2005 modifié relatif aux missions, à l'emploi et à la qualification du personnel permanent des services de sécurité incendie des ERP et IGH.

GSMS doit donc être capable de rattacher au parcours, selon le niveau et la situation :

```text
candidat
prérequis
pièces
aptitudes / conditions applicables
formation
programme
durée / séquences
formateur
moyens pédagogiques
présence
examen
jury
QCM / pratique selon le parcours
résultat
PV
diplôme / attestation
recyclage / remise à niveau lorsque applicable
```

Encore une fois :

```text
QUALIOPI ENGINE
→ contrôle qualité de l'action

SSIAP RULESET
→ contrôle des exigences propres au parcours SSIAP
```

Une session peut donc afficher :

```text
SESSION PASSPORT

Readiness       PASS
Qualiopi        PASS
SSIAP           WARNING
Financeur       PASS
Documents       PASS
```

Le `WARNING SSIAP` doit expliquer exactement la donnée en cause.

---

# Étape 12 — Déroulement de la formation

La session issue de l'audit démarre.

```text
18 participants
        ↓
CONVOCATIONS
        ↓
PRÉSENCE / ÉMARGEMENT
        ↓
CONTENU / MODULES
        ↓
ÉVALUATIONS
        ↓
EXAMEN si applicable
        ↓
SATISFACTION
        ↓
ATTESTATIONS / CERTIFICATIONS
```

Chaque activité produit des données métier.

Ces données alimentent des Evidence.

Exemple :

```text
Expected :
18 participants × périodes obligatoires

Observed :
18 dossiers complets

→ PASS
```

Autre exemple :

```text
Expected :
18 évaluations finales

Observed :
17 évaluations
1 absence justifiée

Rule :
participant absent non évaluable selon le contexte

→ 17/17 évaluables
→ PASS
```

Le moteur ne doit pas compter bêtement les lignes.

Il doit appliquer la règle correspondante.

---

# Étape 13 — Qualiopi contrôle la session

Le moteur Qualiopi prend :

```text
SESSION DATA
+
BENEFICIARY DATA
+
TRAINER DATA
+
ORGANIZATION DATA
+
FINANCE DATA
+
DOCUMENTS
+
EVIDENCE
+
CIRCUIT EVENTS
```

Puis :

```text
APPLICABILITY
      ↓
SCOPE
      ↓
RULES
      ↓
EVIDENCE RESOLUTION
      ↓
EVALUATION
```

Résultat :

```text
PASS
FAIL
WARNING
NOT_APPLICABLE
NOT_VERIFIABLE
```

Exemple :

```text
PASS
Analyse du besoin démontrée

PASS
Participants positionnés

PASS
Informations transmises

FAIL
Émargement incomplet pour une période

WARNING
Questionnaire de satisfaction encore partiellement renseigné
```

Puis :

```text
CORRIGER →
vraie donnée métier
```

Qualiopi ne crée pas une deuxième vérité.

---

# Étape 14 — Le passeport de la session

La session possède désormais une vue de contrôle complète.

```text
╔══════════════════════════════════════════════════╗
║ PASSEPORT SESSION                               ║
║ CENTRE HORIZON — SITE PARIS                     ║
╠══════════════════════════════════════════════════╣
║ Origine : Audit AUD-2026-014                    ║
║ Action : Formation corrective                   ║
║ Participants : 18                               ║
║ Formateur : ...                                 ║
╠══════════════════════════════════════════════════╣
║ READINESS                  PASS                 ║
║ QUALIOPI                   PASS                 ║
║ RULESET MÉTIER             PASS / N/A           ║
║ FINANCEMENT                PASS                 ║
║ DOCUMENTS                  PASS                 ║
╠══════════════════════════════════════════════════╣
║ Evidence : 42                                  ║
║ Findings ouverts : 0                           ║
║ Dernier contrôle : ...                         ║
╚══════════════════════════════════════════════════╝
```

Si la formation est SSIAP :

```text
RULESET MÉTIER = SSIAP
```

Si elle relève de la sécurité privée :

```text
RULESET MÉTIER = CNAPS / PRIVATE_SECURITY
```

Si elle est une formation incendie ne relevant pas du SSIAP :

```text
RULESET MÉTIER = FIRE_TRAINING
```

Le système ne doit pas appliquer SSIAP ou CNAPS à toutes les formations de sécurité/incendie.

---

# Étape 15 — La formation devient une preuve du plan d'actions client

C'est ici que GSMS boucle réellement le cycle.

Au départ :

```text
AUDIT
→ FINDING
→ "Personnel insuffisamment préparé"
```

Après la formation :

```text
SESSION
→ réalisation
→ présence
→ évaluation
→ attestations
→ Evidence
```

Le plan d'actions reçoit ces éléments.

```text
CorrectiveAction
     ↓
TrainingSession completed
     ↓
Evidence attached
```

Mais GSMS ne doit pas fermer automatiquement le finding uniquement parce qu'une formation a été effectuée.

Pourquoi ?

Parce que :

```text
FORMATION RÉALISÉE
≠ RISQUE FORCÉMENT SUPPRIMÉ
```

Il faut pouvoir demander une vérification.

---

# Étape 16 — Contre-visite / re-test du client

GSMS planifie :

```text
COUNTER AUDIT
ou
RE-TEST
```

L'auditeur revient sur le site.

Il vérifie :

```text
personnel formé ?
→ OUI

connaissance des consignes ?
→ OUI

exercice effectué ?
→ OUI

organisation corrigée ?
→ OUI
```

Le finding peut alors passer :

```text
OPEN
  ↓
IN_PROGRESS
  ↓
READY_FOR_VERIFICATION
  ↓
VERIFIED
  ↓
CLOSED
```

L'historique conserve :

```text
02/09
Finding créé

05/09
Action corrective décidée

10/09
Devis accepté

20/09
Formation réalisée

20/09
18 attestations générées

05/10
Contre-visite

05/10
Re-test PASS

05/10
Finding CLOSED
```

Voilà le vrai **package Audit + Formation + Vérification**.

---

# Étape 17 — Rapport final remis au client

CENTRE HORIZON peut recevoir :

```text
DOSSIER CLIENT FINAL

1. Rapport audit initial
2. Liste des findings
3. Matrice de risques
4. Plan d'actions
5. Actions techniques réalisées
6. Actions organisationnelles réalisées
7. Formations réalisées
8. Participants
9. Attestations / justificatifs
10. Résultats des contrôles
11. Rapport de contre-visite
12. Findings clôturés / restants
13. Recommandations futures
```

Ce rapport n'est pas un Auditor Pack Qualiopi.

Il s'agit du **dossier de mission client**.

En parallèle, GSMS conserve son propre dossier Qualiopi pour démontrer la qualité de l'action de formation réalisée.

---

# Étape 18 — Si un auditeur Qualiopi contrôle GSMS

Plus tard, l'auditeur Qualiopi peut sélectionner la formation réalisée pour CENTRE HORIZON.

GSMS ouvre :

```text
QUALIOPI
→ SESSIONS
→ session CENTRE HORIZON
```

Il peut montrer :

```text
origine du besoin
→ audit client

analyse du besoin
→ documentée

participants
→ identifiés

positionnement
→ réalisé

information
→ transmise

formation
→ réalisée

émargements
→ présents

évaluations
→ présentes

satisfaction
→ collectée

attestations
→ générées

formateur
→ vérifié

preuves
→ datées et reliées
```

Donc le même événement métier peut avoir plusieurs valeurs :

```text
FORMATION CENTRE HORIZON

pour le CLIENT
→ action corrective issue de l'audit

pour GSMS
→ action de formation à démontrer dans son système qualité

pour le MÉTIER
→ éventuellement soumise à un ruleset CNAPS / SSIAP / incendie

pour la COMPTABILITÉ
→ prestation facturée

pour le FINANCEUR
→ dossier et justificatifs
```

**Une seule source métier, plusieurs lectures.**

C'est exactement ce que GSMS doit rechercher.

---

# Étape 19 — Cas particulier : particulier en sécurité privée

GSMS doit également couvrir un parcours sans entreprise cliente.

Exemple :

```text
Karim
  ↓
PRÉINSCRIPTION
  ↓
FORMATION SÉCURITÉ PRIVÉE
  ↓
JUSTIFICATIF DE PRÉINSCRIPTION
  ↓
DÉMARCHE CNAPS
  ↓
AUTORISATION / TITRE ADMISSIBLE
  ↓
VÉRIFICATION
  ↓
FINANCEMENT
  ↓
SESSION
  ↓
FORMATION
  ↓
EXAMEN
  ↓
RÉSULTAT
  ↓
CERTIFICATION / APTITUDE
  ↓
SUITE DU PARCOURS CNAPS
```

Le CNAPS indique notamment qu'une autorisation préalable d'accès à la formation est normalement demandée avant l'entrée en formation dans les situations concernées, avec des exceptions telles que certaines cartes professionnelles en cours de validité.

GSMS doit donc conserver :

```text
type de titre
numéro / référence
activité
validité
date de vérification
preuve
statut
```

et non un simple champ :

```text
CNAPS = oui/non
```

---

# Étape 20 — Cas entreprise avec service interne de sûreté / incendie

Le client n'a pas besoin d'être une société de sécurité privée.

GSMS peut travailler avec :

```text
centre commercial
hôtel
enseigne de distribution
site industriel
entrepôt
siège social
établissement de santé
établissement recevant du public
campus
site événementiel
```

Le client peut disposer :

```text
service sûreté
service sécurité
service incendie
responsable HSE
responsable sécurité
agents internes
prestataire externe
personnel d'accueil
personnel technique
```

GSMS doit donc modéliser le besoin à partir :

```text
CLIENT
→ SITE
→ RISQUE
→ ORGANISATION
→ PERSONNES
→ OBLIGATIONS / RÉFÉRENTIELS APPLICABLES
```

et jamais à partir de l'hypothèse :

```text
CLIENT = ENTREPRISE DE SÉCURITÉ PRIVÉE
```

---

# Étape 21 — Vue 360° du client

Le véritable écran stratégique pourrait devenir :

```text
CENTRE HORIZON

SITES
├── Paris
├── Rouen
└── Caen

AUDITS
├── sûreté
├── incendie
└── organisation

RISQUES
├── critical
├── high
├── medium
└── low

PLANS D'ACTIONS
├── techniques
├── organisationnels
└── formations

FORMATIONS
├── réalisées
├── planifiées
├── à renouveler
└── issues d'un finding

PERSONNEL
├── habilitations / titres
├── formations
├── échéances
└── documents

CONFORMITÉ
├── audit client
├── exigences métier applicables
└── suivi

DOCUMENTS
└── rapports / preuves / attestations
```

Pour une enseigne multi-sites, GSMS peut alors comparer :

```text
Paris    → 92 %
Rouen    → 78 %
Caen     → 85 %
```

à condition que le score soit fondé sur un référentiel explicite et non inventé.

---

# Étape 22 — Les moteurs doivent rester séparés

Architecture conceptuelle :

```text
                           GSMS
                            │
                    BUSINESS DATA
                            │
       ┌────────────────────┼─────────────────────┐
       │                    │                     │
       ↓                    ↓                     ↓
 TRAINING ENGINE        AUDIT ENGINE       CLIENT / SITE CORE
       │                    │
       │                    ├── findings
       │                    ├── risks
       │                    └── action plans
       │
       ├───────────────┬─────────────────┐
       ↓               ↓                 ↓
 QUALIOPI         PRIVATE SECURITY     FIRE / SSIAP
 RULESET             RULESET             RULESET
                       │
                     CNAPS
```

Ils peuvent partager :

```text
Rule
Evidence
Finding
Evaluation
Snapshot
Document
Action
AuditTrail
```

mais leurs objets métier doivent rester distincts.

Un finding d'audit client n'est pas automatiquement un finding Qualiopi.

Une preuve CNAPS n'est pas automatiquement une preuve SSIAP.

Une attestation de formation peut toutefois être référencée par plusieurs contextes sans être dupliquée physiquement.

---

# Étape 23 — Le circuit GSMS complet

```text
                         CLIENT
                           ↓
                    SITE / STRUCTURE
                           ↓
                    DEMANDE / BESOIN
                           ↓
                ┌──────────┴──────────┐
                ↓                     ↓
             AUDIT                 FORMATION
                ↓                     │
            FINDINGS                  │
                ↓                     │
          PLAN D'ACTIONS              │
                ↓                     │
        BESOIN DE FORMATION ──────────┘
                ↓
              DEVIS
                ↓
        CONVENTION / CONTRAT
                ↓
             SESSION
                ↓
          PRE-FLIGHT CHECK
                ↓
      ┌─────────┼───────────┐
      ↓         ↓           ↓
 QUALIOPI     CNAPS      SSIAP/FIRE
 si appl.     si appl.      si appl.
      └─────────┼───────────┘
                ↓
             READY ?
                ↓
            FORMATION
                ↓
          ÉMARGEMENTS
                ↓
          ÉVALUATIONS
                ↓
             EXAMEN
                ↓
          ATTESTATIONS
                ↓
             EVIDENCE
                ↓
      ┌─────────┴───────────┐
      ↓                     ↓
QUALIOPI PASSPORT      ACTION AUDIT
      ↓                     ↓
AUDITOR PACK             RE-TEST
                            ↓
                      CONTRE-VISITE
                            ↓
                      FINDING CLOSED
                            ↓
                     RAPPORT CLIENT
```

---

# Étape 24 — Doctrine finale

GSMS doit pouvoir répondre à quatre questions différentes.

### Question 1 — Organisme de formation

> Est-ce que GSMS réalise correctement et peut démontrer la qualité de ses actions de formation ?

```text
→ QUALIOPI
```

### Question 2 — Formation réglementée sécurité privée

> Est-ce que les exigences applicables à cette activité, cet organisme, ce formateur, ce candidat et cette session sont satisfaites ?

```text
→ PRIVATE SECURITY / CNAPS RULESET
```

### Question 3 — Formation incendie / SSIAP

> Est-ce que le parcours respecte les exigences applicables au type de formation incendie ou SSIAP concerné ?

```text
→ FIRE / SSIAP RULESET
```

### Question 4 — Client audité

> Est-ce que les risques et écarts détectés sur le site du client ont été traités et vérifiés ?

```text
→ AUDIT ENGINE
```

Et GSMS relie les quatre lorsque c'est pertinent.

La formule produit devient :

```text
AUDITER
   ↓
DÉTECTER
   ↓
PLANIFIER
   ↓
FORMER
   ↓
PROUVER
   ↓
RE-TESTER
   ↓
CLÔTURER
   ↓
SURVEILLER
```

C'est le scénario fil rouge de GSMS.

Il constitue désormais le scénario métier de référence de GSMS.

---

# Extension métier GSMS — Sécurité privée, sûreté, incendie, audits et offres packagées

## 1. Positionnement métier de GSMS

GSMS ne doit pas être conçu comme un simple ERP/LMS Qualiopi généraliste.

Le cœur métier cible est plus large :

- organisme de formation spécialisé en sécurité privée, sûreté et sécurité incendie ;
- formations destinées à des particuliers ;
- formations intra/inter pour des entreprises ;
- formations liées à des activités encadrées par le CNAPS lorsque le champ réglementaire l'exige ;
- formations incendie et parcours SSIAP lorsque le référentiel concerné s'applique ;
- missions d'audit sûreté/sécurité/incendie pour des entreprises, enseignes, ERP, sites tertiaires, industriels, logistiques, hôtels, commerces, établissements recevant du public, etc. ;
- accompagnement client pouvant combiner audit, plan d'actions, formation, contrôle de réalisation et suivi.

Le produit doit donc distinguer plusieurs moteurs métier qui peuvent partager des briques techniques communes sans mélanger leurs finalités.

```text
GSMS
│
├── TRAINING MANAGEMENT
│   ├── particulier
│   ├── entreprise
│   ├── inter
│   └── intra
│
├── TRAINING COMPLIANCE
│   ├── Qualiopi
│   ├── sécurité privée / CNAPS
│   ├── incendie / SSIAP
│   └── règles financeurs / contrats / examens
│
├── AUDIT & CONSULTING
│   ├── audit sûreté
│   ├── audit sécurité
│   ├── audit incendie
│   ├── audit organisationnel
│   └── audit de site
│
└── CONTINUOUS COMPLIANCE
    ├── preuves
    ├── findings
    ├── actions correctives
    ├── re-tests
    ├── snapshots
    └── rapports
```

La règle d'architecture fondamentale est la suivante :

```text
FORMATION
→ Qualiopi + règles métier de la formation concernée

AUDIT / CONSEIL
→ moteur Audit / référentiel de sûreté-sécurité-incendie

AUDIT + FORMATION
→ deux circuits reliés dans un même dossier client
```

Qualiopi ne doit pas devenir le moteur universel de GSMS. Il contrôle la qualité des actions de formation et de l'organisme. Une mission d'audit de sûreté d'un site client a un autre objet : elle contrôle la situation du client, du site, de ses procédures, de ses équipements ou de son organisation.

---

# 2. Les scopes métier à prévoir

En plus des scopes Qualiopi déjà décrits dans ce document, GSMS doit pouvoir raisonner par domaines et par objets métiers.

```text
ORGANIZATION
CLIENT_COMPANY
SITE
FORMATION
SESSION
BENEFICIARY
TRAINER
SUBCONTRACTOR
FUNDING_CASE
CNAPS_TITLE
EXAM
AUDIT_MISSION
AUDIT_AREA
AUDIT_FINDING
ACTION_PLAN
FIRE_SAFETY_SYSTEM
SECURITY_SERVICE
DOCUMENT
EQUIPMENT
```

Une même preuve peut être utile dans plusieurs scopes sans être dupliquée.

Exemple :

```text
Formateur Jean Dupont
→ qualification formateur
→ document RH
→ peut être utilisé par plusieurs sessions

Référent handicap de l'organisme
→ scope ORGANIZATION
→ peut contribuer au contrôle de plusieurs formations

Rapport de maintenance SSI du client
→ scope SITE / FIRE_SAFETY_SYSTEM
→ appartient à une mission d'audit du site
→ ne devient pas une preuve Qualiopi de session par défaut
```

---

# 3. Sécurité privée — couche réglementaire CNAPS distincte de Qualiopi

## 3.1 Principe

Pour les formations entrant dans le champ des activités privées de sécurité régies par le Code de la sécurité intérieure, GSMS doit distinguer :

```text
QUALIOPI
→ qualité du processus de formation

CNAPS / SÉCURITÉ PRIVÉE
→ autorisations, titres, droit d'entrée en formation, droit d'exercer, autorisation de l'organisme, obligations de déclaration, activité concernée
```

Qualiopi ne remplace pas le CNAPS et le CNAPS ne remplace pas Qualiopi.

## 3.2 Organisme de formation

À date de cette rédaction, le CNAPS indique notamment qu'un organisme de formation concerné par les activités privées de sécurité doit disposer d'une autorisation d'exercice adaptée à l'activité concernée. Depuis le déploiement de Dracar Ultimate, une demande distincte est prévue pour chaque activité sollicitée. Le CNAPS mentionne également la certification Qualiopi, la déclaration d'activité auprès de la DREETS et, depuis le 1er mars 2025, l'agrément du dirigeant selon les conditions applicables.

GSMS doit donc pouvoir stocker et surveiller, selon le périmètre réel de l'organisme :

```text
ORGANISME
├── déclaration d'activité DREETS
├── certification Qualiopi
│   ├── numéro / organisme certificateur
│   ├── date début
│   ├── date échéance
│   └── statut
├── autorisation(s) d'exercice CNAPS
│   ├── activité
│   ├── numéro
│   ├── validité / statut
│   └── justificatif
├── dirigeant
│   └── agrément CNAPS si applicable
└── historique réglementaire
```

Le moteur doit pouvoir produire un PRE-FLIGHT CHECK avant d'autoriser certaines sessions à démarrer.

Exemple :

```text
FORMATION SÉCURITÉ PRIVÉE

Organisme autorisé pour cette activité ?      PASS
Qualiopi valide ?                            PASS
Déclaration d'activité présente ?            PASS
Dirigeant / agrément applicable ?            PASS
Session déclarable / déclarée ?              PASS

→ ORGANISME READY
```

## 3.3 Candidat / entrée en formation

Le CNAPS rappelle qu'un organisme ne peut pas accueillir, pour les formations concernées, un candidat ne disposant pas du titre d'entrée requis. Selon la situation et l'activité, il peut s'agir notamment :

- d'une autorisation préalable d'entrée en formation ;
- d'une autorisation provisoire d'exercice ;
- d'une carte professionnelle permettant l'entrée sans nouvelle autorisation préalable dans les cas prévus ;
- de règles particulières pour certaines activités comme la sûreté aéroportuaire, la surveillance armée renforcée des sites sensibles ou la protection privée des navires.

Le CNAPS indique que la validité du titre doit être vérifiée à la date d'entrée en formation.

GSMS ne doit donc pas seulement stocker un PDF.

Il doit pouvoir représenter :

```text
CNAPS TITLE
├── beneficiaryId
├── titleType
├── activity
├── identifier
├── validFrom
├── validUntil
├── verificationStatus
├── verifiedAt
├── verificationSource
└── attachment
```

Puis évaluer :

```text
SESSION START CHECK

Participant Karim
├── titre requis ?                  OUI
├── titre présent ?                 OUI
├── activité compatible ?           OUI
├── valide à la date d'entrée ?     OUI
└── vérification enregistrée ?      OUI

→ PASS
```

Cas contraire :

```text
BLOCKING FINDING

Participant : Thomas Martin
Motif : titre d'entrée en formation non valide à la date de début
Scope : BENEFICIARY + SESSION
Severity : BLOCKING

CORRIGER →
Dossier participant
→ Réglementaire
→ CNAPS
```

Ici, GSMS ne doit pas attendre l'audit Qualiopi pour découvrir l'erreur. Le contrôle doit pouvoir bloquer ou alerter AVANT J0 selon la règle métier configurée.

## 3.4 Dracar Ultimate / déclaration des sessions

Le CNAPS indique que les organismes autorisés déclarent leurs sessions de formation et d'examen via leur espace entreprise dans Dracar Ultimate.

GSMS doit considérer cela comme un jalon réglementaire spécifique :

```text
SESSION
   ↓
CNAPS DECLARATION REQUIRED ?
   │
   ├── NO → N/A
   │
   └── YES
        ↓
   declaration status
        ↓
   DECLARED / PENDING / FAILED / NOT_DECLARED
```

Conceptuellement :

```text
CNAPS_SESSION_DECLARATION
├── sessionId
├── activity
├── declarationRequired
├── externalReference
├── declaredAt
├── status
├── evidence
└── lastCheckedAt
```

GSMS peut garder la preuve qu'une déclaration a été effectuée sans laisser n8n ou un LLM décider que la session est réglementairement conforme.

```text
CIRCUIT / CONNECTEUR
→ fait ou transmet

EVIDENCE
→ prouve

RULE ENGINE
→ évalue
```

---

# 4. Exemple concret — particulier entrant en formation de sécurité privée

```text
Karim
↓
Prospect particulier
↓
Candidature
↓
Choix formation sécurité privée
↓
Analyse des prérequis
↓
Titre CNAPS requis ?
↓
Autorisation préalable / autre titre admissible
↓
Vérification de validité
↓
Positionnement
↓
Financement
↓
Inscription
↓
Session
↓
Déclaration réglementaire si applicable
↓
Formation
↓
Émargement
↓
Évaluations / examen
↓
Résultat
↓
Attestation / titre / démarches post-formation selon le parcours
```

Sur une même session, GSMS peut afficher plusieurs contrôles indépendants :

```text
SESSION SEC-2026-0081

QUALIOPI                PASS
CNAPS PRE-FLIGHT        PASS
DOCUMENTS               PASS
ATTENDANCE              PASS
EXAM                    PASS
FUNDING                 PASS
```

Chaque statut doit pouvoir être expliqué.

---

# 5. Exemple concret — entreprise formant un groupe de salariés

Client : SECURITEX
Besoin : former 15 salariés
Mode : intra-entreprise

```text
ENTREPRISE
    ↓
BESOIN CLIENT
    ↓
SITE / CONTRAT
    ↓
15 SALARIÉS
    ↓
FORMATION
    ↓
PRÉREQUIS PAR SALARIÉ
    ↓
FINANCEMENT ENTREPRISE / OPCO
    ↓
DEVIS
    ↓
CONVENTION
    ↓
SESSION INTRA
    ↓
FORMATEUR
    ↓
MOYENS / SALLE / SITE
    ↓
PRE-FLIGHT CHECK
    ↓
FORMATION
    ↓
ÉMARGEMENT
    ↓
ÉVALUATION / EXAMEN
    ↓
RÉSULTATS INDIVIDUELS
    ↓
SATISFACTION
    ↓
ATTESTATIONS
```

Exemple de contrôle avant démarrage :

```text
SESSION READY CHECK

Organisme                         PASS
Formateur                         PASS
Programme                         PASS
Convention                        PASS
Convocations                      PASS
Participants conformes            14/15
Participant Thomas                BLOCKING

Motif : prérequis réglementaire non valide

→ SESSION NOT READY
```

Le système peut permettre une décision humaine encadrée, mais il ne doit jamais masquer le finding.

---

# 6. Incendie / SSIAP — deuxième famille de règles métier

## 6.1 Principe

La sécurité incendie doit être traitée comme un domaine métier propre.

Pour les formations SSIAP, le référentiel principal reste notamment l'arrêté du 2 mai 2005 modifié relatif aux missions, à l'emploi et à la qualification du personnel permanent des services de sécurité incendie des ERP et des IGH.

Le moteur GSMS doit distinguer :

```text
QUALIOPI
→ qualité de l'action de formation

SSIAP / INCENDIE
→ prérequis, programme, durées, examens, jury, conditions de délivrance, recyclage/remise à niveau, éléments réglementaires applicables
```

Les règles précises doivent être versionnées et dérivées des textes applicables, pas inventées dans l'UI.

## 6.2 Parcours conceptuel SSIAP

```text
CANDIDAT
↓
TYPE DE PARCOURS
├── SSIAP 1
├── SSIAP 2
├── SSIAP 3
├── recyclage
└── remise à niveau
↓
PRÉREQUIS
↓
PIÈCES JUSTIFICATIVES
↓
APTITUDE / CONDITIONS REQUISES
↓
SESSION
↓
PROGRAMME RÉGLEMENTAIRE
↓
VOLUMES / MODULES
↓
PRÉSENCE
↓
FORMATEURS / MOYENS
↓
EXAMEN
↓
ÉPREUVES
↓
JURY
↓
RÉSULTATS
↓
PV / DIPLÔME / ATTESTATION
```

L'arrêté SSIAP comporte notamment des règles d'évaluation spécifiques. Par exemple, l'annexe IX prévoit pour le SSIAP 1 une épreuve écrite sous forme de QCM et des conditions de résultat. Ces paramètres doivent appartenir au RULESET SSIAP concerné, avec une version de règle, et non être dupliqués dans plusieurs pages.

## 6.3 Passeport de session SSIAP

```text
SESSION SSIAP1-2026-0042

QUALIOPI                         PASS
SSIAP PREREQUIS                  PASS
PROGRAMME / HOURS                PASS
ATTENDANCE                       PASS
TRAINERS                         PASS
EXAM ORGANIZATION                PASS
EXAM RESULTS                     WARNING
DOCUMENTS                        PASS
```

Un finding peut être :

```text
WARNING

Épreuve pratique renseignée pour 11 candidats sur 12

Expected : 12
Observed : 11

CORRIGER →
Session
→ Examen
→ Épreuves pratiques
```

Le moteur reste déterministe.

---

# 7. Audit sûreté / sécurité — une activité distincte de la formation

## 7.1 Clients possibles

Une mission d'audit ne vise pas seulement une entreprise de sécurité privée.

GSMS doit pouvoir gérer une mission pour :

- une enseigne de distribution ;
- un centre commercial ;
- un hôtel ;
- un siège social ;
- un entrepôt ;
- un site logistique ;
- un site industriel ;
- une clinique ;
- un établissement culturel ;
- un campus ;
- un immeuble tertiaire ;
- un ERP ;
- une collectivité ;
- toute entreprise ayant un service sûreté, sécurité, incendie ou prévention.

Le client peut disposer de son propre service de sécurité ou externaliser celui-ci.

## 7.2 Circuit d'une mission d'audit sûreté

```text
CLIENT ENTREPRISE
       ↓
SITE
       ↓
MISSION D'AUDIT
       ↓
PÉRIMÈTRE
       ↓
RÉFÉRENTIEL / GRILLE
       ↓
COLLECTE DOCUMENTAIRE
       ↓
VISITE TERRAIN
       ↓
ENTRETIENS
       ↓
OBSERVATIONS
       ↓
EVIDENCE
       ↓
FINDINGS
       ↓
COTATION DES RISQUES
       ↓
RECOMMANDATIONS
       ↓
PLAN D'ACTIONS
       ↓
RESPONSABLES / ÉCHÉANCES
       ↓
RAPPORT CLIENT
       ↓
SUIVI
       ↓
CONTRE-VISITE / RE-TEST
```

## 7.3 Domaines possibles d'un audit sûreté

Selon la mission et le site :

```text
PÉRIMÈTRE SÛRETÉ
├── accès principal
├── accès personnel
├── visiteurs
├── livraisons
├── contrôle d'accès
├── badges
├── clés
├── vidéoprotection
├── détection intrusion
├── PC sécurité
├── main courante / consignes
├── rondes
├── gestion des prestataires
├── zones sensibles
├── protection des locaux critiques
├── éclairage
├── clôtures / périmètre
├── flux véhicules
├── gestion incident
├── escalade / astreinte
├── agression / vol / malveillance
├── continuité d'activité
└── organisation humaine
```

Ce ne sont pas automatiquement des obligations réglementaires universelles. Ce sont des domaines d'analyse possibles. Le RULESET choisi pour la mission doit préciser ce qui est réellement attendu selon le client, le site, son activité, son cahier des charges et le cadre légal applicable.

## 7.4 Exemple de finding

```text
AUDIT : Hôtel Horizon
SITE : Paris
DOMAIN : accès livraison

FINDING
├── status: OPEN
├── risk: HIGH
├── observation: accès livraison non contrôlé pendant certaines plages horaires
├── evidence: photo / entretien / observation terrain
├── recommendation: mettre en place une mesure de contrôle adaptée
├── owner: Direction technique
├── dueDate: +30 jours
└── verificationMethod: contre-visite / preuve documentaire
```

Le finding d'audit n'est pas un finding Qualiopi.

```text
QUALIOPI FINDING
→ problème de conformité du processus de formation

SECURITY AUDIT FINDING
→ risque / vulnérabilité / écart observé chez le client
```

Ils peuvent partager une abstraction technique de type Finding, mais doivent conserver leur domaine, leurs règles et leur cible.

---

# 8. Audit incendie / sécurité incendie d'un établissement

## 8.1 Principe

Pour un ERP, les obligations incendie dépendent notamment du type d'établissement, de sa catégorie et des dispositions générales et particulières applicables.

Le règlement de sécurité contre les risques d'incendie et de panique dans les ERP est notamment porté par l'arrêté du 25 juin 1980 modifié. Il couvre des sujets tels que les dispositions constructives, l'évacuation, les installations, les moyens de secours et les systèmes de sécurité incendie.

GSMS ne doit donc pas créer une checklist incendie universelle figée du type "ERP = 40 cases".

Il faut un mécanisme :

```text
SITE
↓
CLASSIFICATION / CONTEXTE
↓
RULESET APPLICABLE
↓
REQUIREMENTS
↓
OBSERVATIONS / DOCUMENTS
↓
EVALUATION
```

## 8.2 Exemple de circuit

```text
CLIENT
 ↓
SITE / BÂTIMENT
 ↓
CARACTÉRISTIQUES DU SITE
 ↓
TYPE / CATÉGORIE / USAGE si applicable
 ↓
MISSION INCENDIE
 ↓
DOCUMENTATION
 ↓
VISITE TERRAIN
 ↓
ORGANISATION INCENDIE
 ↓
MOYENS DE SECOURS
 ↓
SSI
 ↓
ALARME / ALERTE
 ↓
ÉVACUATION
 ↓
ISSUES / DÉGAGEMENTS
 ↓
COMPARTIMENTAGE si applicable
 ↓
CONSIGNES
 ↓
FORMATION DU PERSONNEL
 ↓
EXERCICES
 ↓
REGISTRES / MAINTENANCE
 ↓
FINDINGS
 ↓
RISQUES
 ↓
PLAN D'ACTIONS
 ↓
RAPPORT
 ↓
RE-TEST
```

L'arrêté ERP prévoit notamment des moyens de secours pouvant comprendre des moyens d'extinction, des dispositions facilitant l'action des secours, un service de sécurité incendie et un SSI. Les composants précis du contrôle doivent être déterminés par le référentiel applicable au site.

## 8.3 Exemple de fiche audit incendie

```text
CLIENT : ENSEIGNE RETAIL FRANCE
SITE : Magasin Lyon République
MISSION : Audit sécurité incendie

RESULT
├── CRITICAL : 0
├── HIGH : 2
├── MEDIUM : 5
├── LOW : 4
└── CONFORM / NO FINDING : 31 points

HIGH #F-019
Zone : réserve
Sujet : issue / évacuation
Evidence : observation + photo
Action : correction par responsable site
Due date : 15 jours
Verification : photo + contre-visite
```

Le rapport doit garder la distinction entre :

- constat factuel ;
- référence ou règle applicable ;
- niveau de risque ;
- recommandation ;
- action décidée ;
- preuve de correction ;
- vérification finale.

---

# 9. Packaging commercial GSMS — Audit + Formation + Suivi

C'est une capacité centrale du produit.

Le client cible n'est pas nécessairement une société de sécurité privée. Il peut s'agir d'une entreprise ayant des obligations et besoins de sûreté/incendie pour ses salariés, ses visiteurs, son public ou ses bâtiments.

Exemple :

> Une enseigne nationale possède 25 magasins, reçoit du public, emploie des équipes locales et dispose d'un service sûreté/incendie central.

GSMS peut gérer un dossier client complet.

```text
CLIENT : ENSEIGNE ABC
│
├── SITES
│   ├── Paris
│   ├── Lyon
│   ├── Lille
│   └── ...
│
├── AUDITS
│   ├── sûreté
│   ├── incendie
│   └── organisation
│
├── FINDINGS
│
├── ACTION PLANS
│
├── TRAINING NEEDS
│
├── FORMATIONS
│   ├── personnel sécurité
│   ├── incendie
│   ├── évacuation
│   ├── gestion de crise
│   └── autres parcours pertinents
│
├── SESSION RESULTS
│
├── EVIDENCE
│
└── FOLLOW-UP
```

## 9.1 Circuit bout à bout du package

```text
1. ENTREPRISE DEMANDE UN AUDIT
        ↓
2. GSMS CRÉE LE CLIENT + SITE + MISSION
        ↓
3. AUDITEUR COLLECTE LES DOCUMENTS
        ↓
4. VISITE TERRAIN
        ↓
5. FINDINGS
        ↓
6. COTATION DES RISQUES
        ↓
7. PLAN D'ACTIONS
        ↓
8. CERTAINS FINDINGS NÉCESSITENT UNE FORMATION
        ↓
9. FINDING → TRAINING NEED
        ↓
10. PROPOSITION COMMERCIALE / DEVIS
        ↓
11. CONVENTION / FINANCEMENT si applicable
        ↓
12. CRÉATION D'UNE OU PLUSIEURS SESSIONS
        ↓
13. CONTRÔLES QUALIOPI + MÉTIER
        ↓
14. FORMATION DES SALARIÉS
        ↓
15. ÉVALUATION / ÉMARGEMENT / ATTESTATIONS
        ↓
16. EVIDENCE DE RÉALISATION
        ↓
17. RETOUR AU PLAN D'ACTIONS AUDIT
        ↓
18. ACTION MARQUÉE "À VÉRIFIER"
        ↓
19. RE-TEST / CONTRE-VISITE
        ↓
20. FINDING CLOS SI PREUVE SUFFISANTE
        ↓
21. RAPPORT FINAL CLIENT
```

C'est la relation produit la plus importante entre les deux univers :

```text
AUDIT
→ DÉTECTE LE BESOIN

FORMATION
→ TRAITE UNE PARTIE DU BESOIN

EVIDENCE
→ PROUVE LA RÉALISATION

RE-TEST
→ VÉRIFIE L'EFFICACITÉ / LA CORRECTION
```

## 9.2 Exemple concret : enseigne recevant du public

Client : ABC Retail
Site : magasin de 4 000 m² recevant du public

L'audit relève :

```text
FINDING A
Personnel ne maîtrise pas suffisamment la procédure d'évacuation
Risk : HIGH

FINDING B
Consignes incendie mal connues des nouveaux managers
Risk : MEDIUM

FINDING C
Processus de remontée d'incident sûreté hétérogène
Risk : MEDIUM
```

GSMS transforme ces constats en plan :

```text
ACTION A
→ organiser une formation / exercice évacuation

ACTION B
→ former les managers au rôle attendu

ACTION C
→ harmoniser procédure + formation / sensibilisation
```

Le client accepte le package.

```text
AUDIT-2026-0034
│
├── Finding A
│   └── TrainingNeed TN-001
│       └── Session FIRE-2026-0091
│
├── Finding B
│   └── TrainingNeed TN-002
│       └── Session FIRE-2026-0092
│
└── Finding C
    ├── ProcedureAction PA-004
    └── TrainingNeed TN-003
        └── Session SEC-2026-0093
```

Après les formations :

```text
Session FIRE-2026-0091
├── 18 participants
├── émargement complet
├── évaluation réalisée
├── attestation générée
└── Qualiopi PASS
```

Cette session produit une preuve utilisable dans le dossier d'audit :

```text
Evidence
sourceType = TRAINING_SESSION
sourceId = FIRE-2026-0091
linkedTo = AuditAction A
```

Mais l'action d'audit ne doit pas être automatiquement clôturée simplement parce qu'une formation a eu lieu.

Exemple :

```text
ACTION A
status = TO_VERIFY

Verification method :
- exercice d'évacuation
- observation terrain
- contrôle de compréhension
```

Puis :

```text
RE-TEST
↓
Résultat satisfaisant
↓
Finding A = CLOSED
```

Cela évite la confusion :

```text
FORMATION RÉALISÉE
≠
RISQUE AUTOMATIQUEMENT SUPPRIMÉ
```

---

# 10. Contrat commercial / package multi-sites

GSMS doit également pouvoir couvrir un client multi-sites.

Exemple :

```text
CONTRAT ABC RETAIL 2026
│
├── 25 sites
│
├── Audit initial
│   └── 25 missions
│
├── Consolidation groupe
│   └── top risks
│
├── Plan de formation
│   ├── 8 sessions incendie
│   ├── 5 sessions sûreté
│   └── 3 sessions management sécurité
│
├── Suivi trimestriel
│
└── Re-audit annuel
```

Vue siège :

```text
ABC RETAIL — SECURITY COMPLIANCE

25 sites

GREEN       12
WARNING      8
HIGH RISK    4
CRITICAL     1

Training completion : 82 %
Open findings : 41
Overdue actions : 7
Re-tests pending : 11
```

Vue site :

```text
SITE LYON
├── dernier audit
├── findings ouverts
├── actions
├── salariés concernés
├── formations réalisées
├── prochaines échéances
└── documents / preuves
```

---

# 11. Architecture technique conceptuelle recommandée

Il faut éviter de créer un "Qualiopi Engine", un "CNAPS Engine", un "SSIAP Engine" et un "Audit Engine" totalement indépendants et redondants.

Une meilleure cible est :

```text
                    GSMS BUSINESS DATA
                            │
                            ↓
                   EVIDENCE / FACT LAYER
                            │
                            ↓
                    RULE ENGINE CORE
                            │
             ┌──────────────┼───────────────┐
             ↓              ↓               ↓
        QUALIOPI         CNAPS/SEC         SSIAP/FIRE
        RULESET           RULESET           RULESET
             │              │               │
             └──────────────┼───────────────┘
                            ↓
                     EVALUATIONS
                            │
                            ↓
                        FINDINGS
```

Et pour l'audit client :

```text
CLIENT / SITE
     ↓
AUDIT MISSION
     ↓
AUDIT RULESET / CHECKLIST
     ↓
OBSERVATIONS + EVIDENCE
     ↓
FINDINGS
     ↓
RISK ASSESSMENT
     ↓
ACTION PLAN
     ↓
TRAINING NEEDS / OTHER ACTIONS
     ↓
VERIFY / RE-TEST
```

Les briques partagées possibles :

```text
Rule
RuleSet
Applicability
Evidence
EvidenceLink
Evaluation
Finding
Snapshot
AuditTrail
Document
Action
ActionPlan
Notification
Export
```

Mais chaque Finding doit savoir de quel domaine il provient :

```text
domain = QUALIOPI
      | CNAPS
      | SSIAP
      | FIRE_AUDIT
      | SECURITY_AUDIT
      | CLIENT_RULESET
```

---

# 12. Principe des règles versionnées

Les textes, référentiels et exigences peuvent évoluer.

GSMS doit donc pouvoir à terme dire :

```text
Evaluation
├── ruleset = SSIAP_1_INITIAL
├── version = 2026.2
├── evaluatedAt = ...
└── result = PASS
```

ou :

```text
Audit Mission
├── ruleset = ERP_FIRE_AUDIT
├── version = 2026.1
├── siteClassification = ...
└── snapshot = ...
```

Le moteur ne doit jamais dépendre d'un texte réglementaire recopié en dur dans la page React.

---

# 13. Le rôle d'EVE dans cet univers

EVE peut devenir très utile mais reste une couche d'explication et d'assistance.

EVE peut :

- expliquer pourquoi une session est bloquée ;
- résumer les findings d'un audit ;
- répondre "quelles actions sont en retard sur le site de Lyon ?" ;
- expliquer le statut CNAPS d'un participant à partir des données vérifiées ;
- préparer une synthèse client ;
- verbaliser un résultat Qualiopi ;
- aider à naviguer vers la donnée à corriger ;
- générer une synthèse de comité ou de revue client à partir de résultats structurés.

EVE ne doit pas :

- décider seule qu'une obligation légale est satisfaite ;
- inventer une règle ;
- transformer une absence d'information en PASS ;
- clôturer automatiquement un risque critique ;
- remplacer une validation réglementaire officielle.

Doctrine :

```text
CODE / RULESET CALCULE
EVE EXPLIQUE
HUMAIN DÉCIDE LORSQUE NÉCESSAIRE
LE SYSTÈME RE-TESTE
L'AUDIT TRAIL CONSERVE
```

---

# 14. Les grandes familles de parcours à supporter dans GSMS

```text
A. PARTICULIER
Prospect
→ candidature
→ prérequis
→ financement
→ session
→ formation
→ examen
→ résultat
→ suite réglementaire

B. ENTREPRISE — FORMATION
Entreprise
→ salariés
→ besoin
→ devis / convention
→ session intra/inter
→ formation
→ preuves
→ Qualiopi
→ reporting client

C. ENTREPRISE — AUDIT
Entreprise
→ site
→ mission
→ audit
→ findings
→ plan d'actions
→ rapport
→ suivi

D. ENTREPRISE — PACKAGE AUDIT + FORMATION
Entreprise
→ site
→ audit
→ findings
→ besoins de formation
→ devis
→ sessions
→ Qualiopi / règles métier
→ preuve de formation
→ retour plan d'actions
→ re-test
→ clôture

E. CLIENT MULTI-SITES
Compte groupe
→ établissements/sites
→ audits
→ plan groupe
→ formations
→ suivi par site
→ consolidation siège
```

---

# 15. Ce que GSMS devient fonctionnellement

GSMS peut être défini ainsi :

> Plateforme métier de formation, conformité et audit dédiée aux domaines de la sécurité, de la sûreté et de l'incendie. Elle gère les parcours individuels et entreprises, les exigences Qualiopi, les contraintes réglementaires sectorielles, les missions d'audit de sites, les plans d'actions et la transformation des findings en actions de formation ou de correction vérifiables.

Le produit ne doit donc pas être pensé seulement comme :

```text
LMS + CRM + QUALIOPI
```

mais comme :

```text
CLIENT / PERSONNE / SITE
          ↓
FORMATION + AUDIT + CONFORMITÉ
          ↓
FACTS / EVIDENCE
          ↓
RULES
          ↓
FINDINGS
          ↓
ACTIONS
          ↓
FORMATION / CORRECTION
          ↓
RE-TEST
          ↓
TRACE AUDITABLE
```

---

# 16. Exemple final complet — une enseigne recevant du public

## Contexte

Client : NOVA STORES
Activité : enseigne commerciale recevant du public
Nombre de sites : 14
Interlocuteurs : Direction générale + Responsable sûreté + Responsable technique

Le client ne vend pas de sécurité privée. Il possède simplement des enjeux de sûreté et d'incendie sur ses sites.

## Mission 1 — Audit initial

GSMS crée :

```text
Client NOVA STORES
↓
Site Paris République
↓
Audit sûreté + incendie
```

L'auditeur relève :

```text
F-001 HIGH
Flux livraison insuffisamment contrôlé

F-002 HIGH
Équipe locale ne maîtrise pas suffisamment la procédure d'évacuation

F-003 MEDIUM
Procédure d'escalade incident mal connue

F-004 MEDIUM
Documents de suivi incendie incomplets
```

## Mission 2 — Plan d'actions

```text
F-001
→ action technique / organisationnelle

F-002
→ TRAINING NEED

F-003
→ procédure + TRAINING NEED

F-004
→ action documentaire / contrôle
```

## Mission 3 — Package formation

GSMS transforme les TrainingNeeds en proposition :

```text
Pack NOVA Paris
├── sensibilisation évacuation
├── formation managers à l'organisation d'incident
└── exercice pratique
```

Puis suit le circuit organisme de formation :

```text
DEMANDE CLIENT
↓
DEVIS
↓
CONVENTION
↓
ANALYSE DES BESOINS
↓
PARTICIPANTS
↓
SESSION
↓
CONVOCATIONS
↓
FORMATION
↓
ÉMARGEMENT
↓
ÉVALUATION
↓
SATISFACTION
↓
ATTESTATIONS
↓
QUALIOPI ENGINE
↓
PASS / FINDINGS éventuels
```

## Mission 4 — Retour dans l'audit

Le système rattache la réalisation :

```text
F-002
↓
Action : former équipe locale
↓
Session FIRE-2026-0145
↓
Evidence : formation réalisée
↓
status : TO_VERIFY
```

Puis une contre-visite ou un exercice vérifie l'effet réel :

```text
RE-TEST
↓
Procédure connue
Exercice satisfaisant
↓
F-002 CLOSED
```

Pour F-003 :

```text
nouvelle procédure
+
formation managers
+
quiz / exercice
+
observation
↓
F-003 CLOSED
```

## Résultat client

GSMS peut alors générer un rapport de suivi :

```text
NOVA STORES — PARIS

Audit initial
4 findings

Actions terminées       3
À vérifier              1
En retard               0

Formations réalisées    2
Participants            24
Qualiopi                 PASS

Re-test sûreté           PASS
Re-test incendie         WARNING

Prochaine revue          J+90
```

C'est ici que l'offre devient réellement différenciante : GSMS ne vend plus seulement "une formation" ou "un audit". Il permet de piloter un cycle complet :

```text
DIAGNOSTIQUER
→ PRIORISER
→ CORRIGER
→ FORMER
→ PROUVER
→ RE-TESTER
→ SUIVRE
```

---

# 17. Sources réglementaires officielles à garder dans la documentation technique

Les règles précises devront être vérifiées et versionnées avant implémentation. Les sources prioritaires sont les sources officielles, notamment :

- CNAPS — démarches des organismes de formation : https://www.cnaps.interieur.gouv.fr/Demarches-en-ligne/Vous-etes-un-organisme-de-formation
- CNAPS — agréer / autoriser un organisme de formation : https://www.cnaps.interieur.gouv.fr/Demarches-en-ligne/Vous-etes-un-organisme-de-formation/Agreer-votre-organisme-de-formation
- CNAPS — déclarer les sessions de formation et d'examen : https://cnaps.interieur.gouv.fr/Demarches-en-ligne/Vous-etes-un-organisme-de-formation/Declarer-les-sessions-de-formation-et-d-examen/Declarer-les-sessions-de-formation-et-d-examen-pour-votre-organisme-de-formation2
- CNAPS — se former aux métiers de la sécurité privée : https://www.cnaps.interieur.gouv.fr/Vos-demarches/Vous-etes-un-particulier/Se-former-aux-metiers-de-la-securite-privee
- Légifrance — arrêté du 2 mai 2005 modifié relatif au SSIAP
- Légifrance — règlement de sécurité contre les risques d'incendie et de panique dans les ERP, arrêté du 25 juin 1980 modifié

IMPORTANT : les règles CNAPS, SSIAP, ERP et autres règles sectorielles peuvent évoluer. GSMS doit stocker une version de ruleset et éviter de considérer cette section documentaire comme une vérité réglementaire éternelle.

---

# 18. Règle finale de conception

```text
QUALIOPI
→ contrôle la qualité de l'organisme et des actions de formation

CNAPS / SECURITY PRIVATE RULESET
→ contrôle les exigences spécifiques aux activités privées de sécurité concernées

SSIAP / FIRE TRAINING RULESET
→ contrôle les exigences spécifiques des parcours incendie concernés

AUDIT ENGINE
→ contrôle un client / un site / une organisation par rapport au référentiel de mission

ACTION PLAN
→ transforme les findings en corrections

TRAINING NEED
→ transforme certains findings en besoin de formation

TRAINING SESSION
→ réalise la formation

EVIDENCE
→ prouve la réalisation

RE-TEST
→ vérifie que le problème initial est effectivement traité
```

Le lien stratégique entre l'audit et la formation est donc :

```text
AUDIT DÉTECTE
      ↓
PLAN D'ACTIONS
      ↓
FORMATION SI NÉCESSAIRE
      ↓
QUALIOPI / RÈGLES MÉTIER CONTRÔLENT LA FORMATION
      ↓
EVIDENCE PROUVE LA RÉALISATION
      ↓
RE-TEST DE L'AUDIT
      ↓
FINDING CLOS OU MAINTENU
```

C'est ce modèle qui doit guider les futurs modules GSMS.
