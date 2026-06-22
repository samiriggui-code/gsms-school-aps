import type {
  CrmEventAudience,
  CrmEventSeverity,
  InAppNotificationCategory,
  Prisma,
  PrismaClient,
} from '@repo/database';
export type { CrmEventSeverity };
import { NotificationService } from './notifications';
import {
  defaultAudienceForEvent,
} from './notification-audience';

/** Clés de module / sous-module (widgets landing + filtre notifs). */
export const CRM_MODULE_KEYS = {
  VIE_SCOLAIRE: 'gestion-academique.vie-scolaire',
  GESTION_ACADEMIQUE: 'gestion-academique',
  EQUIPEMENTS: 'gestion-ressources.equipements',
  RH: 'gestion-ressources.rh',
  FINANCE: 'administration-facturation.finance',
  SUPPORT: 'support-qualite.support',
  PILOTAGE: 'pilotage-supervision.pilotage',
  GOUVERNANCE: 'securite-configuration.gouvernance-donnees',
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
    moduleKey: CRM_MODULE_KEYS.GOUVERNANCE,
    category: 'TEAM',
    severity: 'CRITICAL',
    labelFr: 'Échéance conformité',
  },
  'compliance.document.requested': {
    moduleKey: CRM_MODULE_KEYS.GOUVERNANCE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    labelFr: 'Demande de pièce',
  },
  'compliance.document.missing': {
    moduleKey: CRM_MODULE_KEYS.GOUVERNANCE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    labelFr: 'Pièces manquantes',
  },
  'compliance.dossier.complete': {
    moduleKey: CRM_MODULE_KEYS.GOUVERNANCE,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Dossier documentaire complet',
  },
  'compliance.document.expiring': {
    moduleKey: CRM_MODULE_KEYS.GOUVERNANCE,
    category: 'ACADEMIC',
    severity: 'WARNING',
    labelFr: 'Document expirant',
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
  'venue.room.deactivated': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'WARNING',
    labelFr: 'Salle désactivée',
  },
  'venue.room.reactivated': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Salle disponible',
  },
  'venue.room.reserved': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Salle occupée',
  },
  'venue.room.released': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Salle libérée',
  },
  'venue.room.reservation_updated': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Réservation salle modifiée',
  },
  'venue.room.booking_created': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Réservation ponctuelle salle',
  },
  'venue.room.booking_cancelled': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Réservation salle annulée',
  },
  'equipment.assigned': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Matériel réservé (session)',
  },
  'equipment.released': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Matériel libéré',
  },
  'equipment.batch_released': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Sessions terminées — matériel',
  },
  'equipment.maintenance.started': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'WARNING',
    labelFr: 'Départ maintenance',
  },
  'equipment.maintenance.completed': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Retour stock maintenance',
  },
  'equipment.maintenance.out_of_service': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'WARNING',
    labelFr: 'Équipement hors service',
  },
  'venue.room.session_ended': {
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    category: 'ACADEMIC',
    severity: 'INFO',
    labelFr: 'Session terminée — salle libre',
  },
  'pilotage.report.generated': {
    moduleKey: CRM_MODULE_KEYS.PILOTAGE,
    category: 'SYSTEM',
    severity: 'INFO',
    labelFr: 'Rapport pilotage généré',
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
  roleSlugs?: string[];
  permissionSlugs?: string[];
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
    const audienceDefaults = defaultAudienceForEvent(moduleKey, category);
    const audience = input.audience ?? audienceDefaults.audience;
    const roleSlugs = input.roleSlugs ?? audienceDefaults.roleSlugs ?? [];
    const permissionSlugs = input.permissionSlugs ?? audienceDefaults.permissionSlugs ?? [];

    if (input.dedupeKey) {
      const existing = await this.prisma.crmEventOutbox.findFirst({
        where: {
          eventType: input.eventType,
          status: { in: ['PENDING', 'PROCESSING', 'DONE'] },
          payload: { path: ['dedupeKey'], equals: input.dedupeKey },
        },
        select: { id: true },
      });
      if (existing) return { id: existing.id, created: false };
    }

    const row = await this.prisma.crmEventOutbox.create({
      data: {
        eventType: input.eventType,
        moduleKey,
        specialty: input.specialty ?? null,
        category,
        severity,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        audience,
        userIds: input.userIds ?? [],
        roleSlugs,
        permissionSlugs,
        payload: {
          ...(input.payload ?? {}),
          ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
        } as Prisma.InputJsonValue,
        createdById: input.createdById ?? null,
      },
    });
    return { id: row.id, created: true };
  }

  private async resolveAudience(
    audience: CrmEventAudience,
    userIds: string[],
    roleSlugs: string[],
    permissionSlugs: string[],
    excludeUserId?: string | null,
  ): Promise<string[]> {
    const exclude = excludeUserId ?? undefined;
    const baseWhere = { status: 'ACTIVE' as const, isTrashed: false };

    if (audience === 'USER_IDS') {
      return Array.from(new Set(userIds.filter(Boolean))).filter((id) => id !== exclude);
    }

    if (audience === 'ROLE_SLUGS' && roleSlugs.length > 0) {
      const users = await this.prisma.user.findMany({
        where: {
          ...baseWhere,
          role: { slug: { in: roleSlugs } },
        },
        select: { id: true },
      });
      return users.map((u) => u.id).filter((id) => id !== exclude);
    }

    if (audience === 'PERMISSION_SLUGS' && permissionSlugs.length > 0) {
      const users = await this.prisma.user.findMany({
        where: {
          ...baseWhere,
          role: {
            permissions: {
              some: {
                permission: { slug: { in: permissionSlugs } },
              },
            },
          },
        },
        select: { id: true },
      });
      const ids = users.map((u) => u.id).filter((id) => id !== exclude);

      const superadmins = await this.prisma.user.findMany({
        where: { ...baseWhere, role: { slug: 'superadmin' } },
        select: { id: true },
      });
      for (const row of superadmins) {
        if (row.id !== exclude && !ids.includes(row.id)) ids.push(row.id);
      }
      return ids;
    }

    if (audience === 'BROADCAST_ACTIVE_USERS') {
      const users = await this.prisma.user.findMany({
        where: baseWhere,
        select: { id: true },
      });
      return users.map((u) => u.id).filter((id) => id !== exclude);
    }

    return [];
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
          event.roleSlugs,
          event.permissionSlugs,
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
