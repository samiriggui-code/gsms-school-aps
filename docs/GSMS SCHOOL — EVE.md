# GSMS SCHOOL — EVE
## Assistante vocale métier — Orbe latérale, navigation naturelle, chat intégré, recherche Web et pilotage GSMS

# 1. VISION

EVE doit devenir l’assistante intelligente native de GSMS School.

EVE n’est PAS :

- une page séparée ;
- un chatbot collé dans GSMS ;
- une Agentic UI ;
- un générateur de dashboards ;
- un remplacement de l’interface GSMS ;
- le moteur métier ;
- le moteur Qualiopi ;
- le moteur de workflows ;
- la base de données ;
- une IA ayant directement accès à PostgreSQL ;
- une IA ayant le droit de modifier arbitrairement les données.

EVE est :

> Une assistante vocale métier permanente qui habite GSMS School, représentée visuellement par une orbe discrète, capable de comprendre ce que l’utilisateur regarde, de dialoguer naturellement, de naviguer dans l’application, d’interroger les données métier, de rechercher des informations sur Internet, de déclencher les workflows autorisés et d’utiliser un petit chat intégré lorsque la voix seule n’est pas suffisante.

L’expérience recherchée est beaucoup plus proche du fonctionnement de JARVIS que d’un chatbot SaaS classique.

Architecture conceptuelle :

```text
UTILISATEUR
      │
      ├──── VOIX
      │
      └──── TEXTE
              │
              ▼
           ◉ EVE
              │
              ▼
        ┌─────────────┐
        │  EVE CORE   │
        └──────┬──────┘
               │
       compréhension
               │
       contexte utilisateur
               │
       contexte de page
               │
       intention
               │
       permissions
               │
               ▼
          GSMS TOOLS
               │
    ┌──────────┼───────────┐
    ▼          ▼           ▼
 GSMS CORE    n8n         WEB
    │          │           │
    ▼          ▼           ▼
 données   workflows    recherche
    │          │           │
    └──────────┴───────────┘
               │
               ▼
            RESULT
               │
       ┌───────┴────────┐
       ▼                ▼
 ElevenLabs          EVE CHAT
       │                │
       ▼                ▼
     VOIX          TEXTE / LIENS
```

---

# 2. INTERFACE VISUELLE

EVE ne possède pas d’Agentic UI.

GSMS reste l’interface.

EVE habite cette interface.

Structure :

```text
┌──────────────────────────────────────────────────────────────┐
│ GSMS SCHOOL                                                  │
│                                                              │
│ CRM   Sessions   Apprenants   Finance   LMS   Qualiopi       │
│                                                              │
│                                                              │
│                    INTERFACE GSMS                            │
│                                                              │
│                                                       ◉ EVE  │
└──────────────────────────────────────────────────────────────┘
```

L’orbe est présente sur toutes les pages.

Elle est :

- discrète ;
- flottante ;
- toujours accessible ;
- non intrusive ;
- indépendante des pages métier.

L’orbe déjà développée pour JARVIS doit servir de base.

Elle n’a pas besoin d’un HUD autour.

---

# 3. ÉTATS DE L’ORBE

L’orbe représente uniquement l’état d’EVE.

```text
IDLE
LISTENING
THINKING
WORKING
SPEAKING
ALERT
ERROR
```

Exemple :

```text
IDLE
◉

LISTENING
◉ pulsation

THINKING
◉ animation lente

WORKING
◉ animation active

SPEAKING
◉ réaction audio

ALERT
◉ notification discrète
```

Elle ne doit pas devenir un sapin de Noël.

L’animation doit rester subtile.

---

# 4. MODES D’INTERACTION

L’utilisateur dispose de trois modes.

```text
VOICE
TEXT
NAVIGATION
```

VOICE :

l’utilisateur parle directement à EVE.

TEXT :

l’utilisateur écrit dans son chat.

NAVIGATION :

EVE navigue directement dans GSMS à la demande de l’utilisateur.

Les trois modes utilisent le même contexte conversationnel.

---

# 5. PIPELINE VOCAL

Architecture :

```text
MICROPHONE
↓
VAD
↓
Speech-to-Text
↓
EVE CORE
↓
Context Builder
↓
Intent Router
↓
Policy Engine
↓
Tool Runtime
↓
GSMS
↓
Result
↓
Response Builder
↓
ElevenLabs
↓
VOICE
```

Les trois composants doivent rester séparés :

