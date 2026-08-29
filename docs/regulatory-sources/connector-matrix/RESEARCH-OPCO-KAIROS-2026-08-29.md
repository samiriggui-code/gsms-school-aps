# Recherche interfaces techniques — OPCO + KAIROS

**Date :** 29 août 2026 · **Correction FT/API :** même jour (relecture indépendante)  
**Méthode :** sources officielles uniquement · pas d’invention d’API · continue OF ≠ Convergence CFA  
**Statut global V1 continue :** **MANUAL_PORTAL** pour les 11 OPCO · **deux canaux FT** (portail devis vs famille API Kairos)

---

## Synthèse

| Provider | api_available (OF continue / financement) | verification | Mode V1 | Preuve principale |
|----------|---------------------------------------------|--------------|---------|-------------------|
| FRANCE_TRAVAIL_KAIROS **portail** (devis AIF/POEI) | **false** | ASSISTED / MANUAL_PORTAL | MANUAL_PORTAL | [Présentation Kairos](https://actuformation.francetravail.org/sujets/presentation-applicatif-kairos/) |
| FRANCE_TRAVAIL_KAIROS **famille API** | **true** | **PARTIAL / VERIFIED** | REST_JSON (Open Formation libre · 3 autres conditionnées) | [Catalogue](https://francetravail.io/produits-partages/catalogue) · [Open Formation](https://francetravail.io/produits-partages/catalogue/open-formation) · [OAuth2](https://francetravail.io/produits-partages/documentation/utilisation-api-france-travail/requeter-api) |
| Anotéa « Kairos » API | **true** mais **hors funding** | PARTIAL | N/A funding | Swagger Anotéa (auth URL / éligibilité avis) |
| AFDAS | **false** | ASSISTED | MANUAL_PORTAL | MyA Prestataires |
| AKTO | **false** | ASSISTED | MANUAL_PORTAL | Site akto.fr (pas de doc API OF trouvée) |
| ATLAS | **false** (continue) | ASSISTED | MANUAL_PORTAL | myAtlas OF — dépôt factures / présence |
| Constructys | **false** | ASSISTED | MANUAL_PORTAL | Pas de doc API trouvée |
| OCAPIAT | **false** | ASSISTED | MANUAL_PORTAL | monespace.ocapiat.fr / services en ligne |
| OPCO 2i | **false** | ASSISTED | MANUAL_PORTAL | portail.opco2i.fr (Mon Compte 2i) |
| OPCO EP | **false** | ASSISTED | MANUAL_PORTAL | messervicesenligne-of.opcoep.fr |
| L’Opcommerce | **false** (continue) | ASSISTED | MANUAL_PORTAL | Portail prestataire ; WS Entreprise ≠ OF API |
| OPCO Mobilités | **false** | ASSISTED | MANUAL_PORTAL | M-Gestion Organisme de Formation |
| OPCO Santé | **false** | ASSISTED | MANUAL_PORTAL | Portail / facturation électronique (pas API éditeur) |
| Uniformation | **false** | ASSISTED | MANUAL_PORTAL | Espace privé (pas API trouvée) |
| API Convergence | **true** | PARTIAL | REST (CFA only) | cfadock.fr — Cerfa + factures **apprentissage** |

### Automatisable maintenant (financement)

- **Rien en REST financement continue** pour les **11 OPCO**.
- **France Travail :** Open Formation utilisable (accès libre) ; Zéro Saisie / Parcours Formation / Individu = existence **VERIFIED**, câblage après lecture fiches login + contrat.
- EDOF catalogue XML reste le seul flux technique **VERIFIED** côté CPF (hors cette recherche).
- Devis AIF/POEI restent **MANUAL_PORTAL** (Kairos applicatif).

### MANUAL_ASSISTED (défaut V1)

Tous les `FundingCase` OPCO + FT devis AIF → checklist + lien portail + `record_external_status` + Evidence.  
Les échanges AIS/AES/présences via API Kairos = canal séparé (`FRANCE_TRAVAIL_API_KAIROS`).

### À re-vérifier plus tard

| Piste | Pourquoi |
|-------|----------|
| Fiches Zéro Saisie / Parcours / Individu (login francetravail.io) | Schémas, scopes OAuth, SLA, volumétrie, prérequis contractuels |
| Opcommerce « Web services Entreprise » / Click&Form | Existe côté **entreprise** — pas prouvé comme API OF continue pour GSMS |
| Facturation électronique OPCO 2026 | Obligation e-facture ≠ API partenaire documentée pour éditeur |
| Accrochage Convergence si produit **apprentissage** | Doc OpenAPI CFADock réelle |

---

## Détail France Travail / Kairos

### FRANCE_TRAVAIL_KAIROS — portail (devis AIF/POEI)

- **adapter_id:** `FranceTravailKairosPortal`
- **verification:** ASSISTED / VERIFIED processus
- **api_available:** **false** (création devis)
- **transports:** MANUAL_PORTAL
- **périmètre:** Devis AIF/POEI, pièces, facturation UI
- **portail:** https://www.portail-emploi.fr/portail-tap/mireconnexion · doc https://actuformation.francetravail.org/sujets/presentation-applicatif-kairos/
- **conclusion:** Procédure dématérialisée via applicatif · **pas** d’API de dépôt de devis.

### FRANCE_TRAVAIL_KAIROS — famille API (francetravail.io)

- **adapter_id:** `FranceTravailKairosApi`
- **verification:** **PARTIAL / VERIFIED**
- **api_available:** **true**
- **transports:** REST_JSON · OAuth2 client_credentials · mTLS optionnel
- **catalogue:** https://francetravail.io/produits-partages/catalogue
- **page OF:** https://www.francetravail.org/accueil/acteurs-de-lemploi/organismes-de-formation/avec-france-travail-recuperez-les-donnees-dont-vous-avez-besoin.html?type=article
- **Open Formation** (nomme les 4 API) : https://francetravail.io/produits-partages/catalogue/open-formation
- **OAuth2 :** https://francetravail.io/produits-partages/documentation/utilisation-api-france-travail/requeter-api
- **Contact données réelles :** piformation.00885@francetravail.fr

| API | Sens | Contenu | Accès |
|-----|------|---------|-------|
| Zéro Saisie | OF → FT | AIS, AES, présence, résultats (anti double saisie Kairos) | Conditionné |
| Parcours de Formation | FT → OF | Inscriptions / présences / résultats ICO, AIS, AES | Conditionné |
| Open Formation | FT → tous | Offre / RDV session | Libre Etalab ~100k/mois |
| Individu (+ étendue) | FT → OF | Données stagiaire Kairos (étendue = financeurs) | Conditionné |

**Reste UNVERIFIED (fiches login) :** schémas exacts · scopes OAuth · SLA · volumétrie · prérequis contractuels Zéro Saisie / Parcours / Individu.

**Action recommandée :** créer un compte francetravail.io pour lire les fiches authentifiées.

### Anotéa Kairos (hors Funding Engine)

- **verification:** PARTIAL
- **api_available:** true
- **périmètre:** avis satisfaction Anotéa (generate-auth-url, check-if-organisme-is-eligible)
- **doc:** https://anotea.francetravail.fr/api/kairos/doc/
- **conclusion:** Ne pas brancher sur `FundingCase` / facturation. **≠** famille API Kairos ci-dessus.

---

## Détail 11 OPCO (continue)

### AFDAS
- Portail: MyA Prestataires — https://www.afdas.com/prestataire.html · login https://afdas.my.site.com/Prestataire/s/login/
- API continue: non trouvée → MANUAL_PORTAL

### AKTO
- Site: https://www.akto.fr/
- Mentions prestataires / CFA dans actualités ; **pas** de portail développeur / OpenAPI OF trouvé → MANUAL_PORTAL

### ATLAS
- Portail OF: https://www.opco-atlas.fr/prestataire/espace-organisme-formation.html · https://myatlas.opco-atlas.fr/
- Fonctions documentées: suivi dossiers, dépôt factures + attestations présence
- API Convergence CFA: page séparée (apprentissage) — PARTIAL hors continue
- Continue API: false → MANUAL_PORTAL

### Constructys
- Site: https://www.constructys.fr/
- Pas de doc API/EDI OF trouvée → MANUAL_PORTAL

### OCAPIAT
- https://monespace.ocapiat.fr/ · https://www.ocapiat.fr/services-en-ligne/
- Enregistrement OF documenté → MANUAL_PORTAL

### OPCO 2i
- Portail: https://portail.opco2i.fr/ · référencement OF https://www.opco2i.fr/vos-projets/faire-referencer-votre-organisme-de-formation-cfa/
- MANUAL_PORTAL

### OPCO EP
- Dossiers formation: https://messervicesenligne-of.opcoep.fr/
- Apprentissage: https://cfa.opcoep.fr/
- Prestataire hub: https://www.opcoep.fr/prestataire-de-formation
- MANUAL_PORTAL (continue)

### L’Opcommerce
- Convergence: https://www.lopcommerce.com/prestataire-de-formation/collaborer-avec-lopcommerce/api-convergence/ → **apprentissage CFA**
- Mentions « Web services Entreprise » / Click&Form → **ne pas** activer pour OF continue sans doc dédiée
- MANUAL_PORTAL (continue)

### OPCO Mobilités
- M-Gestion OF + guide PDF: https://www.opcomobilites.fr/organismes-de-formation/
- MANUAL_PORTAL

### OPCO Santé
- https://opco-sante.fr/ · facturation électronique annoncée 2026
- Pas d’OpenAPI OF trouvée → MANUAL_PORTAL

### Uniformation
- https://www.uniformation.fr/ · espace privé (évolution login)
- Pas d’OpenAPI OF trouvée → MANUAL_PORTAL

---

## API Convergence (rappel)

- https://www.cfadock.fr/portail_developpeur
- OpenAPI · Cerfa + factures · **CFA ↔ OPCO**
- `enabled_for_gsms_v1`: **false** sauf produit apprentissage

---

## Impact GSMS

```text
connector-capabilities.json
  → FRANCE_TRAVAIL_KAIROS_PORTAIL  api_available=false  (devis AIF/POEI)
  → FRANCE_TRAVAIL_API_KAIROS      api_available=true   (4 API · PARTIAL schémas)
  → OPCO_* continue                api_available=false
  → AGORA                          hors OF (in_scope_for_gsms=false)

n8n
  → FUNDING_MANUAL_TASK pour devis FT + OPCO continue
  → futur REST pour API Kairos après fiches login

FundingCase
  → get_external_link(portail) pour devis
  → canal API séparé pour AIS/AES/présences (pas mélanger)

Evidence
  → docs portail + échanges API une fois câblés
```
