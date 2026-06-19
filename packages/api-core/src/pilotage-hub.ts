import { CandidatureStatus, FinanceDevisStatus, type PrismaClient } from '@repo/database';
import { CRM_MODULE_KEYS } from './crm-events';
import { PilotageExportService, isPilotageExportDataset, type PilotageExportDataset } from './pilotage-export';
import {
  resolveReportPeriod,
  parseReportFileMetadata,
  getReportTemplate,
  normalizeCustomDateRange,
} from '@repo/report-engine';
import type { ReportGenerationSource } from './report-dedup';

export type PilotagePeriod = 'day' | 'week' | 'month' | 'year';

export type PilotageChartPoint = { label: string; value: number };
export type PilotageDistributionSlice = { name: string; value: number };

export type PilotageIndicateursPayload = {
  moduleId: string;
  period: PilotagePeriod;
  kpis: { key: string; label: string; value: string | number; subtitle: string }[];
  charts: {
    distributionTitle: string;
    evolutionTitle: string;
    evolutionSeriesName: string;
    distribution: PilotageDistributionSlice[];
    distributionTotal: number;
    evolution: PilotageChartPoint[];
    secondaryDistribution?: PilotageDistributionSlice[];
    secondaryDistributionTitle?: string;
  };
  sections: { title: string; description: string; href: string }[];
};

export type PilotageRisqueRow = {
  id: string;
  risque: string;
  gravite: 'Élevée' | 'Moyenne' | 'Faible';
  exposition: number;
  mesure: string;
  moduleKey: string;
  href: string;
  recommendation: string;
};

export type PilotageRisquesPayload = {
  moduleId: string;
  kpis: { key: string; label: string; value: string | number; subtitle: string }[];
  rows: PilotageRisqueRow[];
  charts: {
    distributionTitle: string;
    evolutionTitle: string;
    evolutionSeriesName: string;
    distribution: PilotageDistributionSlice[];
    distributionTotal: number;
    evolution: PilotageChartPoint[];
  };
};

export type PilotageRapportTemplate = {
  id: string;
  label: string;
  moduleKey: string;
  format: 'CSV' | 'PDF' | 'Excel';
  status: 'available' | 'scheduled';
  description: string;
  exportDataset: string | null;
  href: string | null;
};

/** Référence courte affichée en datatable (ex. RPT-A1B2C3D4). */
export function pilotageReportReferenceCode(id: string): string {
  const compact = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `RPT-${compact}`;
}

export type PilotageReportActor = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: string | null;
};

export type PilotageRapportRow = {
  id: string;
  referenceCode: string;
  templateId: string;
  label: string;
  moduleKey: string;
  format: 'CSV' | 'PDF' | 'Excel';
  status: 'generated' | 'pending' | 'running' | 'failed';
  description: string;
  generatedAt: string;
  period: PilotagePeriod;
  periodLabel: string;
  generationSource?: ReportGenerationSource;
  fileName: string | null;
  fileSize: number | null;
  createdByName: string | null;
  createdBy: PilotageReportActor | null;
  editedBy: PilotageReportActor | null;
  editedAt: string | null;
  htmlPreviewUrl: string | null;
};

export type PilotageRapportsPayload = {
  moduleId: string;
  period: PilotagePeriod | 'custom';
  periodLabel: string;
  kpis: { key: string; label: string; value: string | number; subtitle: string }[];
  rows: PilotageRapportRow[];
  templates: PilotageRapportTemplate[];
};

export const PILOTAGE_REPORT_MODULE = 'pilotage-supervision';
export const PILOTAGE_REPORT_ENTITY = 'pilotage-report';

export type PilotageReportAssetMeta = {
  templateId: string;
  label: string;
  moduleKey: string;
  format: 'CSV' | 'PDF' | 'Excel';
  period: PilotagePeriod;
  periodLabel: string;
  description: string;
  jobId?: string;
  editedByUserId?: string;
  editedAt?: string;
  generationSource?: ReportGenerationSource;
};

function toReportActor(user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatar?: string | null;
  status?: string | null;
} | null | undefined): PilotageReportActor | null {
  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return {
    id: user.id,
    name: name || user.email,
    email: user.email,
    avatar: user.avatar ?? null,
    status: user.status ?? null,
  };
}

export type PilotageLandingSparkline = {
  key: string;
  title: string;
  period: string;
  value: string | number;
  subtitle: string;
  color: string;
  href: string;
  sparkline: { value: number }[];
  pilotageLinks?: PilotageModuleHubLink[];
};

export type PilotageLandingVarianceCard = {
  key: string;
  title: string;
  metric: string;
  baseValue: string;
  baseLabel: string;
  targetValue: string;
  targetLabel: string;
  change: string;
  isPositive: boolean;
  color: string;
  data: { value: number }[];
};

export type PilotageLandingPayload = {
  kpis: { key: string; label: string; value: string | number; subtitle: string }[];
  sparklines: PilotageLandingSparkline[];
  signals: {
    title: string;
    distribution: PilotageDistributionSlice[];
    total: number;
  };
  flux: {
    title: string;
    seriesName: string;
    byPeriod: Record<'5D' | '2W' | '1M' | '6M' | '1Y', { period: string; value: number }[]>;
    totalLabel: string;
  };
  evolution: {
    title: string;
    headline: { value: string; delta: string; deltaPositive: boolean; caption: string };
    series: { key: string; name: string; color: string }[];
    points: { label: string; candidatures: number; sessions: number; alertes: number }[];
  };
  activity: {
    title: string;
    seriesName: string;
    byPeriod: Record<PilotagePeriod, { period: string; value: number }[]>;
    stats: { id: string; label: string; value: string; change: string; changeType: 'positive' | 'negative' }[];
  };
  variance: PilotageLandingVarianceCard[];
  modules: PilotageModuleHub[];
};

export type PilotageModuleHubLink = {
  label: string;
  href: string;
  variant?: 'landing' | 'pilotage';
};

export type PilotageModuleHub = {
  key: string;
  title: string;
  description: string;
  workflow: string;
  status: 'ok' | 'warning' | 'critical';
  landingHref: string;
  indicators: { label: string; value: string | number; subtitle: string }[];
  links: PilotageModuleHubLink[];
};

export function pilotagePeriodRange(period: PilotagePeriod): { start: Date; end: Date; label: string } {
  const end = new Date();
  const start = new Date(end);
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      return { start, end, label: "Aujourd'hui" };
    case 'week':
      start.setDate(start.getDate() - 7);
      return { start, end, label: '7 derniers jours' };
    case 'month':
      start.setMonth(start.getMonth() - 1);
      return { start, end, label: '30 derniers jours' };
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      return { start, end, label: '12 derniers mois' };
    default:
      start.setMonth(start.getMonth() - 1);
      return { start, end, label: '30 derniers jours' };
  }
}

function monthBuckets(count: number): { key: string; label: string; start: Date }[] {
  const buckets: { key: string; label: string; start: Date }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
      start: d,
    });
  }
  return buckets;
}

