# Qualiopi — sources réglementaires

## Référence

**Référentiel national qualité (RNQ) — Guide de lecture Qualiopi**, publié par le Ministère du Travail (version janvier 2024, la même V9 utilisée pour le seed GSMS `qualiopi-indicators-v9.js`).

- 7 critères
- 22 indicateurs communs à tous les prestataires
- 10 indicateurs spécifiques (CFA notamment)

Le RNQ confirme explicitement que la certification Qualiopi **conditionne l'accès aux fonds publics et mutualisés** des financeurs suivants :

- OPCO
- Transitions Pro
- État
- Régions
- Caisse des Dépôts (CPF)
- France Travail
- Agefiph

C'est cette source qui doit accompagner le mapping `EvidenceRule → QualiopiRequirement` décrit dans `docs/GSMS SCHOOL — ARCHITECTURE QUALIOPI, PREUVES, SESSIONS ET AUDIT.md` (§9, Qualiopi Engine) : la couverture d'un indicateur ne doit jamais être déclarée automatiquement `COMPLIANT`, la décision finale reste une question d'audit humain.

## À faire

- Récupérer et archiver localement le PDF du Guide de lecture RNQ officiel.
- Construire `mappings.md` (indicateur → types de preuve recevables) une fois l'Evidence Engine posé — pas avant, pour éviter de fabriquer un mapping non vérifié.
