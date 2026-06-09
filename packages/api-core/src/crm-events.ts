import type {
  CrmEventAudience,
  CrmEventSeverity,
  InAppNotificationCategory,
  Prisma,
  PrismaClient,
} from '@repo/database';
import { NotificationService } from './notifications';

/** Clés de module / sous-module (widgets landing + filtre notifs). */
export const CRM_MODULE_KEYS = {
  VIE_SCOLAIRE: 'gestion-academique.vie-scolaire',
  GESTION_ACADEMIQUE: 'gestion-academique',
  RH: 'gestion-ressources.rh',
  FINANCE: 'administration-facturation.finance',
  SUPPORT: 'support-qualite.support',
  PILOTAGE: 'pilotage-supervision.pilotage',
} as const;

export type CrmModuleKey = (typeof CRM_MODULE_KEYS)[keyof typeof CRM_MODULE_KEYS] | string;

/** Catalogue d'événements — étendre au fil des domaines (sessions, pointage, conformité…). */
export const CRM_EVENT_CATALOG: Record<
  string,
  {
    moduleKey: CrmModuleKey;
    category: InAppNotificationCategory;
    severity: CrmEventSeverity;
    labelFr: string;
  }
> = {
  'catalog.offer.created': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Nouvelle offre catalogue',
  },
  'catalog.offer.published': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Offre publiée au catalogue',
  },
  'session.created': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Session planifiée',
  },
  'session.started': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    labelFr: 'Cours démarré',
  },
  'session.reminder': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    labelFr: 'Rappel session',
  },
  'attendance.missing': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'CRITICAL',
    labelFr: 'Pointage manquant',
  },
  'candidature.status_changed': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Dossier candidat',
  },
  'compliance.deadline': {
    moduleKey: CRM_MODULE_KEYS.RH,
    category: 'TEAM',
    severity: 'CRITICAL',
    labelFr: 'Échéance conformité',
  },
  'team.broadcast': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'TEAM',
    severity: 'INFO',
    labelFr: 'Message équipe',
  },
  'finance.devis.created': {
    moduleKey: CRM_MODULE_KEYS.FINANCE,
    category: 'FINANCE',
    severity: 'INFO',
    labelFr: 'Nouveau devis',
  },
  'support.ticket.created': {
    moduleKey: CRM_MODULE_KEYS.SUPPORT,
    category: 'TICKET',
    severity: 'WARNING',
    labelFr: 'Ticket support',
  },
  'landing.contact.submitted': {
    moduleKey: CRM_MODULE_KEYS.SUPPORT,
    category: 'TICKET',
    severity: 'WARNING',
    labelFr: 'Contact landing',
  },
  'landing.preinscription.created': {
    moduleKey: CRM_MODULE_KEYS.VIE_SCOLAIRE,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Préinscription landing',
  },
};

export type EnqueueCrmEventInput = {
  eventType: keyof typeof CRM_EVENT_CATALOG | string;
  title: string;
  body: string;
  href?: string | null;
  moduleKey?: CrmModuleKey;
  specialty?: string | null;
  category?: InAppNotificationCategory;
  severity?: CrmEventSeverity;
  audience?: CrmEventAudience;
  userIds?: string[];
  payload?: Record<string, unknown>;
  createdById?: string | null;
  /** Évite de re-notifier (ex. même offre catalogue). */
  dedupeKey?: string;
};

export type ModuleAlertItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  severity: CrmEventSeverity;
  eventType: string | null;
  moduleKey: string | null;
  category: string;
  createdAt: string;
  unread: boolean;
  source: 'notification';
};

export class CrmEventService {
  constructor(private readonly prisma: PrismaClient) {}

  resolveCatalog(eventType: string) {
    return CRM_EVENT_CATALOG[eventType] ?? null;
  }

