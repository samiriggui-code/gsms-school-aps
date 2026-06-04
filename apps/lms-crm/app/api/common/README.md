# Common API — transversal CRM



Endpoints mutualisés par **plusieurs sections** et le **header** (layout demo1).



## Topbar (header)



| Route | Méthodes | Rôle |

|-------|----------|------|

| `topbar/summary` | GET | Compteurs badge : `notificationUnread`, `chatUnread` |

| `notifications` | GET, PATCH | Liste (onglets `all` / `unread` / `archived`), `read_all`, `archive_all` |

| `notifications/[id]` | PATCH | Marquer une notification lue / archivée |
| `module-alerts` | GET | Alertes landing par module (`?module=gestion-academique.vie-scolaire`) |

| `chat/conversations` | GET, POST | Liste + création DIRECT / GROUP |

| `chat/conversations/[id]/messages` | GET, POST | Messages + envoi ; met à jour `lastReadAt` |



**Client :** `apps/lms-crm/lib/topbar-api.ts`  

**Hooks :** `hooks/use-topbar-summary.ts` (poll 30s)  

**UI :** `app/components/partials/topbar/notifications-sheet.tsx`, `chat-sheet.tsx`  

**Page liste :** `app/(protected)/account/notifications/page.tsx`



### Émetteurs notifications (`NotificationService` — `@repo/api-core`)



| Événement | Catégorie |

|-----------|-----------|

| Ticket créé | TICKET (admins) |

| Ticket assigné | TICKET (assigné) |

| Devis créé | FINANCE (admins) |

| Candidature créée / statut | ACADEMIC (candidat) |

| Membre ajouté à équipe RH | TEAM |



Seed démo : `packages/database/prisma/data/topbar-seed.js`

### Événements CRM (file + worker)

| Composant | Rôle |
|-----------|------|
| `CrmEventOutbox` (Prisma) | File d'événements `PENDING` → worker |
| `CrmEventService` (`@repo/api-core`) | `enqueue`, `processPending`, `listModuleAlertsForUser` |
| Worker `@repo/workers` | Cron chaque minute : `setupNotificationDispatcher` |
| Catalogue `CRM_EVENT_CATALOG` | Types : `catalog.offer.created`, `session.reminder`, etc. |

**Émetteur branché :** `POST …/vie-scolaire/formations` (ajout catalogue) → broadcast utilisateurs actifs (hors auteur).

**Landing :** carte « Alertes » Vie scolaire → `GET /api/common/module-alerts?module=gestion-academique.vie-scolaire`

Worker inclus dans `pnpm dev` racine ; seul : `pnpm dev:workers`.



## Autres



| Route | Rôle |

|-------|------|

| `files`, `files/[id]` | Upload / suppression S3 (`@repo/storage`) |

| `stats` | Proxy vers `/api/dashboard/stats` |

| `health` | Healthcheck |



## Auth



Toutes les routes ci-dessus exigent une session via `requireSessionUserId()` (`app/api/_shared/topbar-auth.ts`).



Référence : `docs/CAHIER-DE-ROUTE-APIS-LMS.md`


