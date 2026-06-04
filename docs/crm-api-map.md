# Carte API CRM — statut par domaine

Légende : **réel** · **proxy** · **stub** · **legacy** (catch-all)

| Domaine | Route principale | Statut | Notes |
|---------|------------------|--------|-------|
| **Absences RH** | `sections/gestion-ressources/rh/absences` | réel | S1 — `RhAbsence` + CRUD |
| **Postes RH** | `sections/gestion-ressources/rh/positions` | réel | S1 — `RhPosition` |
| **Équipes** | `rh/equipes`, `rh/org-units` | réel | — |
| **Collaborateurs** | `rh/collaborateurs` | réel | — |
| **Candidatures stats** | `rh/candidatures/stats` | réel | S3 — route dédiée |
| **Certifications stats** | `rh/certifications/stats` | réel | S5 — `StatService` |
| **Compliance alias** | `rh/compliance/*` | proxy | → `rh/conformite/*` |
| **Étudiants** | `rh/etudiants`, `rh/etudiants/stats`, `rh/etudiants/[id]` | réel | S3 — extrait du catch-all |
| **CandidatHub** | `rh/candidathub`, `stats`, `[id]` | réel | Rewrites PascalCase → lowercase |
| **Candidatures** | `rh/candidatures`, `[candidatureId]`, `stats` | réel | GET/POST/PATCH extraits |
| **Session participants** | `rh/formationsessions/[sessionId]/participants` | réel | GET/POST — catch-all forward |
| **Stats collaborateurs** | `rh/collaborateurs/stats` | réel | `profileType` → KPIs plats ; sinon `StatService` |
| **Hub KPIs sections** | `dashboard/stats?section={cms,marketing,seo,support,finance,securite,compagnie}` | réel | S4 — UI migrée (hors modules RH) |
| **Topbar** | `common/topbar/summary` | réel | — |
| **Notifications** | `common/notifications` | réel | tickets, devis, candidatures, équipes, assignation |
| **Chat** | `common/chat/conversations` GET+POST | réel | S2 |
| **Compte notifs** | `/account/notifications` | réel | S2 — page UI |
| **Auth** | `auth/[...nextauth]`, reset-password | réel | signup = legacy |
| **Landing** | `lms-landing/app/api/*` | réel | séparé du CRM |

## Pages hors menu

| Page | API |
|------|-----|
| `/mon-profil` | Session + fiches embarquées |
| Footer Questions | Mintlify (externe) |
| Footer Support | Lien → tickets |

## Catch-all `gestion-ressources/[...path]`

~150 lignes : forwards collaborateurs, formationsessions/participants, stubs legacy (`rh/documents` liste vide). Plus de logique métier candidatures / stats inline.
