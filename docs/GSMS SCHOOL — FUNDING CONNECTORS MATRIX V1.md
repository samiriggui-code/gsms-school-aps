# GSMS SCHOOL — FUNDING CONNECTORS MATRIX V1

> **Statut :** living document — matrice de **vérification** des interfaces réellement accessibles à un éditeur / OF.  
> **Date de revue :** 29 août 2026  
> **Doctrine :** ne jamais annoncer « API CPF », « API France Travail », « API OPCO » tant que l’interface n’est pas **vérifiée** (doc officielle éditeur + périmètre OF/CFA + auth + payload).  
> **Socle archi :** `GSMS SCHOOL — FUNDING CONNECTOR ARCHITECTURE V1.md`  
> **Sources officielles :** [`docs/regulatory-sources/`](./regulatory-sources/README.md) · registre [`source-registry.json`](./regulatory-sources/connector-matrix/source-registry.json)  
> **Qualiopi :** 7 critères · **22 indicateurs communs** + **10 spécifiques** selon prestations (= 32) · preuves via Evidence Engine (métier + financeurs), jamais hardcodées dans n8n.

---

## 0. Légende de vérification

| Code | Signification |
|------|----------------|
| **VERIFIED** | Doc officielle consultée ; interface utilisable décrite pour un OF/éditeur dans le périmètre indiqué |
| **PARTIAL** | Interface réelle mais **hors** ou **partielle** pour GSMS (ex. CFA/apprentissage seulement) |
| **UNVERIFIED** | Portail / procédure connus métier ; **pas** de preuve d’API éditeur publique complète à date |
| **ASSISTED** | Mode cible V1 : checklist GSMS + tâche humaine + saisie statut |
| **N/A** | Non applicable à ce financeur / ce flux |

**Modes connecteur GSMS (capability) :**

| Mode | Automatisation |
|------|----------------|
| `XML_FILE` | Génération + validation + export fichier ; import humain ou dépôt automatisé si canal autorisé |
| `REST_JSON` / `SOAP` | Uniquement si **VERIFIED** pour notre usage |
| `MANUAL_PORTAL` | Prépare dossier + lien portail + `record_external_status` |
| `EMAIL` / `CSV` / `SFTP` | Si documenté plus tard ; sinon rester `UNVERIFIED` |

---

## 1. Synthèse exécutive (ce qu’on peut vraiment automatiser)

| Financeur / famille | API publique éditeur (usage GSMS OF) | Automatisable V1 | Reste assisté |
|---------------------|--------------------------------------|------------------|---------------|
| **CPF / EDOF** | **Non** (catalogue : **XML officiel** ; dossiers : portail) | Export catalogue XML + validation XSD | Dossiers CPF, service fait, paiement EDOF |
| **France Travail — portail Kairos** (devis AIF/POEI) | **Non** — saisie écran uniquement | Checklist + mapping statut | Devis AIF/POEI, pièces, facturation via portail |
| **France Travail — famille API Kairos** | **PARTIAL / VERIFIED** (existence + destination OF) — Zéro Saisie, Parcours Formation, Individu, Open Formation | Open Formation (libre) · reste conditionné (compte francetravail.io) | Schémas/scopes OAuth exacts (fiches derrière login) · Anotéa `/api/kairos` = avis seulement (hors funding) |
| **11 OPCO — formation continue** | **Non** (portails OF uniquement ; voir recherche) | `FundingCase` + checklist + router n8n | Demande PEC, pièces, facture, paiement |
| **API Convergence** | **PARTIAL** — norme **CFA ↔ OPCO** (Cerfa + factures **apprentissage**) | Uniquement si GSMS gère l’**apprentissage** + accrochage CFADock | Ne **pas** présenter comme API OPCO « formation continue » |
| **Agefiph** | **UNVERIFIED** | ASSISTED | Dossier handicap / aides |
| **Transitions Pro** | **UNVERIFIED** (réseau régional) | ASSISTED | PTP / dossiers régionaux |
| **Régions** | **UNVERIFIED** (un SI / portail par région) | ASSISTED + config régionale | Marchés / conventions région |
| **Entreprise B2B** | N/A (interne GSMS) | Devis → convention → facture (déjà CRM) | Signature / virement hors SI |

