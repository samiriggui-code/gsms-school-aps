# CPF / EDOF (Caisse des Dépôts) — sources réglementaires

Source prioritaire pour construire `EDOFConnector`. Deux flux distincts, techniquement différents — ne pas les confondre.

## 1. Publication catalogue — XML, pas d'API

- **Kit XML EDOF** : `kit_XML_062026.zip` (862,98 Ko), mis à jour le **12 juin 2026**. Contient les spécifications d'import XML, un exemple de catalogue, et le XSD `Lheo_import_fichier_xml_optimise` (dérivé du langage LHÉO).
- Deux mécanismes documentés : saisie manuelle **ou** import XML, aux trois niveaux Formation → Action → Session.
- Source : https://of.moncompteformation.gouv.fr/espace-public/import-catalogue-de-formations-par-fichier-xml-mise-jour-des-documents

**Aucune API REST n'existe pour la publication catalogue.** Les spécifications XML continuent d'évoluer (dernière catégorisation des offres) — le connecteur GSMS doit être **versionné**.

## 2. Dossiers, service fait, facturation — portail uniquement

- Cycle documenté : entrée en formation → déclaration de service fait → appel à règlement → abondement France Travail éventuel → report/prolongation.
- Depuis le **3 septembre 2026**, un **code de sécurité envoyé par e-mail** est requis pour accéder à l'espace connecté EDOF — ça fragilise toute automatisation de type RPA/robot sur ce portail.
- **La réforme de la facturation électronique B2B (Factur-X/PDP) ne s'applique PAS à EDOF** — confirmé explicitement par la CDC (article du 07/08/2026, màj 25/08) : la saisie des données de facturation reste dans EDOF, le règlement se fait par ordonnancement direct de la CDC. **Ne pas câbler EDOF sur le pipeline Factur-X interne GSMS.**

## Piège identifié : "API EDOF" tierce

Plusieurs éditeurs commercialisent une "API EDOF" (ex. EDOF Manager). **Ce n'est pas une API officielle de la Caisse des Dépôts** — c'est une couche propriétaire d'un tiers qui pilote le portail EDOF pour le compte de l'organisme de formation, probablement via automatisation de portail. Aucune page officielle CDC ne documente d'API transactionnelle EDOF. Ne jamais citer ces offres comme preuve d'une API CDC dans le code ou la doc GSMS.

Les seules API publiques CDC réellement trouvées sont de l'**open data statistique en lecture seule** (opendata.caissedesdepots.fr) — inutilisables pour une intégration transactionnelle.

## À télécharger et archiver localement

- Kit XML EDOF (`kit_XML_062026.zip`)
- Guide import XML
- Guide offre CPF / guide Action / guide Session
- Guide entrée → service fait
- Guide facturation / règlements

## Impact architecture GSMS

- `EDOFConnector` : transport `XML_FILE` (génération/validation) + `MANUAL_PORTAL` (dépôt, dossiers, service fait).
- Ne jamais prévoir `REST_JSON` pour EDOF tant qu'aucune annonce officielle CDC ne le confirme.
- Le connecteur doit être versionné (le XML évolue).