```text
STT
= transformer la voix en texte

LLM
= comprendre / raisonner / formuler

TTS
= transformer le texte en voix
```

EVE Core orchestre les trois.

---

# 6. OPENROUTER

OpenRouter peut servir de couche LLM principale.

Architecture :

```text
EVE CORE
↓
MODEL ROUTER
↓
OPENROUTER
↓
MODEL
```

Le même modèle ne doit pas obligatoirement traiter toutes les demandes.

Exemple :

```text
SIMPLE INTENT
→ modèle rapide

QUESTION SIMPLE
→ modèle rapide

RECHERCHE WEB
→ modèle intermédiaire

ANALYSE QUALIOPI
→ modèle reasoning

AUDIT
→ modèle reasoning

ANALYSE MULTI-SESSIONS
→ modèle reasoning
```

---

# 7. ELEVENLABS

ElevenLabs représente principalement la voix d’EVE.

Pipeline :

```text
EVE RESPONSE
↓
TTS TEXT
↓
ELEVENLABS
↓
AUDIO STREAM
↓
USER
```

La réponse orale doit rester courte.

EVE ne doit pas lire vocalement un rapport de trois pages.

---

# 8. PRINCIPE VOICE FIRST

Pour une réponse simple :

Utilisateur :

> Eve, combien de sessions demain ?

EVE :

> Six.

Aucun chat nécessaire.

Utilisateur :

> Il y a des problèmes ?

EVE :

> Deux sessions nécessitent ton attention.

Toujours pas besoin du chat.

---

# 9. CHAT POUR LES INFORMATIONS LONGUES

Utilisateur :

> Pourquoi ?

EVE :

> J’ai quatre points. Je te les affiche.

Le chat s’ouvre.

```text
EVE

Session HACCP-045

1. Deux positionnements manquants
2. Une convention non signée
3. Une absence non justifiée
4. Questionnaire entreprise absent

[Ouvrir la session]
```

La voix donne le résumé.

Le chat donne le détail.

---

# 10. CHAT INTÉGRÉ

Le chat doit rester simple.

Exemple :

```text
                       ┌───────────────────────────┐
                       │ EVE                       │
                       │                           │
                       │ Deux sessions nécessitent │
                       │ ton attention.            │
                       │                           │
                       │ HACCP-045                 │
                       │ SST-032                   │
                       │                           │
                       │ [Voir]                    │
                       │                           │
                       │ ────────────────────────  │
                       │ Pose une question...      │
                       └───────────────────────────┘
```

Largeur indicative :

```text
380–480 px
```

Le chat est :

- fermé par défaut ;
- accessible via l’orbe ;
- persistant pendant la navigation ;
- ouvrable automatiquement si nécessaire.

---

# 11. LE CHAT N’EST PAS UNE AGENTIC UI

Il peut afficher :

- texte ;
- Markdown ;
- liens ;
- sources ;
- documents ;
- quelques boutons simples ;
- historique conversationnel.

Il ne doit PAS générer :

- dashboards ;
- interfaces métier ;
- gros graphiques ;
- formulaires complets ;
- pages dynamiques ;
- surfaces agentiques complexes.

---

# 12. NAVIGATION NATURELLE

EVE doit être capable de piloter la navigation de GSMS.

Exemples :

```text
"Eve, ouvre la session HACCP de demain."

"Eve, ouvre Martin."

"Montre-moi son financement."

"Va sur l’émargement."

"Montre-moi l’indicateur 12."

"Ouvre les preuves."

"Retourne sur la session."

"Montre les sessions CPF."

"Montre seulement celles qui ne sont pas clôturées."
```

EVE résout la demande et envoie une commande au frontend.

---

# 13. UI COMMAND BUS

Créer un bus sémantique entre EVE Core et React.

```text
EVE CORE
↓
UI COMMAND BUS
↓
GSMS REACT
```

Commandes possibles :

```text
NAVIGATE
OPEN_ENTITY
OPEN_SESSION
OPEN_LEARNER
OPEN_COMPANY
OPEN_TRAINER
OPEN_FUNDER
OPEN_DOCUMENT
OPEN_INDICATOR
OPEN_AUDIT
APPLY_FILTER
FOCUS_FIELD
SCROLL_TO
HIGHLIGHT
OPEN_CHAT
CLOSE_CHAT
```

---

# 14. EXEMPLE DE NAVIGATION

Utilisateur :

> Eve, ouvre l’indicateur 12.