export const GESTION_RESSOURCES_REPORT_TEMPLATES: PilotageRapportTemplate[] = [
  {
    id: 'gr-rh-conformite',
    label: 'État conformité RH',
    moduleKey: CRM_MODULE_KEYS.RH,
    format: 'CSV',
    status: 'available',
    description: 'Cartes pro, titres de séjour et certifications à échéance',
    exportDataset: 'audit',
    href: '/gestion-ressources/rh/conformite',
  },
  {
    id: 'gr-equipements-inventaire',
    label: 'Inventaire équipements',
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    format: 'CSV',
    status: 'available',
    description: 'Statuts parc, maintenance et affectations',
    exportDataset: 'audit',
    href: '/gestion-ressources/equipements/inventaire',
  },
  {
    id: 'gr-salles-planning',
    label: 'Planning salles',
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    format: 'PDF',
    status: 'scheduled',
    description: 'Occupation et réservations sur la période',
    exportDataset: null,
    href: '/gestion-ressources/equipements/salles',
  },
  {
    id: 'gr-absences',
    label: 'Synthèse absences',
    moduleKey: CRM_MODULE_KEYS.RH,
    format: 'Excel',
    status: 'available',
    description: 'Absences actives et historique récent',
    exportDataset: null,
    href: '/gestion-ressources/rh/absences',
  },
  {
    id: 'gr-compagnie-docs',
    label: 'Documents compagnie',
    moduleKey: 'gestion-ressources.compagnie',
    format: 'PDF',
    status: 'available',
    description: 'Dossier administratif et pièces légales',
    exportDataset: null,
    href: '/gestion-ressources/compagnie',
  },
];

function parseReportMeta(raw: unknown): PilotageReportAssetMeta | null {
  const parsed = parseReportFileMetadata(raw);
  if (!parsed) return null;
  return {
    templateId: parsed.templateId,
    label: parsed.label,
    moduleKey: parsed.moduleKey,
    format: parsed.format === 'EXCEL' ? 'Excel' : parsed.format,
    period: (['day', 'week', 'month', 'year'].includes(parsed.period)
      ? parsed.period
      : 'month') as PilotagePeriod,
    periodLabel: parsed.periodLabel,
    description: parsed.description,
    jobId: parsed.jobId,
    editedByUserId: parsed.editedByUserId,
    editedAt: parsed.editedAt,
    generationSource: parseGenerationSource(raw),
  };
}

function parseGenerationSource(raw: unknown): ReportGenerationSource | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const m = raw as Record<string, unknown>;
  const nested =
    m.parameters && typeof m.parameters === 'object' && !Array.isArray(m.parameters)
      ? (m.parameters as Record<string, unknown>).generationSource
      : undefined;
  const direct = m.generationSource;
  const source = nested ?? direct;
  if (source === 'manual' || source === 'schedule' || source === 'run_now') return source;
  return undefined;
}

function parseJobGenerationSource(parameters: unknown): ReportGenerationSource | undefined {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return undefined;
  const source = (parameters as Record<string, unknown>).generationSource;
  if (source === 'manual' || source === 'schedule' || source === 'run_now') return source;
  return undefined;
}

function resolveListRange(
  period: PilotagePeriod | 'custom',
  customRange?: { start: Date; end: Date },
) {
  if (customRange) {
    const normalized = normalizeCustomDateRange(customRange);
    return resolveReportPeriod('custom', normalized);
  }
  return { ...pilotagePeriodRange(period as PilotagePeriod), period };
}

export class PilotageHubService {
  constructor(private readonly prisma: PrismaClient) {}

  async getIndicateurs(moduleId: string, period: PilotagePeriod): Promise<PilotageIndicateursPayload | null> {
    if (moduleId !== 'all' && moduleId !== 'gestion-ressources') return null;
    return this.gestionRessourcesIndicateurs(period);
  }

  async getRisques(moduleId: string): Promise<PilotageRisquesPayload | null> {
    if (moduleId !== 'all' && moduleId !== 'gestion-ressources') return null;
    return this.gestionRessourcesRisques();
  }

  async getRapports(
    moduleId: string,
    period: PilotagePeriod | 'custom',
    customRange?: { start: Date; end: Date },
  ): Promise<PilotageRapportsPayload | null> {
    if (moduleId !== 'all' && moduleId !== 'gestion-ressources') return null;
    return this.gestionRessourcesRapports(period, customRange);
  }

  /** Landing pilotage — agrégation transversale tous modules CRM. */
  async getLanding(): Promise<PilotageLandingPayload> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const horizon14 = new Date(now.getTime() + 14 * 86400000);
    const horizon30 = new Date(now);
    horizon30.setDate(horizon30.getDate() + 30);

