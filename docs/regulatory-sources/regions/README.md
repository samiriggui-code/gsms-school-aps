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

## Statut vérification (mise à jour 29/08/2026) — Île-de-France

GSMS School est déclaré en **Île-de-France** (`companyRegion`/`ndaRegion` du seed) — seule région dont le process de gestion des dossiers stagiaires financés PRF a été vérifié pour l'instant, avec la même logique que pour Transitions Pro (vérifier la région réellement utile plutôt qu'un audit générique des 13-18 régions).

Process confirmé :
- Dossier stagiaire créé via formulaire **RS1** (rémunération), transmis à l'**ASP (Agence de services et de paiement)** — l'ASP gère l'administratif, le calcul, le paiement et le recouvrement pour le compte de la Région.
- L'OF est **le seul interlocuteur du stagiaire** pendant la formation ; il assure la « transmission dématérialisée des déclarations d'absences des stagiaires ».
- Une fois le dossier stagiaire validé par la Région, l'OF doit saisir « en continu » les relevés de présence mensuels (absences + présence réelle) sur une **plateforme dématérialisée** — l'extranet **RemuNet** (`remunet.asp-public.fr`), authentification par identifiants.
- Volet stagiaire (suivi de sa rémunération) séparé, sur `maremuneration.iledefrance.fr` — pas le portail utile pour GSMS (celui-ci est réservé au stagiaire, pas à l'OF).

**Transport confirmé : `MANUAL_PORTAL`, pas d'API.** RemuNet semble être une plateforme ASP générique (pas propre à l'IDF — l'ASP gère aussi la rémunération stagiaires pour d'autres dispositifs/régions comme le Grand Est via un extranet différent nommé DEFI), donc ne pas supposer que RemuNet est universel à toutes les régions sans vérification individuelle — seul le lien ASP↔Région IDF↔RemuNet est confirmé ici.

## Non vérifié

- Les 12-17 autres régions n'ont pas été auditées individuellement — non prioritaire tant que GSMS n'opère pas hors IDF.
- Si une autre région PRF devient pertinente un jour, vérifier au cas par cas si elle utilise aussi RemuNet ou un extranet propre (ex. DEFI pour Grand Est).

## Impact architecture GSMS

- `RegionConnector` : transport `XML_FILE` (offre catalogue → Carif-Oref, réutilise potentiellement le même mécanisme LHÉO que EDOF) + `MANUAL_PORTAL` (dossiers stagiaires PRF via RemuNet pour l'IDF — RS1 + saisie mensuelle de présence).
- Pas de connecteur générique à API — traiter au cas par cas si un besoin région précis se présente hors IDF.
