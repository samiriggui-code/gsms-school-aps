# Transitions Pro — sources réglementaires

Financement du Projet de Transition Professionnelle (PTP, ex-CIF).

## Ce qui existe

- Dossier PTP **100 % dématérialisé depuis le 06/04/2020**, en **trois volets remplis séparément** par le salarié, l'organisme de formation et l'employeur, chacun depuis son espace personnel.
- L'OF y déclare les heures réalisées (saisie journalière d'assiduité, certification mensuelle) et y dépose le **certificat de réalisation**, qui a remplacé les attestations de présence depuis le **01/06/2020**.
  Source : https://www.transitionspro.fr/entreprises-et-organismes/nos-services-aux-organismes-de-formation/

## Structure régionale — nuance importante

Transitions Pro n'est **pas une entité unique** mais **14 associations régionales distinctes**, chacune avec son propre site et espace : transitionspro-idf.fr, -ara.fr, -occitanie.fr, -grandest.fr, -pdl.fr, -hdf.fr, -paca.fr, -cvl.fr, -reunion.fr, etc. Les tutoriels destinés aux OF sont publiés par région (ex. IDF, ARA consultés), ce qui suggère un socle applicatif commun avec des accès et variantes régionales.

**Aucune API publiée n'a été trouvée sur aucune des instances consultées.**

## Statut vérification (mise à jour 29/08/2026)

**Le process lui-même (MANUAL_PORTAL, pas d'API) est désormais vérifié**, confirmé via ATpro Île-de-France : « Votre espace est créé directement par Transitions Pro Île-de-France » (pas d'auto-inscription par l'OF) ; « L'organisme de formation déclare les heures et saisit les certificats de réalisation 100 % en ligne, depuis l'espace personnel » via Menu Mes Dossiers → Certificat de réalisation.
Source : https://www.transitionspro-idf.fr/faq/

**Reste non vérifié** : l'hypothèse "socle applicatif technique commun aux 14 ATpro" — aucune source ne nomme un outil national partagé, chaque région a son propre site. Le process (portail manuel, pas d'API) a été confirmé sur IDF seulement ; à vérifier individuellement si un jour une autre région montre un comportement différent.

## Impact architecture GSMS

- `TransitionsProConnector` : transport `MANUAL_PORTAL`, **paramétré par région** (identifiants et accès distincts par ATpro régionale).
- Ne pas supposer un accès technique unique valable pour les 14 régions sans vérification individuelle.