EVE génère :

```json
{
  "type": "OPEN_INDICATOR",
  "indicator": 12
}
```

Le frontend résout :

```text
/qualiopi/indicators/12
```

Puis EVE dit :

> C’est ouvert.

---

# 15. NE PAS PILOTER LE DOM

EVE ne doit pas fonctionner comme un robot qui regarde l’écran et clique au hasard.

INTERDIT :

```text
LLM
↓
analyse DOM
↓
cherche bouton
↓
simule clic
```

pour les fonctionnalités internes GSMS.

Utiliser :

```text
ui.open_session()

ui.open_indicator()

ui.open_funding_case()

ui.apply_filter()
```

Ce sont des commandes sémantiques fiables.

---

# 16. CONTEXTE DE PAGE

Chaque page GSMS expose son contexte à EVE.

Exemple :

URL :

```text
/sessions/SES-045
```

Contexte :

```text
PageContext {
    entity_type: "session"
    entity_id: "SES-045"
}
```

Utilisateur :

> Qu’est-ce qui manque ?

EVE comprend automatiquement :

```text
session = SES-045
```

---

# 17. CONTEXTE QUALIOPI

Utilisateur se trouve sur :

```text
/qualiopi/indicators/12
```

Il demande :

> Pourquoi il est orange ?

EVE sait :

```text
current_indicator = 12
```

Elle appelle :

```text
qualiopi.explain_status(12)
```

et répond.

---

# 18. CONTEXTE CONVERSATIONNEL

Combiner :

```text
PageContext
+
ConversationContext
+
BusinessContext
+
UserContext
```

Exemple :

Utilisateur ouvre Sophie Martin.

Puis :

> Son OPCO ?

EVE comprend :

```text
learner = Sophie Martin
```

Puis :

> Et sa convention ?

Même contexte.

Puis :

> Ouvre-la.

EVE ouvre la convention correspondante.

---

# 19. NAVIGATION CONTEXT

Maintenir :

```text
NavigationContext {
    current_route
    previous_route

    current_session_id
    current_learner_id
    current_company_id
    current_trainer_id
    current_funder_id
    current_invoice_id
    current_indicator_id
    current_audit_id
    current_document_id
}
```

---

# 20. RECHERCHE GLOBALE

EVE doit devenir également une interface de recherche naturelle.

Exemples :

```text
"Trouve Martin."

"Trouve la session Excel de juin."

"Trouve la facture de Dupont."

"Trouve l’audit précédent."

"Trouve la convention de Martin."

"Trouve les sessions de Mme Durand."
```

---

# 21. AMBIGUÏTÉ

EVE ne choisit jamais arbitrairement.

Si trois Martin existent :

EVE :

> J’ai trois Martin.

Le chat affiche :

```text
Jean Martin — ABC SARL
Sophie Martin — XYZ
Marc Martin — particulier
```

Utilisateur :

> Sophie.

EVE ouvre Sophie Martin.

---

# 22. FILTRAGE NATUREL

Utilisateur :

> Montre-moi les sessions CPF non clôturées.

EVE :

```text
ui.apply_filter({
    page: "sessions",
    funding: "CPF",
    closed: false
})
```

Le frontend affiche la vraie liste GSMS filtrée.

---

# 23. RECHERCHE INTERNET

EVE possède un outil de recherche Web.

```text
web.search
```

Exemple :

Utilisateur :

> Eve, cherche les dernières règles CPF.

Pipeline :

```text
VOICE
↓
STT
↓
EVE CORE
↓
WEB_SEARCH INTENT
↓
WEB SEARCH
↓
SOURCES
↓
LLM SYNTHESIS
↓
EVE
```

---

# 24. RÉSULTAT WEB

EVE dit oralement :

> J’ai trouvé les informations principales. Je te mets le résumé et les sources dans le chat.

Le chat affiche :

```text
EVE

Résumé

[...]

Sources officielles :

[Ministère du Travail]

[Mon Compte Formation]

[France Compétences]

[Caisse des Dépôts]
```

Les liens sont cliquables.

---

# 25. SOURCES WEB

EVE doit toujours distinguer :

```text
GSMS DATA
```

de :

```text
WEB INFORMATION
```

Elle peut dire :

> Selon ton dossier GSMS...

ou :

> D’après les sources officielles que je viens de consulter...

Ne jamais fusionner silencieusement les deux.

---

# 26. RECHERCHE WEB + DONNÉES GSMS

