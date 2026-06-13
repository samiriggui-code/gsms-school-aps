import { prisma } from '@/lib/prisma';
import type {
  CrmDashboardAlert,
  CrmDashboardHighlight,
  CrmDashboardPayload,
} from '@/lib/crm/crm-dashboard-types';

export async function buildCrmDashboard(): Promise<CrmDashboardPayload> {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    candidaturesPending,
    sessionsUpcoming,
    traineesActive,
    collaboratorsActive,
    openTickets,
    leadsNew,
    nextSessionRow,
    recentLeads,
  ] = await Promise.all([
    prisma.candidature.count({
      where: {
        status: {
          in: ['SUBMITTED', 'MISSING_DOCUMENTS', 'VALIDATION_PENDING', 'PENDING_CNAPS'],
        },
      },
    }),
    prisma.formationSession.count({
      where: {
        startDate: { gte: now },
      },
    }),
    prisma.user.count({
      where: {
        isTrashed: false,
        role: { slug: { in: ['candidat', 'eleve'] } },
        status: 'ACTIVE',
      },
    }),
    prisma.user.count({
      where: {
        isTrashed: false,
        status: 'ACTIVE',
        role: { slug: { in: ['collaborateur', 'admin', 'superadmin', 'formateur'] } },
      },
    }),
    prisma.supportTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] } },
    }),
    prisma.lead.count({
      where: {
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.formationSession.findFirst({
      where: {
        startDate: { gte: now },
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        startDate: true,
        formation: { select: { name: true } },
      },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    }),
  ]);

  const alerts: CrmDashboardAlert[] = [];

  if (candidaturesPending > 0) {
    alerts.push({
      id: 'candidatures-pending',
      severity: candidaturesPending > 10 ? 'WARNING' : 'INFO',
      title: `${candidaturesPending} candidature(s) en attente`,
      body: 'Dossiers à traiter dans Vie scolaire.',
      href: '/gestion-academique/vie-scolaire/etudiants',
      createdAt: now.toISOString(),
    });
  }

  if (openTickets > 0) {
    alerts.push({
      id: 'tickets-open',
      severity: 'INFO',
      title: `${openTickets} ticket(s) support ouverts`,
      body: 'Consultez la file support.',
      href: '/support-qualite/support/tickets',
      createdAt: now.toISOString(),
    });
  }

  const sessionsSoon = await prisma.formationSession.count({
    where: {
      startDate: { gte: now, lte: inSevenDays },
    },
  });

  if (sessionsSoon > 0) {
    alerts.push({
      id: 'sessions-week',
      severity: 'INFO',
      title: `${sessionsSoon} session(s) cette semaine`,
      body: 'Planning à valider avec les formateurs.',
      href: '/gestion-academique/vie-scolaire/sessions',
      createdAt: now.toISOString(),
    });
  }

  const highlights: CrmDashboardHighlight[] = [
    {
      id: 'trainees',
      label: 'Stagiaires actifs',
      value: String(traineesActive),
      href: '/gestion-academique/vie-scolaire/etudiants',
    },
    {
      id: 'collaborators',
      label: 'Collaborateurs',
      value: String(collaboratorsActive),
      href: '/gestion-ressources/rh/collaborateurs',
    },
    {
      id: 'leads',
      label: 'Leads (30 j)',
      value: String(leadsNew),
      href: '/communication-contenu/marketing/formulaires-leads',
    },
  ];

  for (const lead of recentLeads) {
    highlights.push({
      id: `lead-${lead.id}`,
      label: 'Nouveau lead',
      value: `${lead.firstName} ${lead.lastName}`.trim(),
      href: '/communication-contenu/marketing/formulaires-leads',
    });
  }

  return {
    stats: {
      candidaturesPending,
      sessionsUpcoming,
      traineesActive,
      collaboratorsActive,
      openTickets,
      leadsNew,
    },
    alerts,
    highlights,
    nextSession: nextSessionRow
      ? {
          id: nextSessionRow.id,
          formationName: nextSessionRow.formation.name,
          startDate: nextSessionRow.startDate?.toISOString() ?? null,
          href: `/gestion-academique/vie-scolaire/sessions?highlight=${nextSessionRow.id}`,
        }
      : null,
  };
}
