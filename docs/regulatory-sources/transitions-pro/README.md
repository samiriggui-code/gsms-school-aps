# Transitions Pro — sources réglementaires

Financement du Projet de Transition Professionnelle (PTP, ex-CIF).

## Ce qui existe

- Dossier PTP **100 % dématérialisé depuis le 06/04/2020**, en **trois volets remplis séparément** par le salarié, l'organisme de formation et l'employeur, chacun depuis son espace personnel.
- L'OF y déclare les heures réalisées (saisie journalière d'assiduité, certification mensuelle) et y dépose le **certificat de réalisation**, qui a remplacé les attestations de présence depuis le **01/06/2020**.
  Source : https://www.transitionspro.fr/entreprises-et-organismes/nos-services-aux-organismes-de-formation/

## Structure régionale — nuance importante

Transitions Pro n'est **pas une entité unique** mais **14 associations régionales distinctes**, chacune avec son propre site et espace : transitionspro-idf.fr, -ara.fr, -occitanie.fr, -grandest.fr, -pdl.fr, -hdf.fr, -paca.fr, -cvl.fr, -reunion.fr, etc. Les tutoriels destinés aux OF sont publiés par région (ex. IDF, ARA consultés), ce qui suggère un socle applicatif commun avec des accès et variantes régionales.

**Aucune API publiée n'a été trouvée sur aucune des instances consultées.**

## Non vérifié

L'hypothèse "socle commun, accès régionaux distincts" est plausible mais non confirmée — aucune source ne nomme un outil national partagé entre les 14 ATpro.

## Impact architecture GSMS

- `TransitionsProConnector` : transport `MANUAL_PORTAL`, **paramétré par région** (identifiants et accès distincts par ATpro régionale).
- Ne pas supposer un accès technique unique valable pour les 14 régions sans vérification individuelle.
