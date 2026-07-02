import type { PrismaClient } from '@repo/database';
import { StatService } from '../services';
import { fetchPedagogyDailyAlerts } from './n8n-session-data';

function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

export async function fetchOpsWeeklyDigest(prisma: PrismaClient) {
  const statService = new StatService(prisma);
  const [vieScolaire, finance, general, pedagogy] = await Promise.all([
    statService.getVieScolaireStats(3),
    statService.getFinanceStats(3),
    statService.getGeneralDashboardStats(),
    fetchPedagogyDailyAlerts(prisma),
  ]);

  const activeSessions = await prisma.formationSession.count({
    where: {
      OR: [
        { endDate: { gte: new Date() } },
        { endDate: null, startDate: { gte: new Date(Date.now() - 90 * 86400000) } },
      ],
    },
  });

  const candidaturesOpen = await prisma.candidature.count({
    where: {
      archivedAt: null,
      status: { notIn: ['COMPLETED', 'ARCHIVED', 'REJECTED'] },
    },
  });

  const summary = [
    `Sessions actives : ${activeSessions}`,
    `Dossiers ouverts : ${candidaturesOpen}`,
    `Émargements non signés aujourd'hui : ${pedagogy.totalUnsigned}`,
    `Absences non justifiées aujourd'hui : ${pedagogy.totalUnjustifiedAbsences}`,
  ].join(' · ');

  return {
    generatedAt: new Date().toISOString(),
    summary,
    activeSessions,
    candidaturesOpen,
    pedagogyToday: pedagogy,
    vieScolaire,
    finance,
    general,
  };
}

export async function fetchFinanceMonthlyDigest(prisma: PrismaClient) {
  const statService = new StatService(prisma);
  const finance = await statService.getFinanceStats(12);
  const overdue = await fetchOverdueInvoices(prisma);

  const monthPayments = await prisma.financePayment.aggregate({
    where: {
      status: 'RECEIVED',
      paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
    _sum: { amount: true },
    _count: true,
  });

  const caMonth = decimalToNumber(monthPayments._sum.amount);
  const summary = [
    `CA encaissé ce mois : ${caMonth.toFixed(2)} EUR`,
    `Impayés : ${overdue.count}`,
    `Devis en attente : ${overdue.items.filter((i) => i.daysOverdue >= 15).length} (>15j)`,
  ].join(' · ');

  return {
    generatedAt: new Date().toISOString(),
    summary,
    caMonth,
    paymentCount: monthPayments._count,
    finance,
    overdue,
  };
}

export async function fetchOverdueInvoices(prisma: PrismaClient) {
  const devisList = await prisma.financeDevis.findMany({
    where: { status: { in: ['SENT', 'ACCEPTED'] } },
    take: 200,
    orderBy: { updatedAt: 'asc' },
    include: {
      payments: { where: { status: 'RECEIVED' }, select: { amount: true } },
      candidature: { select: { id: true, user: { select: { name: true, email: true } } } },
    },
  });

  const now = Date.now();
  const items = devisList
    .map((devis) => {
      const total = decimalToNumber(devis.totalTtc);
      const paid = devis.payments.reduce((s, p) => s + decimalToNumber(p.amount), 0);
      const amountDue = Math.max(0, total - paid);
      if (amountDue < 0.01) return null;
      const refDate = devis.validUntil ?? devis.updatedAt;
      const daysOverdue = Math.max(0, Math.floor((now - refDate.getTime()) / 86400000));
      return {
        devisId: devis.id,
        referenceCode: devis.referenceCode,
        title: devis.title,
        amountDue: Math.round(amountDue * 100) / 100,
        currency: devis.currency,
        daysOverdue,
        candidatureId: devis.candidatureId,
        candidateName:
          devis.candidature?.user.name ?? devis.candidature?.user.email ?? null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null && row.daysOverdue >= 1);

  return { count: items.length, items };
}

export async function fetchPedagogyEveningAlerts(prisma: PrismaClient, ref = new Date()) {
  const daily = await fetchPedagogyDailyAlerts(prisma, ref);
  const absences = daily.sessions.flatMap((s) =>
    s.absences.map((a) => ({
      ...a,
      sessionId: s.sessionId,
      sessionLabel: s.sessionLabel,
      dayDate: s.dayDate,
    })),
  );

  return {
    date: daily.date,
    totalUnjustifiedAbsences: daily.totalUnjustifiedAbsences,
    absences,
    sessions: daily.sessions.map((s) => ({
      sessionId: s.sessionId,
      sessionLabel: s.sessionLabel,
      unjustifiedAbsenceCount: s.unjustifiedAbsenceCount,
    })),
  };
}

export async function fetchRhComplianceDaily(prisma: PrismaClient) {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const [expiringDocs, missingDossiers, openTickets] = await Promise.all([
    prisma.complianceDossierItem.count({
      where: {
        status: { in: ['VALIDATED', 'RECEIVED'] },
        expiresAt: { gte: now, lte: in30 },
        dossier: {
          kind: {
            in: ['COLLABORATEUR_ONBOARDING', 'COLLABORATEUR_RH', 'FORMATEUR_HABILITATION'],
          },
        },
      },
    }),
    prisma.complianceDossier.count({
      where: {
        completenessPct: { lt: 100 },
        kind: {
          in: ['COLLABORATEUR_ONBOARDING', 'COLLABORATEUR_RH', 'FORMATEUR_HABILITATION'],
        },
      },
    }),
    prisma.supportTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] } },
    }),
  ]);

  const summary = [
    `Documents RH expirant sous 30j : ${expiringDocs}`,
    `Dossiers RH incomplets : ${missingDossiers}`,
    `Tickets support ouverts : ${openTickets}`,
  ].join(' · ');

  return {
    generatedAt: now.toISOString(),
    summary,
    expiringDocs,
    missingDossiers,
    openTickets,
  };
}