Exemple :

Utilisateur :

> Cette nouvelle règle CPF concerne-t-elle mes formations ?

EVE effectue :

```text
WEB SEARCH
↓
règle CPF

+

GSMS SEARCH
↓
programmes CPF

↓

ANALYSIS
```

Puis :

> Trois de tes programmes semblent concernés.

Chat :

```text
[Programme A]
[Programme B]
[Programme C]

Source :

[Texte officiel]
```

---

# 27. DOCUMENTS WEB

Utilisateur :

> Trouve-moi le guide Qualiopi.

EVE cherche.

Puis chat :

```text
[Guide de lecture Qualiopi — PDF]

[Page officielle du Ministère]
```

Utilisateur :

> Ouvre le PDF.

Le navigateur ouvre le document.

---

# 28. EVE ET GSMS TOOLS

EVE ne doit pas accéder directement à PostgreSQL.

Elle utilise des outils métier.

Exemples :

```text
session.search
session.get
session.get_readiness
session.get_findings

learner.search
learner.get
learner.get_progress

trainer.get
trainer.get_status

document.get
document.generate
document.send

attendance.get
attendance.request_signature

assessment.get

survey.get
survey.send
survey.remind

funding.get_case
funding.search

invoice.get

workflow.get_status
workflow.start

quality.get_findings

qualiopi.get_indicator
qualiopi.get_coverage
qualiopi.explain_gap

audit.get
audit.create
audit.run

ui.navigate
ui.open_entity
ui.apply_filter

web.search
```

---

# 29. EVE ET N8N

EVE ne remplace pas n8n.

Exemple :

Utilisateur :

> Relance ceux qui n’ont pas signé.

EVE :

```text
attendance.get_missing_signatures()
```

Résultat :

```text
14 signatures
8 sessions
```

Puis :

```text
workflow.start(
    workflow="WF-17",
    targets=[...]
)
```

n8n réalise :

```text
template
↓
email / SMS
↓
tracking
↓
retry
↓
logging
```

EVE reçoit le résultat.

Puis dit :

> Quatorze relances ont été envoyées.

---

# 30. RÉPARTITION DES RESPONSABILITÉS

```text
GSMS CORE
= vérité métier

PostgreSQL
= données

EVENT BUS
= événements

n8n
= automatisations

Evidence Engine
= preuves

Qualiopi Engine
= contrôle

Audit Engine
= audit

OpenRouter
= raisonnement linguistique

ElevenLabs
= voix

EVE CORE
= orchestration conversationnelle

EVE ORB
= présence visuelle

EVE CHAT
= texte / liens / historique

UI COMMAND BUS
= navigation naturelle
```

---

# 31. EVE NE REMPLACE PAS LES WORKFLOWS

Exemple :

La règle :

```text
SESSION_START - 10 DAYS
→ SEND CONVOCATION
```

appartient au Workflow Engine.

Pas à EVE.

EVE peut dire :

```text
workflow.start("WF-13")
```

mais elle ne doit pas reconstruire elle-même le workflow.

---

# 32. EVE ET QUALIOPI

Utilisateur :

> Eve, regarde l’indicateur 12.

EVE appelle :

```text
qualiopi.get_indicator(12)

qualiopi.get_coverage(12)

qualiopi.get_findings(12)
```

Puis explique.

Exemple :

> 145 sessions sont concernées. Quatre présentent des preuves partielles et deux nécessitent une revue.

Utilisateur :

> Montre les deux.

EVE applique le filtre correspondant dans GSMS.

---

# 33. EVE ET AUDIT

Utilisateur :

> Eve, prépare-moi un audit blanc.

EVE appelle :

```text
audit.create()

audit.sample_sessions()

audit.run()
```

Le moteur Audit produit le résultat.

EVE explique.

Elle ne décide pas elle-même des preuves.

---

# 34. MODE AUDITEUR

Commande :

> Eve, cherche les failles de cette session.

EVE peut passer en mode critique.

Elle cherche :

```text
dates incohérentes
documents absents
versions incorrectes
signatures manquantes
différences entre présence et bilan
évaluations absentes
questionnaires absents
actions non tracées
preuves faibles
```

Exemple :

> J’ai trouvé trois éléments à revoir. Le positionnement a été complété après l’entrée en formation, le bilan formateur indique douze présents alors que onze signatures sont enregistrées, et la convention actuellement affichée a été générée après la session.

---

# 35. EVE ET SATISFACTION

