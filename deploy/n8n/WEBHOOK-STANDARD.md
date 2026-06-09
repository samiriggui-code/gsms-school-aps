# Webhook standard GSMS

Groupe **séparé** du hub legacy (`/webhook/gsms-events`). Couvre le parcours landing → CRM tel que implémenté dans le monorepo.

## Configuration app (`.env` VPS)

```env
# Webhook standard — canal principal
WORKFLOWS_N8N_STANDARD_ENABLED=true
N8N_WEBHOOK_STANDARD_URL=https://n8n-k2pw.srv1722028.hstgr.cloud/webhook/standard/gsms
# ou base Hostinger :
# N8N_WEBHOOK_BASE=https://n8n-k2pw.srv1722028.hstgr.cloud
N8N_WEBHOOK_STANDARD_SECRET=

# Hub legacy (optionnel, 3 events historiques)
WORKFLOWS_N8N_ENABLED=false
N8N_WEBHOOK_URL=
```

## Envelope HTTP POST

```json
{
  "group": "standard",
  "event": "landing.preinscription.created",
  "emittedAt": "2026-06-08T12:00:00.000Z",
  "source": "gsms-lms",
  "app": "landing",
  "domain": "acquisition",
  "action": "preinscription",
  "payload": { }
}
```

Signature HMAC SHA-256 optionnelle : header `X-GSMS-Signature` (secret `N8N_WEBHOOK_STANDARD_SECRET` ou `N8N_WEBHOOK_SECRET`).

## Catalogue des événements

| Event | App | Déclencheur code |
|-------|-----|------------------|
| `landing.contact.submitted` | landing | `POST /api/contact` |
| `landing.quote.requested` | landing | `POST /api/quote-requests` |
| `landing.preinscription.created` | landing | `POST /api/preinscriptions` |
| `crm.candidature.created` | crm | RH POST candidature, convert lead |
| `crm.candidature.status_changed` | crm | PATCH candidature RH |
| `crm.candidature.session.enrolled` | crm | POST session participants |
| `crm.candidature.exam.recorded` | crm | PATCH examens participant |
| `crm.candidature.attestation.issued` | crm | POST certifications |
| `crm.candidature.parcours.completed` | crm | POST parcours/complete |
| `crm.candidature.parcours.archived` | crm | POST parcours/archive |
| `crm.lead.converted` | crm | POST convert-to-candidature |
| `crm.finance.devis.created` | crm | POST finance/devis |
| `crm.finance.devis.sent` | crm | POST devis/send |
| `crm.finance.devis.accepted` | crm | POST plaquette-accept (public) |
| `crm.finance.payment.recorded` | crm | POST finance/paiements |

## n8n

Workflow : `deploy/n8n/workflows/gsms-00-standard-webhooks.json`

1. Importer sur l’instance n8n
2. **Activer** le workflow
3. URL production : `/webhook/standard/gsms`

### Prérequis réseau (sondes & stats)

n8n (Hostinger) et la stack GSMS sont sur des réseaux Docker distincts. Les **domaines publics ne résolvent pas** depuis le VPS (`NXDOMAIN`).

```bash
docker network connect gsms n8n-k2pw-n8n-1
# ou : deploy/n8n/scripts/attach-n8n-gsms-network.sh
```

Workflows **Cron stats** et **Sonde apps** utilisent les URLs internes :
- CRM : `http://gsms-crm:3001`
- Landing : `http://gsms-landing:3000`
- Docs : `http://gsms-docs:3004`

Variables n8n optionnelles : `GSMS_CRM_INTERNAL_URL`, `GSMS_LANDING_INTERNAL_URL`, `GSMS_DOCS_INTERNAL_URL`.

Le nœud **Router standard** expose `flow` (ex. `landing_quote`, `crm_exam`).

### Actions n8n (email · notification · chat CRM)

Canal **unique** autorisé côté n8n : pas Slack, pas Telegram.

| Canal | Où | Rôle |
|-------|-----|------|
| **Notification cloche** | App (`WorkflowEngine` → outbox) | Automatique à chaque event — pas besoin de dupliquer dans n8n |
| **Email ops** | n8n → `POST /api/internal/n8n/dispatch` | Landing + finance critique |
| **Chat CRM** | même callback | Fil ops équipe (`GSMS_OPS_CHAT_CONVERSATION_ID`) |

Workflow `gsms-00` enchaîne : Router → **Préparer actions** → **Actions CRM** (HTTP interne) → Répondre 200.

Variables VPS (`.env` stack GSMS) :

```env
N8N_WEBHOOK_SECRET=…
GSMS_OPS_EMAIL=admin@example.com
GSMS_OPS_CHAT_CONVERSATION_ID=   # id conversation groupe CRM
N8N_SYSTEM_USER_ID=             # optionnel — expéditeur chat (sinon 1er user actif)
```

Variables n8n (instance Hostinger) :

```env
N8N_WEBHOOK_SECRET=…             # même secret que le VPS
GSMS_CRM_INTERNAL_URL=http://gsms-crm:3001
```

Règles par défaut dans **Préparer actions** :
- Landing (contact, devis, préinscription) → `email` + `chat`
- CRM finance (devis accepté, paiement) → `email` + `chat`
- Autres events CRM → `chat` uniquement

Pour activer la notification via n8n (doublon possible), ajoutez `notification` dans le tableau `channels` du nœud Code.

## CRM in-app

Chaque event alimente aussi `CrmEventOutbox` → notifications cloche (worker minute).