export async function fetchEquipmentAlertsDaily(prisma: PrismaClient) {
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 86400000);

  const [maintenanceDue, outOfService, inMaintenance] = await Promise.all([
    prisma.equipmentMaintenance.count({
      where: {
        status: { in: ['SCHEDULED', 'OVERDUE'] },
        OR: [{ scheduledDate: { lte: in14 } }, { scheduledDate: null }],
      },
    }),
    prisma.equipment.count({
      where: { status: 'OUT_OF_SERVICE' },
    }),
    prisma.equipment.count({
      where: { status: 'MAINTENANCE' },
    }),
  ]);

  const summary = [
    `Maintenances à planifier (14j) : ${maintenanceDue}`,
    `Hors service : ${outOfService}`,
    `En maintenance : ${inMaintenance}`,
  ].join(' · ');

  return {
    generatedAt: now.toISOString(),
    summary,
    maintenanceDue,
    outOfService,
    lowStock: inMaintenance,
  };
}

export async function fetchSupportBacklogDaily(prisma: PrismaClient) {
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 3 * 86400000);

  const [openCount, staleCount, highPriority] = await Promise.all([
    prisma.supportTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] } },
    }),
    prisma.supportTicket.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        updatedAt: { lt: staleCutoff },
      },
    }),
    prisma.supportTicket.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        priority: { in: ['HIGH', 'URGENT'] },
      },
    }),
  ]);

  const summary = [
    `Tickets ouverts : ${openCount}`,
    `Sans mise à jour >3j : ${staleCount}`,
    `Priorité haute/urgente : ${highPriority}`,
  ].join(' · ');

  return {
    generatedAt: now.toISOString(),
    summary,
    openCount,
    staleCount,
    highPriority,
  };
}