Les scores numériques ne nécessitent pas forcément l’IA.

```text
score < threshold
↓
Rule Engine
```

Les commentaires libres peuvent être analysés par EVE.

Exemple :

```text
"Très bon formateur mais nous avons perdu presque une heure parce que le matériel ne fonctionnait pas."
```

Analyse :

```text
sentiment:
mixed

topics:
trainer_positive
equipment_problem

severity:
medium
```

EVE peut ensuite rechercher si le problème apparaît sur d’autres sessions.

---

# 36. DÉTECTION DE TENDANCES

EVE peut analyser :

```text
satisfaction
réclamations
incidents
abandons
résultats examens
retards
findings
```

Exemple :

```text
HACCP satisfaction

Janvier : 4.4
Mars    : 4.2
Mai     : 3.8
Juillet : 3.4
```

EVE :

> La satisfaction baisse depuis quatre sessions consécutives. Les commentaires négatifs concernent principalement le manque de pratique.

---

# 37. EVE PROACTIVE

EVE ne doit pas uniquement répondre.

Certains événements peuvent déclencher une alerte.

Exemple :

```text
SESSION_STARTING_SOON
↓
READINESS < 80%
↓
EVE ALERT
```

L’orbe indique :

```text
◉ 1
```

Utilisateur clique.

EVE :

> La session SST de demain nécessite ton attention. Deux positionnements sont encore manquants.

---

# 38. AI GATE

Ne jamais envoyer tous les événements au LLM.

Architecture :

```text
EVENT
↓
RULE ENGINE
↓
AI NEEDED ?
│
├── NO
│   ↓
│ DETERMINISTIC WORKFLOW
│
└── YES
    ↓
    EVE
```

Exemples sans IA :

```text
signature manquante
facture échue
date dépassée
document absent
```

Exemples avec IA :

```text
commentaire libre
réclamation
analyse de tendance
audit complexe
analyse multi-session
recherche réglementaire
```

---

# 39. DETERMINISTIC FIRST

Règle fondamentale :

```text
SI UNE RÈGLE FIABLE PEUT RÉSOUDRE LE PROBLÈME
→ CODE / RULE ENGINE

SI LE PROBLÈME NÉCESSITE COMPRÉHENSION / RAISONNEMENT
→ EVE
```

Cela réduit :

```text
coût
latence
hallucinations
erreurs
```

---

# 40. EVE PROACTIVE RESTE DISCRÈTE

Pas de popup agressive.

L’orbe peut afficher :

```text
◉ 3
```

Puis l’utilisateur ouvre.

EVE :

> Trois éléments nécessitent ton attention.

Priorités :

```text
CRITICAL
HIGH
NORMAL
INFO
```

---

# 41. ACTIONS SENSIBLES

Les tools doivent avoir des niveaux de risque.

```text
READ
SAFE_WRITE
HIGH_RISK
CRITICAL
```

Exemple :

```text
session.get
→ READ

send_reminder
→ SAFE_WRITE

session.cancel
→ HIGH_RISK

exam.change_result
→ CRITICAL
```

---

# 42. CONFIRMATION

Utilisateur :

> Annule toutes les sessions de demain.

EVE calcule :

```text
12 sessions
184 inscriptions
11 formateurs
```

Elle ne doit PAS exécuter immédiatement.

Elle répond :

> Cette action affecterait douze sessions et 184 inscriptions. Une confirmation est nécessaire.

---

# 43. RBAC

EVE hérite des permissions de l’utilisateur.

```text
USER
↓
ROLE
↓
PERMISSIONS
↓
EVE TOOL POLICY
```

Un formateur ne doit pas pouvoir demander :

> Montre-moi les marges financières de toutes les formations.

si son rôle ne l’autorise pas.

---

# 44. MULTI-TENANT

Chaque appel EVE doit être associé côté serveur à :

```text
tenant_id
user_id
role
permissions
```

Le LLM ne choisit jamais le tenant.

---

# 45. MÉMOIRE

Distinguer :

```text
Conversation Memory

User Context

Business Data
```

La mémoire conversationnelle sert à comprendre :

> Relance-les.

Mais avant l’action EVE revérifie toujours les données GSMS.

La mémoire LLM n’est jamais la source de vérité.

---

# 46. INTERRUPTIONS VOCALES

EVE doit supporter le barge-in.

EVE :

> Cette session présente quatre problèmes. Le premier...

Utilisateur :

> Stop.