> **Recherche détaillée :** [`regulatory-sources/connector-matrix/RESEARCH-OPCO-KAIROS-2026-08-29.md`](./regulatory-sources/connector-matrix/RESEARCH-OPCO-KAIROS-2026-08-29.md) · capabilities JSON à jour.

---

## 2. Qualiopi (rappel transverse — toutes les lignes)

Les financeurs **n’ont pas** leur propre « case Qualiopi ». Chaîne unique :

```text
FundingCase / ExternalExchange / docs
  → Evidence Engine
  → Qualiopi Engine (applicabilité 22 communs + 10 spécifiques)
  → Audit Engine
```

Preuves financeur typiques (types Evidence, multi-indicateurs) :

| evidence_type (cible) | Exemples sources |
|-----------------------|------------------|
| `funding_agreement` | Accord PEC / validation devis AIF / acceptation CPF |
| `funding_invoice` | Facture émise liée au case |
| `funding_payment` | Encaissement tracé |
| `service_completion` | Attestation réalisation / service fait |
| `attendance_pack` | Émargements (alimente aussi justifs financeur) |
| `catalog_publication` | Preuve export / import catalogue (EDOF XML) |

Indicateurs exacts : **mapping IndicatorRule** (pas de if n8n).

---

## 3. Matrice détaillée

### 3.1 CPF / EDOF

