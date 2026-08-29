> Statut : **ack Claude 2026-08-29** — option cron quotidien choisie ; hook jFin **non** implémenté.

Implémenté : `GET /api/internal/n8n/cron/satisfaction-hot-followup` + wf n8n `GSMS — Satisfaction à chaud`. Voir HANDOFF-CURSOR.

---

# Mini-draft — jFin circuit session → SatisfactionSurvey HOT (WF-27)

> Historique proposition (avant ack).

## Problème

Dans `deploy/gsms/n8n/circuits/default.json`, le jalon `jFin` (« Satisfaction à chaud ») déclenche seulement `crm.session.milestone.due` (notify ops / éventuel email générique). Il **ne crée pas** de `SatisfactionSurvey` timing HOT et n’appelle pas `sendSurveyInvite`.

## Recommandation

**Ne pas** créer les enquêtes depuis le Wait n8n (évite duplication / état hors CRM).

Même pattern que le froid :

1. Nouveau (ou extension) endpoint interne CRM, ex.  
   `GET /api/internal/n8n/cron/satisfaction-hot-followup`  
   ou plus fin : `POST /api/internal/n8n/sessions/:id/satisfaction-hot` appelé au jalon jFin.
2. Logique CRM (déjà existante) : `ensure` lignes `SatisfactionSurvey` HOT PENDING pour participants de la session clôturée / fin de session, puis `sendSurveyInvite`.
3. Côté circuit n8n : sur `milestone.key === 'jFin'`, **httpPost/Get** vers cet endpoint + garder le notify ops optionnel.

Alternative plus simple P0 : un cron quotidien « sessions dont `endDate` = hier et HOT encore manquantes » (comme le froid J+45), **sans** toucher au Wait du circuit `default`. Moins lié au jalon exact jFin, mais zéro risque de casser la boucle Wait.

## Hors scope

- Ne pas remplacer `sendSurveyInvite` par un email n8n générique.
- Ne pas merger HOT et COLD dans le même cron.

## Décision attendue

Ack Claude sur cron quotidien vs hook jFin dans Circuit session, puis implémentation Cursor.
