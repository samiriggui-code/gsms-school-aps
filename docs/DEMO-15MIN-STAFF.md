# Démo staff 15 minutes — GSMS School CRM

Parcours scripté sur la **base locale ou VPS de dev** (pas d'environnement séparé).  
Données idempotentes : `pnpm demo:seed` (préfixe `DEMO —`).

## Prérequis (5 min avant la démo)

```bash
pnpm db:seed          # si base vide
pnpm demo:seed        # jeu DEMO — walkthrough
pnpm dev              # CRM :3001 + workers
```

Compte démo créé : `demo.walkthrough.candidat@ecole.local` / `DemoWalk2026!`

---

## Checklist (~15 min)

| # | Étape | Où | Ce qu'on montre |
|---|--------|-----|-----------------|
| 1 | **Accueil CRM** | `/` dashboard | KPIs, menu vie scolaire |
| 2 | **Candidature démo** | Vie scolaire → Étudiants / candidatures | Dossier `DEMO — Candidat Walkthrough`, session liée |
| 3 | **Session démo** | Vie scolaire → Sessions | `DEMO — Session TFP APS (walkthrough)`, participant inscrit |
| 4 | **Circuit n8n** | Fiche session → déclencher circuit **ou** `POST /api/internal/n8n/trigger/circuit` | Puis `GET /api/common/health` → `sessionAutomationRunsLast24h` > 0 |
| 5 | **AI brouillon pédagogique** | Session → panneau déroulé IA | POST draft → **202 PENDING** → worker → artifact PROPOSED (polling UI 3 s) |
| 6 | **Qualiopi** | Gouvernance → Couverture Qualiopi | % couverture + indicateur (ex. Q-I-1) |
| 7 | **EVE (bonus)** | Orbe bas-droite | « Combien de sessions demain ? » ou couverture Qualiopi |
| 8 | **BPF (bonus)** | Finance → BPF | Exercice N-1 : cadres Cerfa C/E/F + export PDF (après `pnpm demo:seed`) |
| 9 | **LMS staff (bonus)** | Vie scolaire → Devoirs / Discussions | Création devoir, modération discussion |

---

## Nettoyage (optionnel)

Les entités `DEMO —` peuvent rester en base (idempotent). Pour supprimer manuellement : user `demo.walkthrough.candidat@ecole.local`, session libellée `DEMO — Session TFP APS (walkthrough)`.

---

## Références API

- Santé : `GET /api/common/health`
- Candidatures : sections vie-scolaire existantes
- AI async : `POST …/sessions/[id]/ai/pedagogical-outline/draft` (202)
- EVE : `POST /api/eve/chat`