export async function fetchQualiopiChecklistDigest(prisma: PrismaClient) {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();
  const horizon30 = new Date(now.getTime() + 30 * 86400000);
  const quarterStart = new Date(year, (quarter - 1) * 3, 1);

  const [
    catalogActive,
    formationsWithHours,
    candidaturesOpen,
    incompleteDossiers,
    equipmentOk,
    activeRooms,
    trainersTotal,
    trainersCompliant,
    sessionsWithParticipants,
    formationsWithSatisfaction,
    improvementEvents,
    emargementsUnsigned,
  ] = await Promise.all([
    prisma.formationCatalogOffer.count({ where: { catalogStatus: 'ACTIVE' } }),
    prisma.formation.count({ where: { hoursMin: { not: null }, status: 'ACTIVE' } }),
    prisma.candidature.count({
      where: { archivedAt: null, status: { notIn: ['COMPLETED', 'ARCHIVED', 'REJECTED'] } },
    }),
    prisma.complianceDossier.count({ where: { completenessPct: { lt: 100 } } }),
    prisma.equipment.count({ where: { status: 'AVAILABLE' } }),
    prisma.formationVenueRoom.count({ where: { isActive: true } }),
    prisma.user.count({
      where: { isTrashed: false, role: { slug: 'formateur' } },
    }),
    prisma.user.count({
      where: {
        isTrashed: false,
        role: { slug: 'formateur' },
        carteProExpiry: { gte: now },
      },
    }),
    prisma.formationSession.count({
      where: { participants: { some: {} } },
    }),
    prisma.formation.count({
      where: { clientSatisfactionRate: { not: null }, status: 'ACTIVE' },
    }),
    prisma.complianceItemEvent.count({ where: { createdAt: { gte: quarterStart } } }),
    prisma.formationSessionEmargement.count({
      where: {
        status: 'PRESENT',
        markedAt: null,
        day: { dayDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
      },
    }),
  ]);

  type IndicatorStatus = 'ok' | 'review' | 'alert';
  const status = (ok: boolean, review: boolean): IndicatorStatus =>
    ok ? 'ok' : review ? 'review' : 'alert';

  const indicators = [
    {
      id: 1,
      label: 'Information du public',
      status: status(catalogActive >= 3, catalogActive > 0),
      detail: `${catalogActive} offre(s) catalogue active(s)`,
    },
    {
      id: 2,
      label: 'Objectifs et adaptation',
      status: status(formationsWithHours >= catalogActive * 0.8, formationsWithHours > 0),
      detail: `${formationsWithHours} formation(s) avec volume horaire renseigné`,
    },
    {
      id: 3,
      label: 'Accueil et accompagnement',
      status: status(incompleteDossiers <= candidaturesOpen * 0.2, incompleteDossiers < candidaturesOpen),
      detail: `${candidaturesOpen} dossier(s) ouvert(s), ${incompleteDossiers} incomplet(s)`,
    },
    {
      id: 4,
      label: 'Moyens pédagogiques',
      status: status(equipmentOk >= 5 && activeRooms >= 1, equipmentOk > 0),
      detail: `${equipmentOk} équipement(s) dispo · ${activeRooms} salle(s) active(s)`,
    },
    {
      id: 5,
      label: 'Qualification formateurs',
      status: status(
        trainersTotal > 0 && trainersCompliant >= trainersTotal * 0.9,
        trainersCompliant > 0,
      ),
      detail: `${trainersCompliant}/${trainersTotal} formateur(s) carte pro valide`,
    },
    {
      id: 6,
      label: 'Inscription et déroulement',
      status: status(sessionsWithParticipants > 0, sessionsWithParticipants > 0),
      detail: `${sessionsWithParticipants} session(s) avec participants inscrits`,
    },
    {
      id: 7,
      label: 'Recueil des appréciations',
      status: status(formationsWithSatisfaction >= 1, formationsWithSatisfaction > 0),
      detail: `${formationsWithSatisfaction} formation(s) avec taux satisfaction`,
    },
    {
      id: 8,
      label: 'Amélioration continue',
      status: status(improvementEvents >= 5, improvementEvents > 0),
      detail: `${improvementEvents} événement(s) conformité ce trimestre`,
    },
  ];

  const alerts = indicators.filter((i) => i.status === 'alert').length;
  const reviews = indicators.filter((i) => i.status === 'review').length;

  return {
    generatedAt: now.toISOString(),
    quarter,
    year,
    summary: `${indicators.length} indicateurs · ${alerts} alerte(s) · ${reviews} à revoir · ${emargementsUnsigned} émargement(s) non signé(s) aujourd'hui`,
    indicators,
    emargementsUnsigned,
    horizon30: horizon30.toISOString(),
  };
}

export type RegisterAutomationInput = {
  sessionId: string;
  participantId?: string | null;
  candidatureId?: string | null;
  circuitKey?: string;
  n8nExecutionId?: string | null;
  milestones?: unknown[];
  metadata?: Record<string, unknown>;
};

export async function registerSessionAutomationRun(
  prisma: PrismaClient,
  input: RegisterAutomationInput,
) {
  await prisma.sessionAutomationRun.updateMany({
    where: { sessionId: input.sessionId, status: 'RUNNING' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  return prisma.sessionAutomationRun.create({
    data: {
      sessionId: input.sessionId,
      participantId: input.participantId ?? null,
      candidatureId: input.candidatureId ?? null,
      circuitKey: input.circuitKey ?? 'default',
      n8nExecutionId: input.n8nExecutionId ?? null,
      milestones: (input.milestones ?? []) as never,
      metadata: (input.metadata ?? {}) as never,
      status: 'RUNNING',
    },
  });
}

export async function completeSessionAutomationRun(
  prisma: PrismaClient,
  runId: string,
) {
  return prisma.sessionAutomationRun.update({
    where: { id: runId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
}

export async function cancelSessionAutomationRuns(
  prisma: PrismaClient,
  sessionId: string,
) {
  return prisma.sessionAutomationRun.updateMany({
    where: { sessionId, status: 'RUNNING' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
}

export function isSecurityFormationSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase();
  return (
    s.includes('tfp') ||
    s.includes('aps') ||
    s.includes('sst') ||
    s.includes('cynophile') ||
    s.includes('securite')
  );
}