TTS s’arrête immédiatement.

Utilisateur :

> Ouvre-la.

EVE navigue.

Puis :

> C’est ouvert.

---

# 47. STREAMING

Pour rendre EVE naturelle :

```text
STREAMING STT
↓
EARLY INTENT
↓
PARALLEL TOOL CALL
↓
STREAMING RESPONSE
↓
STREAMING TTS
```

Il faut éviter :

```text
STT 3s
+
LLM 8s
+
TTS 4s
=
15 secondes
```

pour chaque interaction.

---

# 48. DEMANDES SIMPLES

Exemple :

> Combien de sessions demain ?

Pas besoin d’un énorme modèle.

```text
INTENT
COUNT_SESSIONS

↓

session.count(tomorrow)

↓

"Six."

↓

TTS
```

---

# 49. DEMANDES COMPLEXES

Exemple :

> Pourquoi ma satisfaction baisse depuis six mois ?

Pipeline :

```text
analytics
↓
aggregation
↓
EVE reasoning
↓
explanation
```

Un modèle reasoning peut être utilisé.

---

# 50. FRONTEND REACT

Structure :

```text
<AppShell>

    <Navigation />

    <CurrentPage />

    <EveProvider>

        <EveOrb />

        <EveChatDrawer />

        <EveVoiceSession />

        <NavigationCommandHandler />

        <PageContextProvider />

    </EveProvider>

</AppShell>
```

---

# 51. BACKEND EVE

Structure possible :

```text
eve/

├── core/
│   ├── gateway
│   ├── context
│   ├── intent
│   ├── router
│   ├── policy
│   ├── permissions
│   ├── tools
│   └── response
│
├── voice/
│   ├── vad
│   ├── stt
│   ├── tts
│   ├── streaming
│   └── interruption
│
├── llm/
│   ├── providers
│   ├── openrouter
│   ├── model_router
│   └── prompts
│
├── tools/
│   ├── sessions
│   ├── learners
│   ├── trainers
│   ├── documents
│   ├── attendance
│   ├── finance
│   ├── workflows
│   ├── qualiopi
│   ├── audit
│   ├── quality
│   ├── navigation
│   └── web
│
├── events/
│   ├── listener
│   ├── ai_gate
│   └── proactive
│
└── memory/
    ├── conversation
    ├── navigation
    └── context
```

---

# 52. WEBSOCKET

Frontend et EVE Core peuvent communiquer via WebSocket pour :

```text
voice state
STT partial
EVE state
tool calls
tool results
TTS streaming
chat streaming
navigation commands
alerts
```

---

# 53. JOURNALISATION

Chaque action importante EVE doit être traçable.

```text
EveExecution {
    run_id
    tenant_id
    user_id
    timestamp

    intent

    context

    model

    tools_called[]

    actions[]

    confirmations[]

    result

    latency

    cost
}
```

---

# 54. ACTION EFFECTUÉE PAR EVE

Exemple :

```text
ACTION ACT-99281

Initiated by:
User

Via:
EVE

Tool:
workflow.start

Workflow:
WF-17

Reason:
missing signatures

Targets:
2 learners

Result:
SUCCESS
```

---

# 55. RECHERCHE INTERNET + NAVIGATION

Utilisateur :

> Eve, cherche ce que dit France Compétences sur la sous-traitance CPF.

EVE :

```text
web.search()
```

Puis oralement :

> J’ai trouvé les informations. Je te mets les sources dans le chat.

Le chat :

```text
Résumé :
[...]

Sources :

[France Compétences]

[Mon Compte Formation]

[Ministère du Travail]
```

Utilisateur :

> La deuxième.

EVE comprend :

```text
source_2
```

et ouvre le lien.

---

# 56. CHAT COMME MÉMOIRE VISUELLE

Le chat permet de retrouver :

```text
questions précédentes
réponses
liens
documents
sources
actions
```

Mais il ne remplace pas les données métier.

---

# 57. EVE ET LES DOCUMENTS

Utilisateur :

> Ouvre la convention de Martin.

EVE :

```text
document.search(
 learner=Martin,
 type=convention
)
```

Puis :

```text
ui.open_document(document_id)
```

Le vrai document GSMS est affiché.

---

# 58. EVE ET FINANCEURS

Utilisateur :

> Où en est le dossier OPCO de Martin ?

EVE appelle :

```text
funding.get_case()
```

Puis :

