# OPCO — sources réglementaires

## Liste officielle (11, confirmée 29/08/2026)

AFDAS, AKTO, ATLAS, Constructys, **L'Opcommerce**, OCAPIAT, OPCO 2i, OPCO EP (Entreprises de Proximité), OPCO Mobilités, OPCO Santé, Uniformation.

Source : https://travail-emploi.gouv.fr/les-operateurs-de-competences-opco — aucune fusion constatée à ce jour.

## Correction importante à la vision de départ

**Il existe bien une norme technique commune inter-OPCO** — mais elle est **cantonnée à l'apprentissage**, pas au financement continu classique.

> "Atlas et les 10 autres opérateurs de compétences ont travaillé conjointement à la création d'un portail inter-Opco qui permet aux CFA de leur transmettre des données par l'intermédiaire d'une norme d'échange unique." — Atlas

- Norme : **API Convergence CFA/OPCO**, REST/JSON, OpenAPI 3.0.4, statut "En production"
- Portails développeurs : https://www.cfadock.fr/portail_developpeur et https://www.transopco.info/portail_developpeur
- Authentification : clé API `X-API-KEY` (**CFA_KEY, une par OPCO**) + headers `EDITEUR`/`LOGICIEL`/`VERSION` obligatoires
- Endpoints (extraits Swagger public) : `POST /v1|v2/dossiers`, `GET /dossiers`, `/dossiers/etats`, `/dossiers/liste`, `POST /v1/conventions`, `POST /v1/factures`, `GET /v2/factures/etats`, `POST /v2/certificats`, `POST /v1/documents`, `POST /v2/dossiers/rupture/employeur`, `GET /v2/cfakeyinfo`

## État d'implémentation par OPCO (relevé au 28/07/2026)

**Point crucial pour le connecteur : ce n'est pas "une" API, c'est une norme implémentée à des rythmes très différents.**

| Périmètre | En production | Retardataires |
|---|---|---|
| Contrats Cerfa V14 protocole V1 | 10 OPCO sur 11 | OPCO Santé (en développement, étude 2026) |
| Contrats Cerfa V14 protocole V2 | AKTO, ATLAS, L'Opcommerce, OCAPIAT, Mobilités | AFDAS, Constructys, OPCO 2i, Uniformation, Santé (dév.) ; OPCO EP (recette) |
| Factures | 10 OPCO (depuis 2022-2023) | Uniformation (dév.) |
| État des factures (GET) | AKTO, ATLAS, L'Opcommerce, OCAPIAT, Mobilités | AFDAS (T2 2026), Constructys, OPCO 2i, OPCO EP, Santé, Uniformation |
| Conventions | 10 OPCO | OPCO Santé |
| Certificats de réalisation | **AFDAS uniquement** (20/10/2025) | Les 10 autres (en développement) |

Source (tableau vivant, à revérifier périodiquement) : https://www.cfadock.fr/portail_developpeur/Accrochage

## Hors apprentissage — aucune API trouvée

Pour le **plan de développement des compétences** (financement continu classique, hors CFA/apprentissage) : **vérifié individuellement pour AFDAS et ATLAS seulement**. Circuit purement portail (ex. MyA/Afdas : le prestataire certifie l'assiduité puis dépose sa facture depuis son espace sécurisé). Aucune norme ni API trouvée.

**Les 7 autres OPCO (AKTO, Constructys, L'Opcommerce, OCAPIAT, OPCO Mobilités, OPCO Santé, Uniformation) restent non vérifiés individuellement sur ce volet précis.**

## Impact architecture GSMS

- `OpcoConnector` doit être **un connecteur REST_JSON unique + une matrice de capacités par OPCO** (quelle route est supportée, en quelle version) — pas 11 implémentations différentes.
- **Un secret distinct par OPCO** (CFA_KEY récupérée dans l'extranet propre à chaque OPCO).
- Si GSMS School n'a pas d'activité CFA/apprentissage, l'API Convergence ne s'applique pas du tout — à trancher côté métier avant tout chiffrage.
- Hors apprentissage : `MANUAL_PORTAL` par défaut pour les 11, avec vérification individuelle à faire pour les 9 non confirmées (2 déjà faites : AFDAS, ATLAS).