| Champ | Valeur |
|-------|--------|
| **Provider GSMS** | `EDOF` / `funder_type=CPF` |
| **Vérif. interface** | **VERIFIED** (catalogue) · **ASSISTED** (dossiers) |
| **Sources** | [Aide import XML EDOF](https://of.moncompteformation.gouv.fr/espace-public/aide/comment-importer-mes-offres-de-formation-sur-edof) (publié 06/01/2026, MAJ **01/06/2026**) · kit / guide « Importer un catalogue… fichier XML » (Portail OF / Guides) |
| **API disponible ?** | **Non** pour catalogue (XML) · **Non vérifiée** pour cycle de vie dossier éditeur |
| **Format** | Catalogue : **XML** (+ XSD kit) · Dossiers : portail EDOF |
| **Auth** | Compte OF EDOF (connexion Portail / eFP) — **pas** de credentials API éditeur documentés pour GSMS |
| **Données envoyées (catalogue)** | Offres : formation / action / session (mapping depuis Programme/Session GSMS) · codes RNCP/RS · modalités · lieux · tarifs selon schéma |
| **Données reçues** | Compte-rendu / rejets import (doublon, habilitation, certification inactive…) — à **importer / saisir** dans GSMS (`ExternalExchange`) |
| **Documents** | Checklist dossier CPF (identité, positionnement, convention, émargements, attestation…) — portail + Evidence |
| **Automatisation V1** | `cpf.catalog.build` → validate → `export_xml` → tâche « Importer sur EDOF » |
| **n8n** | `FUNDING_FILE_EXPORT` · `FUNDING_XML_VALIDATE` · `FUNDING_MANUAL_TASK` · `FUNDING_CALLBACK_GSMS` · `EVIDENCE_REGISTER` |
| **Events GSMS** | `funding.catalog.export_ready` · `funding.catalog.import_result_recorded` · `funding.case.status_changed` · `funding.manual_task.completed` |
| **Preuves Qualiopi** | `catalog_publication` · accords / service fait / paiement saisis → Evidence |
| **Interdit** | Annoncer « API CPF » · scraper EDOF · fusionner modèle EDOF = modèle GSMS |

---

### 3.2 France Travail / Kairos — **deux flux distincts**

> **Ne pas fusionner.** Le portail Kairos (devis AIF/POEI) et la famille « API Kairos » (francetravail.io) sont des canaux différents.  
> Capacités JSON : `FRANCE_TRAVAIL_KAIROS_PORTAIL` · `FRANCE_TRAVAIL_API_KAIROS` · détail [`france-travail/README.md`](./regulatory-sources/france-travail/README.md).

#### 3.2.a Portail Kairos (devis AIF / POEI) — MANUAL_PORTAL

| Champ | Valeur |
|-------|--------|
| **Provider GSMS** | `FRANCE_TRAVAIL` / `KAIROS_PORTAL` |
| **Vérif. interface** | **VERIFIED** processus portail · **aucune API** de dépôt de devis |
| **Sources** | [Présentation applicatif Kairos](https://actuformation.francetravail.org/sujets/presentation-applicatif-kairos/) |
| **API disponible ?** | **Non** pour création devis AIF/POEI |
| **Format** | Saisie écran (portail-emploi.fr + habilitation GID Partenaires) |
| **Auth** | Compte organisme Kairos (identifiants courrier + GID) |
| **Données envoyées** | Devis AIF/POEI, pièces, facturation selon dispositif (UI) |
| **Données reçues** | Validation / refus conseiller / DE — via portail |
| **Automatisation V1** | `FundingCase` + checklist + `get_external_link` + `record_external_status` |
| **n8n** | `FUNDING_MANUAL_TASK` · relances · callback statut · evidence |
| **Interdit** | Prétendre déposer un devis AIF via REST |

#### 3.2.b Famille « API Kairos » (francetravail.io) — PARTIAL / VERIFIED

| Champ | Valeur |
|-------|--------|
| **Provider GSMS** | `FRANCE_TRAVAIL` / `KAIROS_API` |
| **Vérif. interface** | **PARTIAL / VERIFIED** — existence + destination **OF** confirmées ; schémas/scopes/SLA des 3 API conditionnées **non lus** (login requis) |
| **Sources** | [Catalogue produits partagés](https://francetravail.io/produits-partages/catalogue) · [Open Formation](https://francetravail.io/produits-partages/catalogue/open-formation) (nomme explicitement les 4 API Kairos) · [page acteurs OF](https://www.francetravail.org/accueil/acteurs-de-lemploi/organismes-de-formation/avec-france-travail-recuperez-les-donnees-dont-vous-avez-besoin.html?type=article) · [OAuth2](https://francetravail.io/produits-partages/documentation/utilisation-api-france-travail/requeter-api) |
| **API disponible ?** | **Oui** (4 API) — détail ci-dessous |
| **Auth** | OAuth2 `client_credentials` (compte francetravail.io) · mTLS disponible · Open Formation = licence Etalab (~100k appels/mois) |
| **Accès** | Test données fictives immédiat · données réelles sur demande à `piformation.00885@francetravail.fr` |
| **Automatisation V1** | Open Formation lisible tout de suite · Zéro Saisie / Parcours / Individu = stub + compte francetravail.io avant câblage |
| **Hors périmètre** | Anotéa `/api/kairos` = avis / satisfaction **uniquement** — ne pas brancher sur `FundingCase` |
| **Interdit** | Inventer schémas / scopes · confondre avec le portail devis · brancher AGORA (fermé aux OF) |

| API | Sens | Contenu (documenté) | Accès |
|-----|------|---------------------|-------|
| **Zéro Saisie** (0 Saisie) | OF → France Travail | AIS, AES, présence, résultats — objectif : supprimer la double saisie Kairos | Conditionné (login) |
| **Parcours de Formation** | France Travail → OF | Inscriptions ICO, présences/résultats ICO, AIS, AES (temps réel) | Conditionné |
| **Open Formation** | FT → tous | Infos offre / partenaires, dates RDV session | **Libre** (Etalab) |
| **Individu** / **Individu étendue** | FT → OF (étendue = financeurs) | Données stagiaire côté Kairos | Conditionné / étendue réservée financeurs |

**Action recommandée :** créer un compte [francetravail.io](https://francetravail.io) pour lire les fiches authentifiées (schémas, scopes OAuth, SLA, volumétrie, prérequis contractuels).

---

### 3.3 OPCO — règle générique (formation continue / PEC)

| Champ | Valeur |
|-------|--------|
| **Provider GSMS** | `OPCO` + `opco_code` (adapter) |
| **Vérif. interface** | **UNVERIFIED** pour **OF formation continue** (un portail / règles par OPCO) |
| **API Convergence** | Voir §3.4 — **ne remplace pas** cette ligne |
| **Format** | Portail OF (majoritaire) · EDI/API **uniquement si VERIFIED par OPCO + type d’action** |
| **Auth** | Compte prestataire / OF sur portail OPCO |
| **Données envoyées** | Entreprise, SIRET, OPCO, stagiaire(s), session, montants, pièces PEC |
| **Données reçues** | Accord / partiel / refus, n° dossier, montants, paiement |
| **Documents** | Demande PEC, convention, émargements, attestation, facture |
| **Automatisation V1** | `OpcoConnector` générique + **capability** `manual_portal: true` par défaut |
| **n8n** | `WF-FUNDING-ROUTER` → `FUNDING_MANUAL_TASK` / (plus tard) `FUNDING_API_REQUEST` si capability |
| **Events GSMS** | `funding.opco.identified` · `funding.case.*` · `funding.justification_required` |
| **Preuves Qualiopi** | Même chaîne Evidence |
| **Interdit** | Un mega-workflow n8n « IF OPCO_A … IF OPCO_B » · assumer Convergence = continue |

#### 3.3.1 Les 11 OPCO (ligne individuelle — état V1)

Tant qu’aucune fiche technique éditeur **formation continue** n’est jointe, chaque ligne = **ASSISTED / UNVERIFIED**.

| OPCO | Code adapter | Portail / API OF continue | Mode V1 | Notes |
|------|--------------|---------------------------|---------|-------|
| AFDAS | `Afdas` | UNVERIFIED | MANUAL_PORTAL | Vérifier doc « prestataire formation » |
| AKTO | `Akto` | UNVERIFIED | MANUAL_PORTAL | Idem |
| ATLAS | `Atlas` | UNVERIFIED | MANUAL_PORTAL | Publié API Convergence **CFA** (apprentissage) — ≠ continue |
| Constructys | `Constructys` | UNVERIFIED | MANUAL_PORTAL | Idem |
| OPCO EP | `EP` | UNVERIFIED | MANUAL_PORTAL | Portail OF annoncé côté EP — **pas** = API éditeur |
| OCAPIAT | `Ocapiat` | UNVERIFIED | MANUAL_PORTAL | Idem |
| L’Opcommerce | `Opcommerce` | UNVERIFIED | MANUAL_PORTAL | Page « API Convergence » = **apprentissage** |
| OPCO 2i | `Opco2i` | UNVERIFIED | MANUAL_PORTAL | Idem |
| OPCO Mobilités | `Mobilites` | UNVERIFIED | MANUAL_PORTAL | Idem |
| OPCO Santé | `Sante` | UNVERIFIED | MANUAL_PORTAL | Idem |
| Uniformation | `Uniformation` | UNVERIFIED | MANUAL_PORTAL | Idem |

**Processus de promotion d’une ligne vers VERIFIED :** joindre URL OpenAPI / guide EDI + périmètre (continue vs apprentissage) + auth + champs in/out + date de revue → alors seulement `application_api` / `invoice_api` dans capabilities.

---

### 3.4 API Convergence (CFADock) — hors confusion

| Champ | Valeur |
|-------|--------|
| **Quoi** | Norme d’échange **CFA ↔ OPCO** ([portail développeur CFADock](https://www.cfadock.fr/portail_developpeur)) |
| **Périmètre VERIFIED** | Transmission **Cerfa** + **factures** (apprentissage) · OpenAPI · règles inter-OPCO · accrochage par OPCO |
| **Pour GSMS School (OF hors CFA)** | **PARTIAL / hors scope V1** sauf produit apprentissage explicite |
| **Ne pas dire** | « Les OPCO ont une API pour GSMS » |

---

### 3.5 Agefiph

| Champ | Valeur |
|-------|--------|
| **Vérif.** | **UNVERIFIED** |
| **API ?** | Non vérifiée pour éditeur |
| **Mode V1** | MANUAL_PORTAL / ASSISTED |
| **n8n / events / preuves** | Même patron `FundingCase` + Evidence (handicap / adaptations croisées WF-04 / référent) |
| **Note** | Partenariats Transitions Pro ≠ API |

---

### 3.6 Transitions Pro

| Champ | Valeur |
|-------|--------|
| **Vérif.** | **UNVERIFIED** (instances régionales) |
| **API ?** | Non vérifiée |
| **Mode V1** | MANUAL_PORTAL + config `region_code` |
| **Données** | Dossier PTP, accord, facturation selon région |
| **Interdit** | Un seul connecteur « national » sans variations régionales |

---

### 3.7 Régions (conseils régionaux / marchés)

| Champ | Valeur |
|-------|--------|
| **Vérif.** | **UNVERIFIED** (N systèmes) |
| **API ?** | Par région — à inventorier **une à une** |
| **Mode V1** | `FunderWorkflow` générique + `ConnectorConfig` régional |
| **Automatisation** | Checklist + documents marché / convention |

---

### 3.8 Entreprise (B2B) / autofinancement

| Champ | Valeur |
|-------|--------|
| **Vérif.** | **VERIFIED** (interne GSMS) |
| **API externe** | N/A |
| **Format** | JSON interne CRM |
| **Flux** | Devis → convention → session → facture → paiement |
| **UI** | Finance (devis/factures) · pas un connecteur externe |
| **Preuves** | Convention signée, facture, paiement → Evidence |

---

## 4. Colonnes n8n / events / preuves (patron commun)

Tout connecteur (même ASSISTED) suit :

```text
funding.action_required
  → WF-FUNDING-ROUTER
  → LOAD FundingCase + ConnectorCapabilities
  → EXECUTE (API | XML | MANUAL_TASK)
  → ExternalExchange
  → normalize status → FundingCase
  → EvidenceRegister (si doc/event probant)
  → Qualiopi recalculate (si indicator_links)
```

| Brique n8n | Usage |
|------------|--------|
| `FUNDING_CONNECTOR_EXECUTE` | Entrée unique |
| `FUNDING_XML_VALIDATE` / `FUNDING_FILE_EXPORT` | EDOF catalogue |
| `FUNDING_API_REQUEST` | **Uniquement** capability VERIFIED |
| `FUNDING_MANUAL_TASK` | Défaut V1 OPCO / FT / Agefiph / TP / Régions |
| `FUNDING_WEBHOOK_RECEIVE` | Si webhook VERIFIED plus tard |
| `FUNDING_STATUS_SYNC` | Polling **si** autorisé |
| `FUNDING_CALLBACK_GSMS` | POST events GSMS |
| `EVIDENCE_REGISTER` | Jamais fabriquer de preuve |

Events canoniques (exemples) :

```text
funding.case.created
funding.case.status_changed
funding.documents.required
funding.ready_to_submit
funding.submitted
funding.approved | funding.rejected | funding.partial
funding.service_started | funding.service_completed
funding.justification_required
funding.invoiced | funding.paid | funding.closed
funding.catalog.export_ready
funding.external_exchange.recorded
funding.manual_task.created | funding.manual_task.completed
```

---

## 5. Matrice « quoi coder maintenant »

| Priorité | Livrable | Pourquoi |
|----------|----------|----------|
| P0 | `FundingCase` + state machine + UI Financeurs | Socle commun toutes lignes |
| P0 | Checklist docs + `ExternalExchange` + mapping statut | Assisté traçable = preuve |
| P1 | **EDOF** : mapper catalogue → XML + XSD + tâche import | Seule interface **VERIFIED** catalogue |
| P1 | Router n8n générique + MANUAL_TASK | Sans if par financeur |
| P2 | Adapters OPCO (config + liens portail) | Pas d’API inventée |
| P2 | France Travail — portail Kairos assisted | Devis AIF/POEI = MANUAL_PORTAL (pas d’API devis) |
| P2 | France Travail — API Kairos (Open Formation + stubs) | Famille VERIFIED existence ; compte francetravail.io pour fiches Zéro Saisie / Parcours / Individu |
| P3 | Agefiph / TP / Régions configs | Idem |
| P∞ | API Convergence | Seulement si scope **apprentissage** produit |

---

## 6. Journal de vérification (à remplir au fil de l’eau)

| Date | Provider | Décision | Preuve (URL / doc) | Reviewer |
|------|----------|----------|--------------------|----------|
| 2026-08-29 | EDOF catalogue | VERIFIED XML import | of.moncompteformation.gouv.fr aide import XML (MAJ 01/06/2026) | — |
| 2026-08-29 | EDOF dossiers | ASSISTED | Pas d’API éditeur dossier trouvée | — |
| 2026-08-29 | Kairos portail (AIF/POEI) | ASSISTED / MANUAL_PORTAL | Actu Formation Kairos — pas d’API devis | — |
| 2026-08-29 | Famille API Kairos (FT) | PARTIAL / VERIFIED | francetravail.io catalogue + Open Formation + OAuth2 · Anotéa hors funding | — |
| 2026-08-29 | API Convergence | PARTIAL (CFA apprentissage) | cfadock.fr portail_developpeur | — |
| 2026-08-29 | 11 OPCO continue | UNVERIFIED | — | — |
| 2026-08-29 | Agefiph / TP / Régions | UNVERIFIED | — | — |

---

## 7. Doctrine Cursor / Claude (copier-coller)

```text
NE PAS annoncer API CPF / FT / OPCO sans ligne VERIFIED/PARTIAL dans cette matrice.
FT = deux canaux : portail Kairos (devis AIF = MANUAL) ≠ famille API Kairos (francetravail.io).
EDOF catalogue = XML officiel ; dossiers = assisted jusqu’à preuve contraire.
API Convergence = CFA / apprentissage ; pas un raccourci « OPCO API » pour la continue.
FundingCase GSMS = source de vérité ; n8n orchestre ; Evidence → Qualiopi.
Qualiopi = 7 critères, 22 communs + 10 spécifiques ; preuves issues des process métier + financeurs.
Scraper un portail authentifié ≠ intégration officielle.
```

---

## 8. Lien UI CRM

| Page | Rôle matrice |
|------|----------------|
| `/administration-facturation/finance/financeurs` | Registre providers + cases + tâches manuelles |
| Suivi tableau → onglet funding | Vue session du `FundingCase` |
| Qualiopi classeur | Consomme Evidence, ne saisit pas le financement |
| Circuits n8n | Exécute router funding, ne détient pas le case |

## 9. Sources officielles (bibliothèque repo)

Voir [`docs/regulatory-sources/`](./regulatory-sources/README.md) :

- EDOF kit XML `062026` + guides catalogue / dossiers / DSF / facturation / abondement FT
- Qualiopi RNQ ministère + Guide de lecture V9 (PDF à poser manuellement si CLI bloqué)
- Fiches 11 OPCO / FT / Agefiph (checklist ; `api_available=false` par défaut)
- `connector-matrix/source-registry.json` — traçabilité CODE → SPEC → SOURCE
