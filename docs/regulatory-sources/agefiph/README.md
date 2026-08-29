# Agefiph — sources réglementaires

Financement/accompagnement lié au handicap. Touche simultanément le Funding Engine, le Learner Accessibility / Handicap Workflow, l'Evidence Engine et Qualiopi (indicateur 26 — accueil/accompagnement des publics en situation de handicap).

## Ce qui existe

- **Téléservice de dépôt de demande d'aide** (`dossiers.agefiph.fr`) : formulaire web, propose explicitement un profil "Organisme de formation et CFA". Suivi de l'avancement et échanges avec l'instructeur depuis l'espace personnel.
  Source : https://www.agefiph.fr/aides-handicap/depot-demande
- **Extranet prestataires** (`suiviaction.agefiph.fr`) : suivi d'activité couvrant explicitement "Formation (collective et individuelle)", Inclu'Pro formation, etc.
  Source : https://www.agefiph.fr/demarche/prestataires-acces-extranet-et-service-appuis-specifiques-en-ligne
- Une plateforme distincte (`aides-financieres.agefiph.fr/professionnels`) existe depuis le 03/04/2024, réservée aux prestataires Appuis Spécifiques.

## Non vérifié

**Aucune documentation d'API, aucun portail développeur, aucune référence Agefiph sur data.gouv.fr/api.gouv.fr n'a été trouvée.** L'absence d'API n'est pas prouvée formellement — seulement non documentée publiquement. Un contact direct avec l'Agefiph serait nécessaire pour conclure définitivement.

## Impact architecture GSMS

- `AgefiphConnector` : transport `MANUAL_PORTAL` par défaut.
- Ne pas déclarer `api_available: false` de façon définitive dans le code — garder `verified: false` avec le motif, au cas où une API existerait sans être documentée publiquement.
