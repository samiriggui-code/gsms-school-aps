# Régions / Conseils régionaux — sources réglementaires

Financement via le Programme Régional de Formation (PRF).

## Nature du financement

Le financement passe par des **marchés publics régionaux** — une logique d'achat/procurement, pas une interface technique transactionnelle par nature.

## Seul flux réellement normalisé : l'offre, en LHÉO XML

- LHÉO est le langage de référence pour le système d'information sur la formation professionnelle, défini par le **décret n° 2015-742 du 24 juin 2015**, élaboré conjointement par les ministères et les opérateurs.
  Source : https://lheo.gouv.fr/
- L'OF publie son offre auprès du **Carif-Oref de sa région**, et cette offre remonte ensuite automatiquement vers Kairos — confirmé explicitement par la documentation Kairos elle-même : *"KAIROS récupère ces données [...] si vous avez des modifications à apporter sur vos formations visibles dans KAIROS, vous devez les faire directement depuis votre CARIF régional."*

## À noter en lecture seule

**API QuiForme** (Réseau des Carif-Oref) : JSON, appel par SIRET, renvoie les certificats Qualiopi au niveau établissement et les habilitations France Compétences. Utile pour un contrôle de conformité des sous-traitants/partenaires GSMS, **sans rapport avec le financement**.
Source : https://www.data.gouv.fr/dataservices/api-quiforme

## Non vérifié

**Aucune API régionale de gestion de dossiers de financement n'a été trouvée**, et les 13-18 régions n'ont pas été auditées individuellement. Une région peut avoir un extranet OF spécifique non détecté par cette recherche.

## Impact architecture GSMS

- `RegionConnector` : transport `XML_FILE` (offre catalogue → Carif-Oref, réutilise potentiellement le même mécanisme LHÉO que EDOF) + `MANUAL_PORTAL` (dossiers de financement, variable par région).
- Pas de connecteur générique à API — traiter au cas par cas si un besoin région précis se présente.