    const [
      pendingCandidatures,
      expiredDevis,
      brokenEquip,
      upcomingSessions,
      complianceAlerts,
      collaborators,
      unreadAlerts,
      criticalAlerts,
      sessionsTotal,
      participants,
      passedExams,
      risksPayload,
      openTickets,
      urgentTickets,
      leadsCount,
      formationsActive,
      totalDevis,
      totalUsers,
    ] = await Promise.all([
      this.prisma.candidature.count({
        where: { status: { in: [CandidatureStatus.SUBMITTED, CandidatureStatus.VALIDATION_PENDING] } },
      }),
      this.prisma.financeDevis.count({ where: { status: FinanceDevisStatus.EXPIRED } }),
      this.prisma.equipment.count({ where: { status: 'OUT_OF_SERVICE' } }),
      this.prisma.formationSession.count({
        where: { startDate: { gte: now, lte: horizon14 } },
      }),
      this.prisma.user.count({
        where: {
          isTrashed: false,
          OR: [{ carteProExpiry: { lte: horizon30 } }, { residencePermitExpiry: { lte: horizon30 } }],
        },
      }),
      this.prisma.user.count({ where: { isTrashed: false, status: 'ACTIVE' } }),
      this.prisma.inAppNotification.count({ where: { readAt: null, archivedAt: null } }),
      this.prisma.inAppNotification.count({
        where: {
          readAt: null,
          archivedAt: null,
          metadata: { path: ['severity'], equals: 'CRITICAL' },
        },
      }),
      this.prisma.formationSession.count(),
      this.prisma.formationSessionParticipant.count(),
      this.prisma.formationSessionParticipant.count({ where: { examOutcome: 'PASSED' } }),
      this.gestionRessourcesRisques(),
      this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] } } }),
      this.prisma.supportTicket.count({
        where: {
          priority: { in: ['HIGH', 'URGENT'] },
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      this.prisma.lead.count(),
      this.prisma.formation.count({ where: { status: 'ACTIVE' } }),
      this.prisma.financeDevis.count(),
      this.prisma.user.count({ where: { isTrashed: false } }),
    ]);

    const tauxReussite = participants ? Math.round((passedExams / participants) * 100) : 0;
    const conformiteRate =
      collaborators > 0 ? Math.max(0, Math.round(((collaborators - complianceAlerts) / collaborators) * 100)) : 100;
    const risksHigh = risksPayload.rows.filter((r) => r.gravite === 'Élevée').length;

    const buckets12 = monthBuckets(12);
    const [candidatureRows, sessionRows, notifRows] = await Promise.all([
      this.prisma.candidature.findMany({
        where: { createdAt: { gte: buckets12[0].start } },
        select: { createdAt: true },
      }),
      this.prisma.formationSession.findMany({
        where: { startDate: { gte: buckets12[0].start } },
        select: { startDate: true },
      }),
      this.prisma.inAppNotification.findMany({
        where: { createdAt: { gte: buckets12[0].start } },
        select: { createdAt: true },
      }),
    ]);

    const candMap = new Map(buckets12.map((b) => [b.key, 0]));
    const sessMap = new Map(buckets12.map((b) => [b.key, 0]));
    const alertMap = new Map(buckets12.map((b) => [b.key, 0]));
    for (const row of candidatureRows) {
      const key = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (candMap.has(key)) candMap.set(key, (candMap.get(key) ?? 0) + 1);
    }
    for (const row of sessionRows) {
      if (!row.startDate) continue;
      const key = `${row.startDate.getFullYear()}-${String(row.startDate.getMonth() + 1).padStart(2, '0')}`;
      if (sessMap.has(key)) sessMap.set(key, (sessMap.get(key) ?? 0) + 1);
    }
    for (const row of notifRows) {
      const key = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (alertMap.has(key)) alertMap.set(key, (alertMap.get(key) ?? 0) + 1);
    }

    const evolutionPoints = buckets12.map((b) => ({
      label: b.label,
      candidatures: candMap.get(b.key) ?? 0,
      sessions: sessMap.get(b.key) ?? 0,
      alertes: alertMap.get(b.key) ?? 0,
    }));

    const lastCand = evolutionPoints.at(-1)?.candidatures ?? 0;
    const prevCand = evolutionPoints.at(-2)?.candidatures ?? 0;
    const candDelta = lastCand - prevCand;

    const sparkCand = this.bucketDailyCounts(
      15,
      candidatureRows.filter((r) => r.createdAt >= new Date(now.getTime() - 15 * 86400000)),
    );
    const devisRows = await this.prisma.financeDevis.findMany({
      where: {
        status: FinanceDevisStatus.EXPIRED,
        updatedAt: { gte: new Date(now.getTime() - 15 * 86400000) },
      },
      select: { updatedAt: true },
    });
    const sparkDevis = this.bucketDailyCounts(15, devisRows.map((r) => ({ createdAt: r.updatedAt })));
    const grNotifRecent = await this.prisma.inAppNotification.findMany({
      where: {
        createdAt: { gte: new Date(now.getTime() - 15 * 86400000) },
        metadata: { path: ['moduleKey'], string_starts_with: 'gestion-ressources' },
      },
      select: { createdAt: true },
    });
    const sparkEquip = this.bucketDailyCounts(15, grNotifRecent);
    const since15 = new Date(now.getTime() - 15 * 86400000);
    const [leadRows15, ticketRows15, userRows15] = await Promise.all([
      this.prisma.lead.findMany({ where: { createdAt: { gte: since15 } }, select: { createdAt: true } }),
      this.prisma.supportTicket.findMany({ where: { createdAt: { gte: since15 } }, select: { createdAt: true } }),
      this.prisma.user.findMany({ where: { createdAt: { gte: since15 }, isTrashed: false }, select: { createdAt: true } }),
    ]);
    const sparkLeads = this.bucketDailyCounts(15, leadRows15);
    const sparkTickets = this.bucketDailyCounts(15, ticketRows15);
    const sparkSecurite = this.bucketDailyCounts(15, userRows15);

    const flux5D = this.bucketDailyCounts(7, notifRows.slice(-200));
    const flux2W = await this.weeklyFlux(8);
    const flux1M = await this.weeklyFlux(12);
    const flux6M = buckets12.map((b) => ({
      period: b.label,
      value: alertMap.get(b.key) ?? 0,
    }));
    const flux1Y = this.quarterlyFlux(notifRows);

    const activityDay = await this.hourlyFluxToday();
    const activityWeek = await this.weeklyFlux(7);
    const activityMonth = await this.weeklyFlux(4);
    const activityYear = this.quarterlyFlux(notifRows);

    const rhRows = await this.prisma.user.findMany({
      where: {
        isTrashed: false,
        OR: [{ carteProExpiry: { not: null } }, { residencePermitExpiry: { not: null } }],
      },
      select: { carteProExpiry: true, residencePermitExpiry: true },
    });
    const rhVariance = this.bucketDailyCompliance(30, rhRows, now);
    const devis30Rows = await this.prisma.financeDevis.findMany({
      where: {
        status: FinanceDevisStatus.EXPIRED,
        updatedAt: { gte: new Date(now.getTime() - 30 * 86400000) },
      },
      select: { updatedAt: true },
    });
    const finVariance = this.bucketDailyCounts(
      30,
      devis30Rows.map((r) => ({ createdAt: r.updatedAt })),
    );
    const candPendingRows = await this.prisma.candidature.findMany({
      where: {
        status: { in: [CandidatureStatus.SUBMITTED, CandidatureStatus.VALIDATION_PENDING] },
        updatedAt: { gte: new Date(now.getTime() - 30 * 86400000) },
      },
      select: { updatedAt: true },
    });
    const vsVariance = this.bucketDailyCounts(
      30,
      candPendingRows.map((r) => ({ createdAt: r.updatedAt })),
    );

    const signalTotal =
      pendingCandidatures + expiredDevis + brokenEquip + upcomingSessions + complianceAlerts;

    const alertsToday = await this.prisma.inAppNotification.count({
      where: { createdAt: { gte: todayStart } },
    });
    const alertsWeek = await this.prisma.inAppNotification.count({
      where: { createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
    });

    return {
      kpis: [
        { key: 'alerts', label: 'Alertes non lues', value: unreadAlerts, subtitle: `${criticalAlerts} critique(s)` },
        { key: 'candidatures', label: 'Candidatures', value: pendingCandidatures, subtitle: 'En instruction' },
        { key: 'sessions', label: 'Sessions 14 j', value: upcomingSessions, subtitle: `${sessionsTotal} planifiées` },
        { key: 'risks', label: 'Risques élevés', value: risksHigh, subtitle: 'Gestion ressources' },
        { key: 'conformite', label: 'Conformité RH', value: `${conformiteRate} %`, subtitle: `${complianceAlerts} échéance(s)` },
      ],
      sparklines: [
        {
          key: 'gestion-ressources',
          title: 'Gestion ressources',
          period: '15 derniers jours',
          value: brokenEquip,
          subtitle: `${complianceAlerts} échéance(s) RH · ${brokenEquip} matériel HS`,
          color: 'var(--color-violet-500)',
          href: '/gestion-ressources',
          sparkline: sparkEquip,
          pilotageLinks: [
            { label: 'Indicateurs', href: '/pilotage-supervision/pilotage/indicateurs', variant: 'pilotage' },
            { label: 'Risques', href: '/pilotage-supervision/pilotage/risques', variant: 'pilotage' },
          ],
        },
        {
          key: 'gestion-academique',
          title: 'Gestion académique',
          period: '15 derniers jours',
          value: pendingCandidatures,
          subtitle: `${sessionsTotal} sessions · ${tauxReussite} % réussite`,
          color: 'var(--color-blue-500)',
          href: '/gestion-academique',
          sparkline: sparkCand,
          pilotageLinks: [
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
            { label: 'Indicateurs', href: '/pilotage-supervision/pilotage/indicateurs', variant: 'pilotage' },
          ],
        },
        {
          key: 'administration-facturation',
          title: 'Administration & facturation',
          period: '15 derniers jours',
          value: expiredDevis,
          subtitle: `${totalDevis} devis émis · relances à faire`,
          color: 'var(--color-amber-500)',
          href: '/administration-facturation',
          sparkline: sparkDevis,
          pilotageLinks: [
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
            { label: 'Rapports', href: '/pilotage-supervision/pilotage/rapports', variant: 'pilotage' },
          ],
        },
        {
          key: 'communication-contenu',
          title: 'Communication & contenu',
          period: '15 derniers jours',
          value: leadsCount,
          subtitle: `${formationsActive} formations actives · leads`,
          color: 'var(--color-emerald-500)',
          href: '/communication-contenu',
          sparkline: sparkLeads,
          pilotageLinks: [
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
          ],
        },
        {
          key: 'support-qualite',
          title: 'Support & qualité',
          period: '15 derniers jours',
          value: openTickets,
          subtitle: `${urgentTickets} urgent(s) · tickets ouverts`,
          color: 'var(--color-rose-500)',
          href: '/support-qualite',
          sparkline: sparkTickets,
          pilotageLinks: [
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
          ],
        },
        {
          key: 'securite-configuration',
          title: 'Sécurité & configuration',
          period: '15 derniers jours',
          value: totalUsers,
          subtitle: `${collaborators} actifs · ${criticalAlerts} alerte(s) critique(s)`,
          color: 'var(--color-slate-500)',
          href: '/securite-configuration',
          sparkline: sparkSecurite,
          pilotageLinks: [
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
          ],
        },
      ],
      signals: {
        title: 'Signaux opérationnels par module',
        distribution: [
          { name: 'Vie scolaire', value: pendingCandidatures },
          { name: 'Finance', value: expiredDevis },
          { name: 'Équipements', value: brokenEquip },
          { name: 'Planning', value: upcomingSessions },
          { name: 'RH', value: complianceAlerts },
        ],
        total: signalTotal,
      },
      flux: {
        title: 'Flux événements consolidés',
        seriesName: 'Événements',
        byPeriod: {
          '5D': flux5D.map((p, i) => ({
            period: new Date(now.getTime() - (6 - i) * 86400000).toLocaleString('fr-FR', { weekday: 'short' }),
            value: p.value,
          })),
          '2W': flux2W,
          '1M': flux1M,
          '6M': flux6M,
          '1Y': flux1Y,
        },
        totalLabel: 'événements',
      },
      evolution: {
        title: 'Évolution transversale (12 mois)',
        headline: {
          value: String(lastCand),
          delta: `${candDelta >= 0 ? '+' : ''}${candDelta}`,
          deltaPositive: candDelta >= 0,
          caption: 'Candidatures ce mois',
        },
        series: [
          { key: 'candidatures', name: 'Candidatures', color: 'var(--chart-1)' },
          { key: 'sessions', name: 'Sessions', color: 'var(--chart-2)' },
          { key: 'alertes', name: 'Alertes', color: 'var(--chart-3)' },
        ],
        points: evolutionPoints,
      },
      activity: {
        title: 'Activité consolidée',
        seriesName: 'Événements',
        byPeriod: {
          day: activityDay,
          week: activityWeek.map((p) => ({ period: p.period, value: p.value })),
          month: activityMonth.map((p) => ({ period: p.period, value: p.value })),
          year: activityYear,
        },
        stats: [
          {
            id: 'today',
            label: "Aujourd'hui",
            value: String(alertsToday),
            change: `${alertsWeek} sur 7 j`,
            changeType: alertsToday > 0 ? 'positive' : 'negative',
          },
          {
            id: 'success',
            label: 'Réussite examens',
            value: `${tauxReussite} %`,
            change: `${participants} participants`,
            changeType: tauxReussite >= 85 ? 'positive' : 'negative',
          },
          {
            id: 'risks',
            label: 'Exposition risques',
            value: String(risksPayload.rows.reduce((s, r) => s + r.exposition, 0)),
            change: `${risksHigh} élevé(s)`,
            changeType: risksHigh > 0 ? 'negative' : 'positive',
          },
        ],
      },
      variance: [
        {
          key: 'rh',
          title: 'Conformité RH',
          metric: 'Échéances documents & cartes pro',
          baseValue: `${conformiteRate} %`,
          baseLabel: 'Conformité',
          targetValue: String(complianceAlerts),
          targetLabel: 'Échéances',
          change: complianceAlerts > 0 ? 'À traiter' : 'Stable',
          isPositive: complianceAlerts === 0,
          color: 'var(--color-emerald-500)',
          data: rhVariance,
        },
        {
          key: 'finance',
          title: 'Pipeline finance',
          metric: 'Devis expirés — relance commerciale',
          baseValue: String(expiredDevis),
          baseLabel: 'Expirés',
          targetValue: `${pendingCandidatures}`,
          targetLabel: 'Leads actifs',
          change: expiredDevis > 0 ? 'Relancer' : 'Sain',
          isPositive: expiredDevis === 0,
          color: 'var(--color-amber-500)',
          data: finVariance,
        },
        {
          key: 'vie-scolaire',
          title: 'Charge vie scolaire',
          metric: 'Candidatures en instruction',
          baseValue: String(pendingCandidatures),
          baseLabel: 'En cours',
          targetValue: String(upcomingSessions),
          targetLabel: 'Sessions 14 j',
          change: pendingCandidatures > 5 ? 'Élevée' : 'Modérée',
          isPositive: pendingCandidatures <= 5,
          color: 'var(--color-blue-500)',
          data: vsVariance,
        },
      ],
      modules: [
        {
          key: 'gestion-ressources',
          title: 'Gestion ressources',
          description: 'RH, conformité, parc matériel et salles de formation.',
          workflow: 'Collaborateurs → Conformité CNAPS → Inventaire → Salles',
          status:
            complianceAlerts > 2 || brokenEquip > 2
              ? 'critical'
              : complianceAlerts > 0 || brokenEquip > 0
                ? 'warning'
                : 'ok',
          landingHref: '/gestion-ressources',
          indicators: [
            { label: 'Collaborateurs', value: collaborators, subtitle: 'Actifs' },
            { label: 'Conformité', value: `${conformiteRate} %`, subtitle: `${complianceAlerts} échéance(s)` },
            { label: 'Matériel HS', value: brokenEquip, subtitle: 'Inventaire' },
          ],
          links: [
            { label: 'Landing module', href: '/gestion-ressources', variant: 'landing' },
            { label: 'Indicateurs', href: '/pilotage-supervision/pilotage/indicateurs', variant: 'pilotage' },
            { label: 'Risques', href: '/pilotage-supervision/pilotage/risques', variant: 'pilotage' },
            { label: 'Rapports', href: '/pilotage-supervision/pilotage/rapports', variant: 'pilotage' },
          ],
        },
        {
          key: 'gestion-academique',
          title: 'Gestion académique',
          description: 'Formations, sessions, candidatures, examens et certifications.',
          workflow: 'Catalogue → Sessions → Inscriptions → Examens → Certification',
          status:
            pendingCandidatures > 10 ? 'critical' : pendingCandidatures > 5 ? 'warning' : 'ok',
          landingHref: '/gestion-academique',
          indicators: [
            { label: 'Candidatures', value: pendingCandidatures, subtitle: 'En instruction' },
            { label: 'Sessions', value: sessionsTotal, subtitle: `${upcomingSessions} sous 14 j` },
            { label: 'Réussite', value: `${tauxReussite} %`, subtitle: `${participants} participants` },
          ],
          links: [
            { label: 'Landing module', href: '/gestion-academique', variant: 'landing' },
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
            { label: 'Indicateurs', href: '/pilotage-supervision/pilotage/indicateurs', variant: 'pilotage' },
          ],
        },
        {
          key: 'administration-facturation',
          title: 'Administration & facturation',
          description: 'Devis, factures, encaissements et relances commerciales.',
          workflow: 'Devis → Acceptation → Facturation → Paiement',
          status: expiredDevis > 3 ? 'critical' : expiredDevis > 0 ? 'warning' : 'ok',
          landingHref: '/administration-facturation',
          indicators: [
            { label: 'Devis', value: totalDevis, subtitle: 'Émis' },
            { label: 'Expirés', value: expiredDevis, subtitle: 'À relancer' },
            { label: 'Leads', value: leadsCount, subtitle: 'Pipeline acquisition' },
          ],
          links: [
            { label: 'Landing module', href: '/administration-facturation', variant: 'landing' },
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
            { label: 'Rapports', href: '/pilotage-supervision/pilotage/rapports', variant: 'pilotage' },
          ],
        },
        {
          key: 'communication-contenu',
          title: 'Communication & contenu',
          description: 'CMS, marketing, leads, SEO et pages landing publiques.',
          workflow: 'Contenus → Campagnes → Leads → SEO → Publication',
          status: leadsCount > 50 ? 'warning' : 'ok',
          landingHref: '/communication-contenu',
          indicators: [
            { label: 'Formations actives', value: formationsActive, subtitle: 'Catalogue CMS' },
            { label: 'Leads', value: leadsCount, subtitle: 'Formulaires' },
            { label: 'Alertes', value: unreadAlerts, subtitle: 'Non lues CRM' },
          ],
          links: [
            { label: 'Landing module', href: '/communication-contenu', variant: 'landing' },
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
          ],
        },
        {
          key: 'support-qualite',
          title: 'Support & qualité',
          description: 'Tickets, incidents, base d\'aide et suivi qualité.',
          workflow: 'Ticket → Prise en charge → Résolution → Clôture',
          status:
            urgentTickets > 0 ? 'critical' : openTickets > 0 ? 'warning' : 'ok',
          landingHref: '/support-qualite',
          indicators: [
            { label: 'Tickets ouverts', value: openTickets, subtitle: 'En cours' },
            { label: 'Urgents', value: urgentTickets, subtitle: 'Priorité haute' },
            { label: 'Conformité', value: `${conformiteRate} %`, subtitle: 'Qualité globale' },
          ],
          links: [
            { label: 'Landing module', href: '/support-qualite', variant: 'landing' },
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
          ],
        },
        {
          key: 'securite-configuration',
          title: 'Sécurité & configuration',
          description: 'Utilisateurs, rôles, permissions, paramètres et audit.',
          workflow: 'Comptes → Rôles → Permissions → Audit',
          status: 'ok',
          landingHref: '/securite-configuration',
          indicators: [
            { label: 'Comptes', value: totalUsers, subtitle: 'Utilisateurs CRM' },
            { label: 'Actifs', value: collaborators, subtitle: 'Statut actif' },
            { label: 'Alertes', value: criticalAlerts, subtitle: 'Critiques' },
          ],
          links: [
            { label: 'Landing module', href: '/securite-configuration', variant: 'landing' },
            { label: 'Alertes', href: '/pilotage-supervision/pilotage/alertes', variant: 'pilotage' },
          ],
        },
      ],
    };
  }

  private bucketDailyCounts(
    days: number,
    rows: { createdAt: Date }[],
  ): { value: number }[] {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const map = new Map<string, number>();
    for (const row of rows) {
      const d = new Date(row.createdAt);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const points: { value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      points.push({ value: map.get(key) ?? 0 });
    }
    return points;
  }

  private bucketDailyCompliance(
    days: number,
    users: { carteProExpiry: Date | null; residencePermitExpiry: Date | null }[],
    now: Date,
  ): { value: number }[] {
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 30);
    const points: { value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const check = new Date(d);
      check.setDate(check.getDate() + 30);
      const count = users.filter(
        (u) =>
          (u.carteProExpiry && u.carteProExpiry <= check) ||
          (u.residencePermitExpiry && u.residencePermitExpiry <= check),
      ).length;
      points.push({ value: count });
    }
    return points;
  }

  private async weeklyFlux(weeks: number): Promise<{ period: string; value: number }[]> {
    const out: { period: string; value: number }[] = [];
    const now = new Date();
    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      const value = await this.prisma.inAppNotification.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      out.push({ period: `S${weeks - i}`, value });
    }
    return out;
  }

  private quarterlyFlux(
    rows: { createdAt: Date }[],
  ): { period: string; value: number }[] {
    const map = new Map<string, number>();
    for (const row of rows) {
      const d = row.createdAt;
      const q = Math.floor(d.getMonth() / 3) + 1;
      const key = `T${q} ${String(d.getFullYear()).slice(2)}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const keys = [...map.keys()].slice(-8);
    return keys.map((period) => ({ period, value: map.get(period) ?? 0 }));
  }

  private async hourlyFluxToday(): Promise<{ period: string; value: number }[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const rows = await this.prisma.inAppNotification.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    });
    const slots = ['00h', '04h', '08h', '12h', '16h', '20h'];
    const counts = slots.map(() => 0);
    for (const row of rows) {
      const h = row.createdAt.getHours();
      const idx = Math.min(5, Math.floor(h / 4));
      counts[idx]++;
    }
    return slots.map((period, i) => ({ period, value: counts[i] }));
  }

  private async gestionRessourcesIndicateurs(period: PilotagePeriod): Promise<PilotageIndicateursPayload> {
    const range = pilotagePeriodRange(period);
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);

    const [
      collaborators,
      absencesActive,
      complianceAlerts,
      equipmentTotal,
      equipmentMaintenance,
      equipmentOutOfService,
      equipmentInUse,
      roomsTotal,
      roomsInactive,
      maintenanceDue,
      notificationsGr,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isTrashed: false, status: 'ACTIVE' } }),
      this.prisma.rhAbsence.count({
        where: { startDate: { lte: new Date() }, endDate: { gte: new Date() }, status: 'APPROVED' },
      }),
      this.prisma.user.count({
        where: {
          isTrashed: false,
          OR: [{ carteProExpiry: { lte: horizon } }, { residencePermitExpiry: { lte: horizon } }],
        },
      }),
      this.prisma.equipment.count(),
      this.prisma.equipment.count({ where: { status: 'MAINTENANCE' } }),
      this.prisma.equipment.count({ where: { status: 'OUT_OF_SERVICE' } }),
      this.prisma.equipment.count({ where: { status: 'IN_USE' } }),
      this.prisma.formationVenueRoom.count(),
      this.prisma.formationVenueRoom.count({ where: { isActive: false } }),
      this.prisma.equipmentMaintenance.count({
        where: { scheduledDate: { lte: new Date(Date.now() + 7 * 86400000) }, status: 'SCHEDULED' },
      }),
      this.prisma.inAppNotification.count({
        where: {
          createdAt: { gte: range.start, lte: range.end },
          metadata: { path: ['moduleKey'], string_starts_with: 'gestion-ressources' },
        },
      }),
    ]);

    const buckets = monthBuckets(12);
    const movementRows = await this.prisma.stockMovement.findMany({
      where: { createdAt: { gte: buckets[0].start } },
      select: { createdAt: true },
    });
    const movementMap = new Map(buckets.map((b) => [b.key, 0]));
    for (const row of movementRows) {
      const d = row.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (movementMap.has(key)) movementMap.set(key, (movementMap.get(key) ?? 0) + 1);
    }

    const conformiteRate =
      collaborators > 0 ? Math.max(0, Math.round(((collaborators - complianceAlerts) / collaborators) * 100)) : 100;

    return {
      moduleId: 'gestion-ressources',
      period,
      kpis: [
        { key: 'collaborators', label: 'Collaborateurs actifs', value: collaborators, subtitle: 'Effectif RH' },
        { key: 'conformite', label: 'Conformité RH', value: `${conformiteRate} %`, subtitle: 'Hors échéance 30 j' },
        { key: 'equipmentHs', label: 'Matériel HS', value: equipmentOutOfService, subtitle: 'Inventaire' },
        { key: 'rooms', label: 'Salles actives', value: Math.max(0, roomsTotal - roomsInactive), subtitle: `${roomsInactive} inactive(s)` },
        { key: 'events', label: 'Événements période', value: notificationsGr, subtitle: range.label },
      ],
      charts: {
        distributionTitle: 'Parc équipements',
        evolutionTitle: 'Mouvements stock (12 mois)',
        evolutionSeriesName: 'Mouvements',
        distribution: [
          { name: 'En service', value: equipmentInUse },
          { name: 'Maintenance', value: equipmentMaintenance },
          { name: 'Hors service', value: equipmentOutOfService },
          { name: 'Disponible', value: Math.max(0, equipmentTotal - equipmentInUse - equipmentMaintenance - equipmentOutOfService) },
        ],
        distributionTotal: equipmentTotal,
        evolution: buckets.map((b) => ({ label: b.label, value: movementMap.get(b.key) ?? 0 })),
        secondaryDistributionTitle: 'Charge RH',
        secondaryDistribution: [
          { name: 'Absences actives', value: absencesActive },
          { name: 'Alertes conformité', value: complianceAlerts },
          { name: 'Maintenance 7 j', value: maintenanceDue },
        ],
      },
      sections: [
        { title: 'RH & conformité', description: 'Effectif, certifications, absences', href: '/gestion-ressources/rh' },
        { title: 'Équipements & inventaire', description: 'Parc matériel et affectations', href: '/gestion-ressources/equipements' },
        { title: 'Salles & planning', description: 'Capacité et réservations', href: '/gestion-ressources/equipements/salles' },
        { title: 'Compagnie', description: 'Documents administratifs', href: '/gestion-ressources/compagnie' },
      ],
    };
  }

  private async gestionRessourcesRisques(): Promise<PilotageRisquesPayload> {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);

    const [complianceCritical, equipmentHs, maintenanceDue, roomsInactive, absencesLong] = await Promise.all([
      this.prisma.user.count({
        where: {
          isTrashed: false,
          OR: [
            { carteProExpiry: { lte: new Date(Date.now() + 7 * 86400000) } },
            { residencePermitExpiry: { lte: new Date(Date.now() + 7 * 86400000) } },
          ],
        },
      }),
      this.prisma.equipment.count({ where: { status: 'OUT_OF_SERVICE' } }),
      this.prisma.equipmentMaintenance.count({
        where: { scheduledDate: { lte: new Date(Date.now() + 7 * 86400000) }, status: 'SCHEDULED' },
      }),
      this.prisma.formationVenueRoom.count({ where: { isActive: false } }),
      this.prisma.rhAbsence.count({
        where: {
          endDate: { gte: new Date() },
          startDate: { lte: new Date(Date.now() - 14 * 86400000) },
          status: 'APPROVED',
        },
      }),
    ]);

    const rows: PilotageRisqueRow[] = [
      {
        id: 'gr-compliance',
        risque: 'Échéances conformité RH (< 7 j)',
        gravite: complianceCritical > 0 ? 'Élevée' : 'Faible',
        exposition: complianceCritical,
        mesure: 'Relance documents & cartes pro',
        moduleKey: CRM_MODULE_KEYS.RH,
        href: '/gestion-ressources/rh/collaborateurs',
        recommendation:
          'Prioriser les collaborateurs dont la carte pro ou le titre de séjour expire sous 7 jours. Bloquer les affectations session si non conforme.',
      },
      {
        id: 'gr-equipment-hs',
        risque: 'Matériel hors service',
        gravite: equipmentHs > 2 ? 'Élevée' : equipmentHs > 0 ? 'Moyenne' : 'Faible',
        exposition: equipmentHs,
        mesure: 'Réaffecter ou commander pièces',
        moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
        href: '/gestion-ressources/equipements/inventaire',
        recommendation:
          'Vérifier les sessions impactées et basculer vers du matériel de remplacement avant le prochain cours.',
      },
      {
        id: 'gr-maintenance',
        risque: 'Maintenances planifiées sous 7 j',
        gravite: maintenanceDue > 0 ? 'Moyenne' : 'Faible',
        exposition: maintenanceDue,
        mesure: 'Planifier atelier / indisponibilité',
        moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
        href: '/gestion-ressources/equipements/inventaire',
        recommendation: 'Anticiper les créneaux maintenance pour éviter les conflits avec les sessions en salle.',
      },
      {
        id: 'gr-rooms',
        risque: 'Salles inactives',
        gravite: roomsInactive > 0 ? 'Moyenne' : 'Faible',
        exposition: roomsInactive,
        mesure: 'Réactiver ou réaffecter le planning',
        moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
        href: '/gestion-ressources/equipements/salles',
        recommendation: 'Réduire la capacité affichée au planning et communiquer aux formateurs les salles disponibles.',
      },
      {
        id: 'gr-absences',
        risque: 'Absences prolongées (> 14 j)',
        gravite: absencesLong > 3 ? 'Élevée' : absencesLong > 0 ? 'Moyenne' : 'Faible',
        exposition: absencesLong,
        mesure: 'Couverture pédagogique',
        moduleKey: CRM_MODULE_KEYS.RH,
        href: '/gestion-ressources/rh/absences',
        recommendation: 'Identifier les sessions sans remplaçant et activer le pool formateurs ou reporter les créneaux.',
      },
    ];

    const eleve = rows.filter((r) => r.gravite === 'Élevée').length;
    const moyenne = rows.filter((r) => r.gravite === 'Moyenne').length;
    const faible = rows.filter((r) => r.gravite === 'Faible').length;

    const buckets = monthBuckets(12);
    const notifRows = await this.prisma.inAppNotification.findMany({
      where: {
        createdAt: { gte: buckets[0].start },
        metadata: { path: ['moduleKey'], string_starts_with: 'gestion-ressources' },
      },
      select: { createdAt: true },
    });
    const notifMap = new Map(buckets.map((b) => [b.key, 0]));
    for (const row of notifRows) {
      const d = row.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (notifMap.has(key)) notifMap.set(key, (notifMap.get(key) ?? 0) + 1);
    }

    return {
      moduleId: 'gestion-ressources',
      kpis: [
        { key: 'risks', label: 'Risques suivis', value: rows.length, subtitle: 'Gestion ressources' },
        { key: 'eleve', label: 'Gravité élevée', value: eleve, subtitle: 'Action immédiate' },
        { key: 'compliance', label: 'Conformité critique', value: complianceCritical, subtitle: '< 7 jours' },
        { key: 'equipment', label: 'Matériel HS', value: equipmentHs, subtitle: 'Parc bloqué' },
        { key: 'absences', label: 'Absences longues', value: absencesLong, subtitle: '> 14 jours' },
      ],
      rows,
      charts: {
        distributionTitle: 'Répartition par gravité',
        evolutionTitle: 'Alertes GR (12 mois)',
        evolutionSeriesName: 'Notifications',
        distribution: [
          { name: 'Élevée', value: eleve },
          { name: 'Moyenne', value: moyenne },
          { name: 'Faible', value: faible },
        ],
        distributionTotal: eleve + moyenne + faible,
        evolution: buckets.map((b) => ({ label: b.label, value: notifMap.get(b.key) ?? 0 })),
      },
    };
  }

  getReportTemplate(templateId: string): PilotageRapportTemplate | null {
    return GESTION_RESSOURCES_REPORT_TEMPLATES.find((t) => t.id === templateId) ?? null;
  }

  serializeReportAsset(
    asset: {
      id: string;
      originalName: string;
      size: number;
      createdAt: Date;
      metadata: unknown;
      createdBy: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        avatar: string | null;
        status: string;
      } | null;
    },
    ctx?: {
      job?: { id: string; renderToken: string; format: string } | null;
      editor?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        avatar: string | null;
        status: string;
      } | null;
      editedAt?: string | null;
    },
  ): PilotageRapportRow | null {
    const meta = parseReportMeta(asset.metadata);
    if (!meta) return null;
    const createdBy = toReportActor(asset.createdBy);
    const editedBy = toReportActor(ctx?.editor ?? null);
    const htmlPreviewUrl =
      meta.format === 'PDF' && ctx?.job
        ? `/reports/render/${ctx.job.id}?token=${encodeURIComponent(ctx.job.renderToken)}`
        : null;
    return {
      id: asset.id,
      referenceCode: pilotageReportReferenceCode(asset.id),
      templateId: meta.templateId,
      label: meta.label,
      moduleKey: meta.moduleKey,
      format: meta.format,
      status: 'generated',
      description: meta.description,
      generatedAt: asset.createdAt.toISOString(),
      period: meta.period,
      periodLabel: meta.periodLabel,
      generationSource: meta.generationSource,
      fileName: asset.originalName,
      fileSize: asset.size,
      createdByName: createdBy?.name ?? null,
      createdBy,
      editedBy,
      editedAt: ctx?.editedAt ?? meta.editedAt ?? null,
      htmlPreviewUrl,
    };
  }

  async listGeneratedReports(
    period: PilotagePeriod | 'custom',
    customRange?: { start: Date; end: Date },
  ): Promise<PilotageRapportRow[]> {
    const range = resolveListRange(period, customRange);

    const jobs = await this.prisma.reportGenerationJob.findMany({
      where: {
        templateKey: { startsWith: 'pilotage.' },
        AND: [
          {
            OR: [
              { createdAt: { gte: range.start, lte: range.end } },
              {
                AND: [
                  { periodStart: { lte: range.end } },
                  { periodEnd: { gte: range.start } },
                ],
              },
            ],
          },
          {
            OR: [
              { status: { in: ['PENDING', 'RUNNING', 'FAILED'] } },
              { status: 'COMPLETED', fileAssetId: { not: null } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    const linkedAssetIds = [
      ...new Set(jobs.map((j) => j.fileAssetId).filter((id): id is string => Boolean(id))),
    ];

    const assets = await this.prisma.fileAsset.findMany({
      where: {
        module: PILOTAGE_REPORT_MODULE,
        entityType: PILOTAGE_REPORT_ENTITY,
        status: 'ACTIVE',
        deletedAt: null,
        OR: [
          { createdAt: { gte: range.start, lte: range.end } },
          ...(linkedAssetIds.length ? [{ id: { in: linkedAssetIds } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
      },
      take: 200,
    });

    const editorIds = new Set<string>();
    const jobIdsFromMeta = new Set<string>();
    for (const asset of assets) {
      const meta = parseReportMeta(asset.metadata);
      if (meta?.editedByUserId) editorIds.add(meta.editedByUserId);
      if (meta?.jobId) jobIdsFromMeta.add(meta.jobId);
    }

    const allAssetIds = assets.map((a) => a.id);
    const completedJobAssetIds = jobs
      .map((j) => j.fileAssetId)
      .filter((id): id is string => Boolean(id));
    const lookupAssetIds = [...new Set([...allAssetIds, ...completedJobAssetIds])];

    const jobLookupSelect = {
      id: true,
      renderToken: true,
      format: true,
      fileAssetId: true,
      templateKey: true,
      title: true,
      summary: true,
      period: true,
      periodLabel: true,
      parameters: true,
    } as const;

    const [editors, jobsByAsset, jobsById] = await Promise.all([
      editorIds.size
        ? this.prisma.user.findMany({
            where: { id: { in: [...editorIds] } },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              status: true,
            },
          })
        : Promise.resolve([]),
      lookupAssetIds.length
        ? this.prisma.reportGenerationJob.findMany({
            where: { fileAssetId: { in: lookupAssetIds } },
            select: jobLookupSelect,
          })
        : Promise.resolve([]),
      jobIdsFromMeta.size
        ? this.prisma.reportGenerationJob.findMany({
            where: { id: { in: [...jobIdsFromMeta] } },
            select: jobLookupSelect,
          })
        : Promise.resolve([]),
    ]);

    const editorById = new Map(editors.map((u) => [u.id, u]));
    type JobLookup = (typeof jobs)[number] | (typeof jobsByAsset)[number];
    const jobByAssetId = new Map<string, JobLookup>();
    for (const j of [...jobsByAsset, ...jobsById]) {
      if (j.fileAssetId) jobByAssetId.set(j.fileAssetId, j);
    }
    for (const j of jobs) {
      if (j.fileAssetId) jobByAssetId.set(j.fileAssetId, j);
    }
    const jobById = new Map<string, JobLookup>();
    for (const j of [...jobsByAsset, ...jobsById, ...jobs]) {
      jobById.set(j.id, j);
    }

    const assetRows = assets
      .map((asset) => {
        const meta = parseReportMeta(asset.metadata);
        const job =
          jobByAssetId.get(asset.id) ?? (meta?.jobId ? jobById.get(meta.jobId) : null) ?? null;
        if (!meta && job) {
          const tpl = getReportTemplate(job.templateKey);
          const createdBy = toReportActor(asset.createdBy);
          const fmt =
            job.format === 'EXCEL' ? 'Excel' : job.format === 'PDF' ? 'PDF' : ('CSV' as const);
          return {
            id: asset.id,
            referenceCode: pilotageReportReferenceCode(asset.id),
            templateId: job.templateKey,
            label: job.title,
            moduleKey: tpl?.moduleKey ?? CRM_MODULE_KEYS.PILOTAGE,
            format: fmt,
            status: 'generated' as const,
            description: job.summary ?? tpl?.description ?? '',
            generatedAt: asset.createdAt.toISOString(),
            period: (['day', 'week', 'month', 'year'].includes(job.period)
              ? job.period
              : 'month') as PilotagePeriod,
            periodLabel: job.periodLabel,
            generationSource: parseJobGenerationSource(job.parameters),
            fileName: asset.originalName,
            fileSize: asset.size,
            createdByName: createdBy?.name ?? null,
            createdBy,
            editedBy: null,
            editedAt: null,
            htmlPreviewUrl:
              job.format === 'PDF'
                ? `/reports/render/${job.id}?token=${encodeURIComponent(job.renderToken)}`
                : null,
          };
        }
        const editor = meta?.editedByUserId ? editorById.get(meta.editedByUserId) : null;
        return this.serializeReportAsset(asset, {
          job,
          editor,
          editedAt: meta?.editedAt ?? null,
        });
      })
      .filter((r): r is PilotageRapportRow => r != null);

    const jobRows: PilotageRapportRow[] = [];
    for (const job of jobs) {
      if (job.status === 'COMPLETED' && job.fileAssetId) {
        const linked = assetRows.find((r) => r.id === job.fileAssetId);
        if (linked) continue;
      }

      const tpl = getReportTemplate(job.templateKey);
      const createdBy = toReportActor(job.requestedBy);
      const fmt =
        job.format === 'EXCEL' ? 'Excel' : job.format === 'PDF' ? 'PDF' : ('CSV' as const);
      const status =
        job.status === 'PENDING'
          ? 'pending'
          : job.status === 'RUNNING'
            ? 'running'
            : job.status === 'FAILED'
              ? 'failed'
              : 'generated';

      jobRows.push({
        id: job.fileAssetId ?? `job:${job.id}`,
        referenceCode: pilotageReportReferenceCode(job.fileAssetId ?? job.id),
        templateId: job.templateKey,
        label: job.title,
        moduleKey: tpl?.moduleKey ?? CRM_MODULE_KEYS.PILOTAGE,
        format: fmt,
        status,
        description: job.summary ?? tpl?.description ?? '',
        generatedAt: (job.completedAt ?? job.createdAt).toISOString(),
        period: (['day', 'week', 'month', 'year'].includes(job.period)
          ? job.period
          : 'month') as PilotagePeriod,
        periodLabel: job.periodLabel,
        generationSource: parseJobGenerationSource(job.parameters),
        fileName: null,
        fileSize: null,
        createdByName: createdBy?.name ?? null,
        createdBy,
        editedBy: null,
        editedAt: null,
        htmlPreviewUrl:
          job.format === 'PDF' && job.status !== 'FAILED'
            ? `/reports/render/${job.id}?token=${encodeURIComponent(job.renderToken)}`
            : null,
      });
    }

    return [...jobRows, ...assetRows].sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );
  }

  async prepareReportCsv(
    templateId: string,
    period: PilotagePeriod,
  ): Promise<{
    template: PilotageRapportTemplate;
    filename: string;
    content: string;
    meta: PilotageReportAssetMeta;
  } | null> {
    const template = this.getReportTemplate(templateId);
    if (!template) return null;
    if (template.format !== 'CSV' || !template.exportDataset || !isPilotageExportDataset(template.exportDataset)) {
      return null;
    }
    const range = pilotagePeriodRange(period);
    const exporter = new PilotageExportService(this.prisma);
    const { filename, csv } = await exporter.exportCsv(template.exportDataset as PilotageExportDataset);
    return {
      template,
      filename: filename.replace(/\.csv$/i, '') + `-${template.id}-${period}.csv`,
      content: csv,
      meta: {
        templateId: template.id,
        label: template.label,
        moduleKey: template.moduleKey,
        format: template.format,
        period,
        periodLabel: range.label,
        description: template.description,
      },
    };
  }

  async updateReportMeta(
    reportId: string,
    patch: { label?: string; description?: string },
    editorUserId?: string,
  ): Promise<PilotageRapportRow | null> {
    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id: reportId,
        module: PILOTAGE_REPORT_MODULE,
        entityType: PILOTAGE_REPORT_ENTITY,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
      },
    });
    if (!asset) return null;
    const meta = parseReportMeta(asset.metadata) ?? {
      templateId: '',
      label: asset.originalName,
      moduleKey: '',
      format: 'CSV' as const,
      period: 'month' as PilotagePeriod,
      periodLabel: '',
      description: '',
    };
    const editedAt = new Date().toISOString();
    const nextMeta: PilotageReportAssetMeta = {
      ...meta,
      ...(patch.label ? { label: patch.label.trim() } : {}),
      ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
      ...(editorUserId
        ? { editedByUserId: editorUserId, editedAt }
        : {}),
    };
    const updated = await this.prisma.fileAsset.update({
      where: { id: reportId },
      data: { metadata: nextMeta },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    const [editor, job] = await Promise.all([
      editorUserId
        ? this.prisma.user.findUnique({
            where: { id: editorUserId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              status: true,
            },
          })
        : Promise.resolve(null),
      this.prisma.reportGenerationJob.findFirst({
        where: {
          OR: [
            { fileAssetId: reportId },
            ...(meta.jobId ? [{ id: meta.jobId }] : []),
          ],
        },
        select: { id: true, renderToken: true, format: true },
      }),
    ]);

    return this.serializeReportAsset(updated, {
      job,
      editor,
      editedAt: editorUserId ? editedAt : meta.editedAt ?? null,
    });
  }

  private async gestionRessourcesRapports(
    period: PilotagePeriod | 'custom',
    customRange?: { start: Date; end: Date },
  ): Promise<PilotageRapportsPayload> {
    const range = resolveListRange(period, customRange);
    const templates = GESTION_RESSOURCES_REPORT_TEMPLATES;
    const rows = await this.listGeneratedReports(period, customRange);

    const available = templates.filter((t) => t.status === 'available' && t.format === 'CSV' && t.exportDataset).length;
    const scheduled = templates.filter((t) => t.status === 'scheduled' || (t.format !== 'CSV')).length;
    const inProgress = rows.filter((r) => r.status === 'pending' || r.status === 'running').length;

    return {
      moduleId: 'gestion-ressources',
      period,
      periodLabel: range.label,
      kpis: [
        { key: 'templates', label: 'Modèles disponibles', value: templates.length, subtitle: 'Gestion ressources' },
        { key: 'generated', label: 'Rapports générés', value: rows.filter((r) => r.status === 'generated').length, subtitle: range.label },
        { key: 'in_progress', label: 'En cours', value: inProgress, subtitle: 'File worker' },
        { key: 'available', label: 'CSV prêts', value: available, subtitle: 'Génération immédiate' },
        { key: 'scheduled', label: 'PDF / Excel', value: scheduled + rows.filter((r) => r.format !== 'CSV').length, subtitle: 'Automatisations' },
      ],
      rows,
      templates,
    };
  }
}