  async enqueue(input: EnqueueCrmEventInput) {
    const catalog = this.resolveCatalog(input.eventType);
    const moduleKey = input.moduleKey ?? catalog?.moduleKey ?? CRM_MODULE_KEYS.VIE_SCOLAIRE;
    const category = input.category ?? catalog?.category ?? 'SYSTEM';
    const severity = input.severity ?? catalog?.severity ?? 'INFO';

    if (input.dedupeKey) {
      const existing = await this.prisma.crmEventOutbox.findFirst({
        where: {
          eventType: input.eventType,
          status: { in: ['PENDING', 'PROCESSING', 'DONE'] },
          payload: { path: ['dedupeKey'], equals: input.dedupeKey },
        },
        select: { id: true },
      });
      if (existing) return existing;
    }

    return this.prisma.crmEventOutbox.create({
      data: {
        eventType: input.eventType,
        moduleKey,
        specialty: input.specialty ?? null,
        category,
        severity,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        audience: input.audience ?? 'BROADCAST_ACTIVE_USERS',
        userIds: input.userIds ?? [],
        payload: {
          ...(input.payload ?? {}),
          ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
        } as Prisma.InputJsonValue,
        createdById: input.createdById ?? null,
      },
    });
  }

  private async resolveAudience(
    audience: CrmEventAudience,
    userIds: string[],
    excludeUserId?: string | null,
  ): Promise<string[]> {
    if (audience === 'USER_IDS') {
      return Array.from(new Set(userIds.filter(Boolean))).filter((id) => id !== excludeUserId);
    }
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE', isTrashed: false },
      select: { id: true },
    });
    return users.map((u) => u.id).filter((id) => id !== excludeUserId);
  }

  /** Worker + rappel optionnel après enqueue HTTP. */
  async processPending(limit = 25) {
    const batch = await this.prisma.crmEventOutbox.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    const notifier = new NotificationService(this.prisma);
    let processed = 0;

    for (const event of batch) {
      await this.prisma.crmEventOutbox.update({
        where: { id: event.id },
        data: { status: 'PROCESSING' },
      });

      try {
        const targets = await this.resolveAudience(
          event.audience,
          event.userIds,
          event.createdById,
        );

        const payload =
          event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)
            ? (event.payload as Record<string, unknown>)
            : {};

        const dedupeKey =
          typeof payload.dedupeKey === 'string' ? payload.dedupeKey : `outbox:${event.id}`;

        await notifier.emitMany(targets, {
          category: event.category,
          title: event.title,
          body: event.body,
          href: event.href,
          dedupeKey,
          metadata: {
            moduleKey: event.moduleKey,
            specialty: event.specialty,
            eventType: event.eventType,
            severity: event.severity,
            outboxId: event.id,
            ...payload,
          },
        });

        await this.prisma.crmEventOutbox.update({
          where: { id: event.id },
          data: { status: 'DONE', processedAt: new Date(), error: null },
        });
        processed += 1;
      } catch (err) {
        await this.prisma.crmEventOutbox.update({
          where: { id: event.id },
          data: {
            status: 'FAILED',
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    return { processed, total: batch.length };
  }

  /** Widgets landing (ex. « Alertes critiques » Vie scolaire). */
  async listModuleAlertsForUser(
    userId: string,
    moduleKey: string,
    options?: { limit?: number; includeChildModules?: boolean },
  ): Promise<ModuleAlertItem[]> {
    const limit = Math.min(30, Math.max(1, options?.limit ?? 12));
    const rows = await this.prisma.inAppNotification.findMany({
      where: {
        userId,
        archivedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });

    const prefix = options?.includeChildModules !== false ? moduleKey : null;

    const filtered = rows.filter((row) => {
      const meta =
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {};
      const mk = typeof meta.moduleKey === 'string' ? meta.moduleKey : null;
      if (!mk) return false;
      if (prefix) return mk === moduleKey || mk.startsWith(`${moduleKey}.`);
      return mk === moduleKey;
    });

    return filtered.slice(0, limit).map((row) => {
      const meta =
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {};
      const severityRaw = meta.severity;
      const severity: CrmEventSeverity =
        severityRaw === 'CRITICAL' || severityRaw === 'WARNING' || severityRaw === 'INFO'
          ? severityRaw
          : 'INFO';

      return {
        id: row.id,
        title: row.title,
        body: row.body,
        href: row.href,
        severity,
        eventType: typeof meta.eventType === 'string' ? meta.eventType : null,
        moduleKey: typeof meta.moduleKey === 'string' ? meta.moduleKey : null,
        category: row.category,
        createdAt: row.createdAt.toISOString(),
        unread: !row.readAt,
        source: 'notification' as const,
      };
    });
  }
}