> Le dossier a été envoyé le 12 septembre. Il est toujours en attente et le délai interne de relance est dépassé de quatre jours.

Utilisateur :

> Relance.

EVE déclenche le workflow autorisé.

---

# 59. EVE ET CPF

Utilisateur :

> Prépare le dossier CPF de Sophie.

EVE vérifie :

```text
identité
programme
certification
prérequis
positionnement
dates
prix
documents
```

Puis :

> Le dossier est presque prêt. Il manque uniquement la validation du positionnement.

Elle ne prétend pas avoir effectué une action EDOF si GSMS n’a pas d’intégration officielle permettant cette action.

---

# 60. EVE ET L’AMÉLIORATION CONTINUE

EVE peut croiser :

```text
réclamations
satisfactions
incidents
abandons
examens
findings
actions correctives
```

Puis détecter des tendances difficiles à voir manuellement.

Mais :

```text
AI ANALYSIS
≠
EVIDENCE
```

La donnée originale reste la preuve.

---

# 61. EVE NE MODIFIE PAS LES PREUVES

Exemple :

```text
SURVEY_RESPONSE
= preuve originale

EVE_ANALYSIS
= analyse dérivée
```

Jamais :

```text
UPDATE survey_response
SET comment = AI_SUMMARY
```

---

# 62. AI ANALYSIS

Stocker séparément :

```text
AIAnalysis {
    id
    source_type
    source_id
    model
    timestamp
    classification
    summary
    topics
    severity
    suggestions
}
```

---

# 63. EVE ET L’AUDIT QUALIOPI

EVE peut dire :

> Aucun élément manquant n’a été détecté par GSMS pour cet indicateur.

Mais elle ne doit pas affirmer automatiquement :

> Vous êtes juridiquement conforme.

Chaîne :

```text
EVIDENCE ENGINE
↓
QUALIOPI ENGINE
↓
AUDIT ENGINE
↓
EVE EXPLAINS
↓
HUMAN VALIDATES
```

---

# 64. DAILY BRIEF

Plus tard, EVE peut proposer un brief quotidien.

Exemple :

> Bonjour. Tu as six sessions aujourd’hui. Deux signatures sont manquantes, un formateur n’a pas confirmé sa présence et trois dossiers financeurs sont en attente. Une action corrective Qualiopi arrive à échéance vendredi.

Le détail peut être envoyé dans le chat.

---

# 65. EVE N’EST PAS UN MULTI-AGENT AU DÉPART

V1 :

```text
ONE EVE CORE
+
DOMAIN TOOLS
+
MODEL ROUTER
```

Pas besoin immédiatement de :

```text
Qualiopi Agent
Finance Agent
Session Agent
Audit Agent
CRM Agent
```

Sinon l’architecture devient inutilement complexe.

---

# 66. TOOL REGISTRY

La prochaine couche technique doit être un registre d’outils.

Chaque tool doit déclarer :

```text
NAME
DOMAIN
DESCRIPTION
INPUT SCHEMA
OUTPUT SCHEMA
PERMISSIONS
RISK
CONFIRMATION
AUDIT
```

Exemple :

```yaml
name: session.get_readiness

domain: session

risk: READ

permission:
  session.read

confirmation:
  false

audit:
  true
```

---

# 67. EXEMPLE ACTION

```yaml
name: workflow.start

domain: workflow

risk: SAFE_WRITE

permission:
  workflow.execute

confirmation:
  conditional

audit:
  true
```

---

# 68. EXEMPLE ACTION CRITIQUE

```yaml
name: session.cancel

domain: session

risk: HIGH_RISK

permission:
  session.cancel

confirmation:
  required

audit:
  required
```

---

# 69. ARCHITECTURE FINALE

