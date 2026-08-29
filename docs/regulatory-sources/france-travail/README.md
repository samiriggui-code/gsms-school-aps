# France Travail / Kairos / AIF — sources réglementaires

**Correction importante à la vision de départ** : France Travail n'est pas "portail uniquement" — il existe bien des API pour les organismes de formation, en plus du portail Kairos.

## Kairos (portail) — pas d'API

Kairos est l'applicatif par lequel l'OF transmet le parcours de formation d'un demandeur d'emploi (obligation des 3 jours, décret n° 2017-1019 modifié par le décret n° 2019-1386).

- Accès : demande d'adhésion → identifiants envoyés **par courrier papier** → habilitation via GID Partenaires.
- Les devis AIF et POEI se créent **dans Kairos**, transmis au demandeur d'emploi (acceptation dans son espace personnel) puis au conseiller (validation) ; l'inscription se fait ensuite via AIS.
- La saisie de devis est conditionnée à l'affichage de la certification Qualiopi dans l'onglet "Informations prestataire / Qualité" de Kairos.
- Source : https://actuformation.francetravail.org/sujets/presentation-applicatif-kairos/

**Aucune API de dépôt de devis AIF n'existe** — confirmé par absence au catalogue francetravail.io et par le parcours documenté.

## Famille "API Kairos" — API réelles, destinées aux OF

Confirmé par la fiche officielle Open Formation : *"L'API Open Formation fait partie des API Kairos qui regroupent l'API Individu, l'API Zéro saisie, l'API Parcours Formation, et l'API Open Formation."*

| API | Sens | Contenu |
|---|---|---|
| **Zéro Saisie** (0 Saisie) | OF → France Travail | AIS, AES, **présence**, **résultats**. Objectif : supprimer la double saisie Kairos. |
| **Parcours de Formation** | France Travail → OF | Inscriptions ICO, présences/résultats ICO, AIS, AES (temps réel). |
| **Individu** | France Travail → OF | Consultation données Kairos du stagiaire. Variante "Individu étendue" réservée aux financeurs. |
| **Open Formation** | France Travail → tous | Plages de candidature, dates/détails RDV de session. **Accès libre** (licence Etalab, ~100 000 appels/mois). |

## Authentification

OAuth2 `client_credentials` (client id + secret via compte francetravail.io), mTLS disponible. Source : https://francetravail.io/produits-partages/documentation/utilisation-api-france-travail/requeter-api

**Accès conditionné** pour Zéro Saisie / Parcours Formation / Individu : les fiches détaillées sont derrière login francetravail.io (non consultées lors de cette recherche). Parcours documenté : mode test avec données fictives, puis demande d'accès aux données réelles auprès de `piformation.00885@francetravail.fr`.

## AGORA — hors périmètre

AGORA (hub de données CDC/DGEFP, art. L.6353-10) a bien des API, mais ses **critères d'éligibilité excluent explicitement les organismes de formation** : usage réservé aux financeurs (Régions, OPCO, France Travail, Conseils départementaux, opérateurs CEP). Un OF n'a pas vocation à s'y connecter directement — il l'alimente indirectement via ses financeurs. Ne pas prévoir de connecteur GSMS.

## Action recommandée (faible coût, fort rendement)

**Créer un compte francetravail.io** pour lire les 3 fiches API authentifiées (Zéro Saisie, Parcours Formation, Individu) et obtenir : schémas exacts, scopes OAuth, SLA, volumétrie, prérequis contractuels.

## Impact architecture GSMS

- `FranceTravailConnector` : transport `REST_JSON` pour la famille API Kairos, `MANUAL_PORTAL` pour tout ce qui reste dans Kairos lui-même (devis AIF/POEI).
- Distinguer clairement, dans le code, "France Travail via API Kairos" de "Kairos portail" — ce ne sont pas les mêmes flux techniques.