```text
                              USER
                               │
                        VOICE / TEXT
                               │
                               ▼
                            ◉ EVE
                               │
                               ▼
                    ┌────────────────────┐
                    │      EVE CORE      │
                    ├────────────────────┤
                    │ VAD                │
                    │ STT                │
                    │ Context Builder    │
                    │ Intent Router      │
                    │ Model Router       │
                    │ Policy Engine      │
                    │ Tool Runtime       │
                    │ Web Search         │
                    │ Response Builder   │
                    │ TTS                │
                    └─────────┬──────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
       GSMS TOOLS         WORKFLOWS            WEB
            │                 │                 │
            │                n8n             Search
            │                 │                 │
            └────────────┬────┴─────────────────┘
                         │
                         ▼
                     GSMS CORE
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
 SESSION ENGINE     FINANCE ENGINE    QUALITY ENGINE
        │                │                 │
        ▼                ▼                 ▼
 DOCUMENTS          FUNDING CASES     EVIDENCE ENGINE
                                           │
                                           ▼
                                   QUALIOPI ENGINE
                                           │
                                           ▼
                                      AUDIT ENGINE
                                           │
                                           ▼
                                CONTINUOUS IMPROVEMENT
                         │
                         ▼
                    POSTGRESQL
                         │
                         ▼
               SINGLE SOURCE OF TRUTH


RESULT
  │
  ├──────────────► ELEVENLABS
  │                     │
  │                     ▼
  │                   VOICE
  │
  └──────────────► EVE CHAT
                        │
                        ▼
                TEXT / LINKS / SOURCES


EVE CORE
   │
   ▼
UI COMMAND BUS
   │
   ▼
REACT GSMS
   │
   ├── NAVIGATE
   ├── OPEN
   ├── FILTER
   ├── FOCUS
   └── HIGHLIGHT
```

---

# 70. DOCTRINE EVE

```text
EVE N’EST PAS L’INTERFACE.

GSMS EST L’INTERFACE.

EVE HABITE GSMS.

L’ORBE EST SA PRÉSENCE.

LA VOIX EST SON INTERACTION PRINCIPALE.

LE CHAT EST SON SUPPORT TEXTUEL.

LE CHAT SERT AUX LIENS, SOURCES, DOCUMENTS ET RÉPONSES LONGUES.

EVE COMPREND LA PAGE ACTUELLE.

EVE COMPREND LE CONTEXTE DE LA CONVERSATION.

EVE NAVIGUE NATURELLEMENT DANS GSMS.

EVE INTERROGE LES VRAIES DONNÉES.

EVE PEUT RECHERCHER SUR INTERNET.

EVE PEUT AFFICHER LES SOURCES DANS SON CHAT.

EVE PEUT OUVRIR LES LIENS.

EVE PEUT DÉCLENCHER LES WORKFLOWS AUTORISÉS.

EVE PEUT ÊTRE PROACTIVE.

EVE PEUT ANALYSER QUALIOPI.

EVE PEUT PRÉPARER UN AUDIT.

EVE PEUT ANALYSER LES SATISFACTIONS ET RÉCLAMATIONS.

EVE PEUT DÉTECTER DES TENDANCES.

MAIS :

EVE NE REMPLACE PAS GSMS CORE.

EVE NE REMPLACE PAS N8N.

EVE NE REMPLACE PAS QUALIOPI ENGINE.

EVE NE FABRIQUE PAS DE PREUVES.

EVE NE MODIFIE PAS LES HISTORIQUES.

EVE NE CLIQUE PAS AU HASARD DANS LE DOM.

EVE NE DÉCLARE PAS SEULE LA CONFORMITÉ.

EVE N’EXÉCUTE PAS UNE ACTION SENSIBLE SANS PERMISSION ET CONFIRMATION.
```

---

# 71. FORMULE FINALE

```text
GSMS CORE
= CERVEAU MÉTIER

POSTGRESQL
= MÉMOIRE FACTUELLE

EVENT BUS
= SYSTÈME NERVEUX

N8N
= BRAS D’AUTOMATISATION

EVIDENCE ENGINE
= MÉMOIRE PROBATOIRE

QUALIOPI ENGINE
= CONTRÔLE

AUDIT ENGINE
= INSPECTEUR

OPENROUTER
= RAISONNEMENT IA

ELEVENLABS
= VOIX

UI COMMAND BUS
= NAVIGATION

EVE CHAT
= TEXTE + LIENS + SOURCES

EVE ORB
= PRÉSENCE VISUELLE

EVE CORE
= ORCHESTRATEUR CONVERSATIONNEL

EVE
= ASSISTANTE VOCALE MÉTIER DE GSMS SCHOOL
```

Objectif final :

> EVE doit donner l’impression qu’une assistante compétente connaît l’intégralité de GSMS, comprend immédiatement la page sur laquelle travaille l’utilisateur, peut l’emmener naturellement vers n’importe quelle information, peut chercher à l’extérieur lorsque GSMS ne possède pas la réponse, lui parler avec une voix naturelle, lui déposer les détails et les sources dans son chat et exécuter les opérations autorisées sans jamais remplacer les moteurs métier déterministes qui garantissent la fiabilité du système.