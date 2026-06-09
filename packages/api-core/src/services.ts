import { PrismaClient, UserStatus, CandidatureStatus } from '@repo/database';
import { redis, getCache, setCache } from '@repo/redis';
import { ModuleStatsResponse, StatKpiCard } from './contracts';

const CANDIDATURE_STATUS_LABEL_FR: Partial<Record<CandidatureStatus, string>> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis',
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'Validation',
  PENDING_CNAPS: 'CNAPS',
  CNAPS_APPROVED: 'CNAPS favorable',
  CNAPS_REJECTED: 'CNAPS refus',
  VALIDATED: 'Validées',
  COMPLETED: 'Terminées',
  REJECTED: 'Refusées',
  ARCHIVED: 'Archivées',
};

export class StatService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Encapsule le calcul avec une couche de cache Redis
   */
  async getCachedStats<T = ModuleStatsResponse>(
    cacheKey: string,
    computeFn: () => Promise<T>,
    ttlSeconds: number = 300 // 5 minutes par défaut
  ): Promise<T> {
    const cached = await getCache<T>(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await computeFn();
    await setCache(cacheKey, stats, ttlSeconds);
    return stats;
  }

  /**
   * Stats spécifique pour les Candidats
   */
  async getCandidatsStats(months: number = 12): Promise<ModuleStatsResponse> {
    const cacheKey = `stats:rh:candidats:${months}`;
    
    return this.getCachedStats(cacheKey, async () => {
      const where = {
        isTrashed: false,
        role: { slug: 'candidat' },
      };

      const now = new Date();
      const timelineStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      const [total, active, pending, users] = await Promise.all([
        this.prisma.user.count({ where }),
        this.prisma.user.count({ where: { ...where, status: UserStatus.ACTIVE } }),
        this.prisma.user.count({ where: { ...where, status: UserStatus.PENDING } }),
        this.prisma.user.findMany({
          where,
          select: { roleId: true, createdAt: true },
        }),
      ]);

      const roleIds = Array.from(new Set(users.map((u) => u.roleId).filter(Boolean)));
      const roles = roleIds.length
        ? await this.prisma.userRole.findMany({
            where: { id: { in: roleIds } },
            select: { id: true, name: true, slug: true },
          })
        : [];
      
      const roleById = new Map(roles.map((r) => [r.id, r]));
      const categoryMap = new Map<string, number>();
      const monthMap = new Map<string, number>();

      for (const user of users) {
        const role = roleById.get(user.roleId);
        const roleLabel = role?.name || role?.slug || 'Candidats';
        categoryMap.set(roleLabel, (categoryMap.get(roleLabel) || 0) + 1);

        if (user.createdAt >= timelineStart) {
          const key = StatService.toMonthKey(user.createdAt);
          monthMap.set(key, (monthMap.get(key) || 0) + 1);
        }
      }

      const kpis: StatKpiCard[] = [
        { label: 'Total Candidats', value: total, icon: 'Users', color: 'primary' },
        { label: 'Actifs', value: active, trend: 'up', color: 'success' },
        { label: 'En attente', value: pending, color: 'warning' },
        { label: 'Non actifs', value: Math.max(0, total - active), color: 'info' },
      ];

      const categoryDistribution = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const timeline = StatService.generateMonthlyTimeline(months);
      const monthlyEvolution = timeline.map(t => ({
        date: t.date,
        count: monthMap.get(t.key) || 0,
      }));

      return {
        kpis,
        monthlyEvolution,
        categoryDistribution,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Stats spécifique pour les Collaborateurs
   */
  async getCollaborateursStats(months: number = 12): Promise<ModuleStatsResponse> {
    const cacheKey = `stats:rh:collaborateurs:${months}`;

    return this.getCachedStats(cacheKey, async () => {
      const where: any = {
        isTrashed: false,
        NOT: [{ role: { slug: { in: ['candidat', 'eleve'] } } }],
      };

      const now = new Date();
      const expiringThreshold = new Date(now);
      expiringThreshold.setDate(expiringThreshold.getDate() + 30);
      const timelineStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      const [
        total,
        active,
        absent,
        documentsExpiring,
        documentsExpired,
        users,
      ] = await Promise.all([
        this.prisma.user.count({ where }),
        this.prisma.user.count({ where: { ...where, status: UserStatus.ACTIVE } }),
        this.prisma.user.count({ where: { ...where, status: UserStatus.ABSENT } }),
        this.prisma.user.count({
          where: {
            ...where,
            OR: [
              { carteProExpiry: { gt: now, lte: expiringThreshold } },
              { residencePermitExpiry: { gt: now, lte: expiringThreshold } },
            ],
          },
        }),
        this.prisma.user.count({
          where: {
            ...where,
            OR: [
              { carteProExpiry: { lte: now } },
              { residencePermitExpiry: { lte: now } },
            ],
          },
        }),
        this.prisma.user.findMany({
          where,
          select: { roleId: true, createdAt: true },
        }),
      ]);

      const complianceIssues = documentsExpiring + documentsExpired;
      const complianceRate = total > 0
        ? Math.max(0, Math.round(((total - complianceIssues) / total) * 100))
        : 100;

      const kpis: StatKpiCard[] = [
        { label: 'Effectif Actif', value: active, trend: 'neutral', trendValue: `${total}`, color: 'primary', icon: 'Users' },
        { label: 'Conformité', value: `${complianceRate}%`, trend: 'neutral', trendValue: `${complianceIssues}`, color: 'success', icon: 'ShieldCheck' },
        { label: 'Absences', value: absent, trend: 'neutral', trendValue: `${total}`, color: 'warning', icon: 'Calendar' },
        { label: 'Alertes', value: complianceIssues, trend: 'neutral', trendValue: `${complianceRate}%`, color: 'destructive', icon: 'AlertTriangle' },
      ];

      // On pourrait aussi ajouter les rôles si besoin
      const roleIds = Array.from(new Set(users.map((u) => u.roleId).filter(Boolean)));
      const roles = roleIds.length
        ? await this.prisma.userRole.findMany({
            where: { id: { in: roleIds } },
            select: { id: true, name: true, slug: true },
          })
        : [];
      const roleById = new Map(roles.map((r) => [r.id, r]));

      const categoryMap = new Map<string, number>();
      const monthMap = new Map<string, number>();
      for (const user of users) {
        const role = roleById.get(user.roleId);
        const roleLabel = role?.name || role?.slug || 'Autres';
        categoryMap.set(roleLabel, (categoryMap.get(roleLabel) || 0) + 1);

        if (user.createdAt >= timelineStart) {
          const key = StatService.toMonthKey(user.createdAt);
          monthMap.set(key, (monthMap.get(key) || 0) + 1);
        }
      }

      const categoryDistribution = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const timeline = StatService.generateMonthlyTimeline(months);
      const monthlyEvolution = timeline.map((t) => ({
        date: t.date,
        count: monthMap.get(t.key) || 0,
      }));

      return {
        kpis,
        monthlyEvolution,
        categoryDistribution,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Stats spécifique pour la Vie Scolaire
   */
  async getVieScolaireStats(months: number = 12): Promise<ModuleStatsResponse & { recentCandidatures?: any[] }> {
    const cacheKey = `stats:academique:vie-scolaire:${months}`;

    return this.getCachedStats(cacheKey, async () => {
      const now = new Date();
      const timelineStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      const [
        formationsCatalogPublished,
        sessionsTotal,
        sessionParticipantsTotal,
        candidaturesTotal,
        candidaturesGrouped,
        recentCandidatures,
      ] = await Promise.all([
        this.prisma.formationCatalogOffer.count({ where: { catalogStatus: 'ACTIVE' } }),
        this.prisma.formationSession.count(),
        this.prisma.formationSessionParticipant.count(),
        this.prisma.candidature.count(),
        this.prisma.candidature.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.candidature.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
            formation: { select: { id: true, name: true } },
            interestedSession: {
              select: { id: true, dateDisplayLabel: true },
            },
          },
        }),
      ]);

      const candidaturesPending = candidaturesGrouped
        .filter(
          (g) =>
            g.status !== CandidatureStatus.VALIDATED &&
            g.status !== CandidatureStatus.ARCHIVED &&
            g.status !== CandidatureStatus.REJECTED
        )
        .reduce((sum, g) => sum + g._count._all, 0);

      const candidaturesValidated = candidaturesGrouped.find(
        (g) => g.status === CandidatureStatus.VALIDATED
      )?._count._all ?? 0;

      const kpis: StatKpiCard[] = [
        { label: 'Offres Catalogue', value: formationsCatalogPublished, color: 'primary', icon: 'BookOpen' },
        { label: 'Sessions', value: sessionsTotal, color: 'info', icon: 'Calendar' },
        { label: 'Inscriptions', value: sessionParticipantsTotal, color: 'success', icon: 'UserCheck' },
        { label: 'Dossiers en attente', value: candidaturesPending, trend: 'up', color: 'warning', icon: 'FileText' },
      ];

      const categoryDistribution = candidaturesGrouped
        .map((g) => ({
          name: CANDIDATURE_STATUS_LABEL_FR[g.status as CandidatureStatus] ?? String(g.status).replace(/_/g, ' '),
          count: g._count._all,
        }))
        .sort((a, b) => b.count - a.count);

      const recentCreations = await this.prisma.candidature.findMany({
        where: { createdAt: { gte: timelineStart } },
        select: { createdAt: true },
      });

      const monthMap = new Map<string, number>();
      for (const row of recentCreations) {
        const key = StatService.toMonthKey(row.createdAt);
        monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
      }

      const timeline = StatService.generateMonthlyTimeline(months);
      const monthlyEvolution = timeline.map((t) => ({
        date: t.date,
        count: monthMap.get(t.key) ?? 0,
      }));

      return {
        kpis,
        monthlyEvolution,
        categoryDistribution,
        recentCandidatures,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Stats spécifique pour les Équipements
   */
  async getEquipementsStats(days: number = 30): Promise<ModuleStatsResponse & { statusCounts?: any[] }> {
    const cacheKey = `stats:ressources:equipements:v2:${days}`;

    return this.getCachedStats(cacheKey, async () => {
      const [statusRows, movementRows] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT e."status"::text as "status", COUNT(*) as "count"
          FROM "Equipment" e
          GROUP BY e."status"
        `,
        this.prisma.$queryRaw<any[]>`
          SELECT
            date_trunc('day', sm."movementDate") as "day",
            SUM(CASE WHEN sm."type" = 'IN' THEN 1 ELSE 0 END) as "inCount",
            SUM(CASE WHEN sm."type" = 'OUT' THEN 1 ELSE 0 END) as "outCount",
            SUM(CASE WHEN sm."type" = 'TRANSFER' THEN 1 ELSE 0 END) as "transferCount"
          FROM "StockMovement" sm
          WHERE sm."movementDate" >= NOW() - (${days}::text || ' days')::interval
          GROUP BY date_trunc('day', sm."movementDate")
          ORDER BY date_trunc('day', sm."movementDate") ASC
        `,
      ]);

      const toNumber = (v: any) => (typeof v === 'bigint' ? Number(v) : Number(v || 0));

      const statusCounts = statusRows.map((row) => ({
        status: row.status,
        count: toNumber(row.count),
      }));

      const total = statusCounts.reduce((acc, s) => acc + s.count, 0);
      const available = statusCounts.find(s => s.status === 'AVAILABLE')?.count ?? 0;
      const maintenance = statusCounts.find(s => s.status === 'MAINTENANCE')?.count ?? 0;
      const outOfService = statusCounts.find(s => s.status === 'OUT_OF_SERVICE')?.count ?? 0;

      const kpis: StatKpiCard[] = [
        { label: 'Total Équipements', value: total, color: 'primary', icon: 'Package' },
        { label: 'Disponibles', value: available, color: 'success', icon: 'CheckCircle' },
        { label: 'En Maintenance', value: maintenance, color: 'warning', icon: 'Settings' },
        { label: 'Hors Service', value: outOfService, color: 'destructive', icon: 'AlertTriangle' },
      ];

      const months = Math.max(1, Math.min(24, Math.ceil(days / 30)));
      const monthMap = new Map<string, number>();
      for (const row of movementRows) {
        const day = row.day instanceof Date ? row.day : new Date(row.day);
        const key = StatService.toMonthKey(day);
        const count =
          toNumber(row.inCount) + toNumber(row.outCount) + toNumber(row.transferCount);
        monthMap.set(key, (monthMap.get(key) ?? 0) + count);
      }

      const timeline = StatService.generateMonthlyTimeline(months);
      const monthlyEvolution = timeline.map((t) => ({
        date: t.date,
        count: monthMap.get(t.key) ?? 0,
      }));

      return {
        kpis,
        monthlyEvolution,
        categoryDistribution: statusCounts.map((s) => ({ name: s.status, count: s.count })),
        statusCounts,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Stats spécifique pour la Finance / Facturation
   */
  async getFinanceStats(months: number = 12): Promise<ModuleStatsResponse> {
    const cacheKey = `stats:finance:global:${months}`;

    return this.getCachedStats(cacheKey, async () => {
      const now = new Date();
      const timelineStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      const [totalDevis, acceptedDevis, totalLeads, devisEvolution] = await Promise.all([
        this.prisma.financeDevis.count(),
        this.prisma.financeDevis.count({ where: { status: 'ACCEPTED' } }),
        this.prisma.lead.count(),
        this.prisma.financeDevis.findMany({
          where: { createdAt: { gte: timelineStart } },
          select: { createdAt: true, totalTtc: true },
        }),
      ]);

      const monthMap = new Map<string, number>();
      for (const devis of devisEvolution) {
        const key = StatService.toMonthKey(devis.createdAt);
        monthMap.set(key, (monthMap.get(key) || 0) + Number(devis.totalTtc || 0));
      }

      const kpis: StatKpiCard[] = [
        { label: 'Devis Émis', value: totalDevis, color: 'primary', icon: 'FileText' },
        { label: 'Devis Acceptés', value: acceptedDevis, color: 'success', icon: 'CheckCircle' },
        { label: 'Nouveaux Leads', value: totalLeads, color: 'info', icon: 'UserPlus' },
        { label: 'Factures en attente', value: 0, color: 'warning', icon: 'Clock' },
      ];

      const timeline = StatService.generateMonthlyTimeline(months);
      const monthlyEvolution = timeline.map((t) => ({
        date: t.date,
        count: Math.round(monthMap.get(t.key) || 0),
      }));

      return {
        kpis,
        monthlyEvolution,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Stats pour le Dashboard principal (Général)
   */
  async getGeneralDashboardStats(): Promise<any> {
    const cacheKey = `stats:dashboard:general`;

    return this.getCachedStats(cacheKey, async () => {
      const [
        trainersCount,
        sessionsCount,
        equipmentsBroken,
        totalUsers,
        activeSites,
        activeCollaborators,
      ] = await Promise.all([
        this.prisma.user.count({ where: { role: { slug: 'formateur' }, isTrashed: false } }),
        this.prisma.formationSession.count(),
        this.prisma.equipment.count({ where: { status: 'OUT_OF_SERVICE' } }),
        this.prisma.user.count({ where: { isTrashed: false } }),
        this.prisma.clientSite.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { status: 'ACTIVE', isTrashed: false, NOT: [{ role: { slug: { in: ['candidat', 'eleve'] } } }] } }),
      ]);

      return {
        success: true,
        data: {
          administration: { totalUsers },
          sites: { activeSites, activeClients: activeSites }, // Clients = Sites pour l'instant
          rh: { activeEmployees: activeCollaborators },
          availableAgents: {
            label: 'Formateurs actifs',
            value: trainersCount,
            trend: 'up',
            trendValue: '+4.2%',
            icon: 'Users',
          },
          activeTeams: {
            label: 'Equipes pedagogiques',
            value: 7,
            trend: 'up',
            trendValue: '+1.8%',
            icon: 'UsersRound',
          },
          brokenEquipments: {
            label: 'Incidents materiel',
            value: equipmentsBroken,
            trend: 'down',
            trendValue: '-12.5%',
            icon: 'AlertTriangle',
          },
          operationalVehicles: {
            label: 'Salles disponibles',
            value: 14,
            trend: 'up',
            trendValue: '+2.1%',
            icon: 'CheckCircle',
          },
          serviceHours: {
            label: 'Heures de cours',
            value: 186,
            trend: 'up',
            trendValue: '+6.4%',
            icon: 'Clock3',
          },
          coveredSites: {
            label: 'Campus actifs',
            value: 4,
            trend: 'neutral',
            trendValue: 'stable',
            icon: 'MapPin',
          },
        },
        stats: [
          { icon: 'GraduationCap', text: 'Taux de reussite', total: 91, stats: 3, trend: 'up', unit: '%' },
          { icon: 'BookOpenCheck', text: 'Parcours complets', total: 247, stats: 5, trend: 'up' },
          { icon: 'ClipboardCheck', text: 'Inscriptions valides', total: 132, stats: 2, trend: 'up' },
          { icon: 'UserCheck', text: 'Assiduite moyenne', total: 88, stats: 1, trend: 'neutral', unit: '%' },
          { icon: 'ShieldCheck', text: 'Conformite qualite', total: 96, stats: 2, trend: 'up', unit: '%' },
        ],
        overallPerformance: {
          value: 89.6,
          trend: 2.7,
        },
        categories: [
          { badgeColor: 'bg-blue-500', label: 'Pedagogie' },
          { badgeColor: 'bg-green-500', label: 'Inscriptions' },
          { badgeColor: 'bg-orange-500', label: 'Suivi' },
        ],
        updatedAt: new Date().toISOString(),
      };
    }, 600); // 10 minutes de cache pour le dashboard
  }

  /**
   * Stats pour le Support et la Qualité (Incidents, Feedback)
   */
  async getSupportQualiteStats(): Promise<ModuleStatsResponse> {
    const cacheKey = `stats:support-qualite:global`;

    return this.getCachedStats(cacheKey, async () => {
      const [total, open, inProgress, waiting, resolved, urgent] = await Promise.all([
        this.prisma.supportTicket.count(),
        this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.supportTicket.count({ where: { status: 'WAITING_CLIENT' } }),
        this.prisma.supportTicket.count({
          where: { status: { in: ['RESOLVED', 'CLOSED'] } },
        }),
        this.prisma.supportTicket.count({
          where: {
            priority: { in: ['HIGH', 'URGENT'] },
            status: { notIn: ['RESOLVED', 'CLOSED'] },
          },
        }),
      ]);

      const pending = open + inProgress + waiting;
      const resolutionRate =
        total > 0 ? `${Math.round((resolved / total) * 100)}%` : '—';

      const kpis: StatKpiCard[] = [
        {
          label: 'Tickets ouverts',
          value: open,
          color: 'primary',
          icon: 'MessageSquare',
          trendValue: `${total} total`,
          trend: 'neutral',
        },
        {
          label: 'Résolus',
          value: resolved,
          color: 'success',
          icon: 'CheckCircle',
          trendValue: resolutionRate,
          trend: 'up',
        },
        {
          label: 'En cours',
          value: pending,
          color: 'warning',
          icon: 'Clock',
          trendValue: `${inProgress} actifs`,
          trend: 'neutral',
        },
        {
          label: 'Urgents',
          value: urgent,
          color: 'destructive',
          icon: 'AlertTriangle',
          trendValue: urgent > 0 ? 'Priorité haute' : 'RAS',
          trend: urgent > 0 ? 'down' : 'neutral',
        },
        {
          label: 'SLA cible',
          value: pending === 0 ? '100%' : '—',
          color: 'info',
          icon: 'Zap',
          trendValue: '1re réponse',
          trend: 'neutral',
        },
      ];

      return {
        kpis,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Stats pour la Sécurité et Configuration (Accès, Roles)
   */
  async getSecurityStats(): Promise<ModuleStatsResponse> {
    const cacheKey = `stats:security:global`;

    return this.getCachedStats(cacheKey, async () => {
      const [totalUsers, totalRoles, activeSessions, pendingUsers] = await Promise.all([
        this.prisma.user.count({ where: { isTrashed: false } }),
        this.prisma.userRole.count({ where: { isTrashed: false } }),
        this.prisma.session.count({ where: { expires: { gt: new Date() } } }),
        this.prisma.user.count({ where: { status: 'PENDING', isTrashed: false } }),
      ]);

      const kpis: StatKpiCard[] = [
        { label: 'Utilisateurs', value: totalUsers, color: 'primary', icon: 'Users' },
        { label: 'Rôles actifs', value: totalRoles, color: 'info', icon: 'Shield' },
        { label: 'Sessions actives', value: activeSessions, color: 'success', icon: 'Key' },
        { label: 'En attente', value: pendingUsers, color: 'warning', icon: 'UserPlus' },
        { label: 'Logs sécurité', value: 124, color: 'destructive', icon: 'Lock' },
      ];

      return {
        kpis,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Stats génériques pour les modules en cours de développement
   */
  async getGenericModuleStats(moduleName: string): Promise<ModuleStatsResponse> {
    const cacheKey = `stats:generic:${moduleName}`;

    return this.getCachedStats(cacheKey, async () => {
      return {
        kpis: [
          { label: 'Activités', value: 0, color: 'primary', icon: 'Activity' },
          { label: 'En attente', value: 0, color: 'warning', icon: 'Clock' },
          { label: 'Terminé', value: 0, color: 'success', icon: 'CheckCircle' },
          { label: 'Alertes', value: 0, color: 'destructive', icon: 'AlertTriangle' },
        ],
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * KPIs hubs section (remplace l’appel générique à rh/collaborateurs/stats).
   * Retourne le format legacy attendu par les cartes *-stats.tsx du CRM.
   */
  async getSectionHubLegacyStats(
    section: string,
    months: number = 12,
  ): Promise<{
    totalCollaborators: number;
    activeCollaborators: number;
    absentCollaborators: number;
    complianceRate: number;
    complianceIssues: number;
    categoryDistribution: { name: string; count: number }[];
    monthlyEvolution: { date: string; count: number }[];
  }> {
    const cacheKey = `stats:hub:section:${section}:${months}`;
    return this.getCachedStats(cacheKey, async () => {
      const now = new Date();
      const timelineStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
      const timeline = StatService.generateMonthlyTimeline(months);
      const monthMap = new Map<string, number>();

      const bumpMonths = (rows: { createdAt: Date }[]) => {
        for (const row of rows) {
          if (row.createdAt >= timelineStart) {
            const key = StatService.toMonthKey(row.createdAt);
            monthMap.set(key, (monthMap.get(key) || 0) + 1);
          }
        }
      };

      const pack = (
        total: number,
        active: number,
        pending: number,
        issues: number,
        distribution: { name: string; count: number }[],
        evolutionRows: { createdAt: Date }[],
      ) => {
        bumpMonths(evolutionRows);
        const complianceRate =
          total > 0 ? Math.max(0, Math.round(((total - issues) / total) * 100)) : 100;
        return {
          totalCollaborators: total,
          activeCollaborators: active,
          absentCollaborators: pending,
          complianceRate,
          complianceIssues: issues,
          categoryDistribution: distribution,
          monthlyEvolution: timeline.map((t) => ({
            date: t.date,
            count: monthMap.get(t.key) || 0,
          })),
        };
      };

      switch (section) {
        case 'cms': {
          const [total, active, draft, rows] = await Promise.all([
            this.prisma.formation.count(),
            this.prisma.formation.count({ where: { status: 'ACTIVE' } }),
            this.prisma.formation.count({ where: { status: { not: 'ACTIVE' } } }),
            this.prisma.formation.findMany({
              select: { createdAt: true, status: true },
            }),
          ]);
          const dist = [
            { name: 'Actives', count: active },
            { name: 'Brouillons / autres', count: draft },
          ];
          return pack(total, active, draft, draft, dist, rows);
        }
        case 'marketing': {
          const [leads, campaigns, leadRows] = await Promise.all([
            this.prisma.lead.count(),
            this.prisma.marketingCampaign.count(),
            this.prisma.lead.findMany({ select: { createdAt: true } }),
          ]);
          return pack(
            leads + campaigns,
            campaigns,
            leads,
            0,
            [
              { name: 'Leads', count: leads },
              { name: 'Campagnes', count: campaigns },
            ],
            leadRows,
          );
        }
        case 'seo': {
          const [total, rows] = await Promise.all([
            this.prisma.seoRedirect.count(),
            this.prisma.seoRedirect.findMany({ select: { createdAt: true } }),
          ]);
          return pack(total, total, 0, 0, [{ name: 'Redirections', count: total }], rows);
        }
        case 'support': {
          const [total, open, rows] = await Promise.all([
            this.prisma.supportTicket.count(),
            this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            this.prisma.supportTicket.findMany({ select: { createdAt: true } }),
          ]);
          return pack(
            total,
            total - open,
            open,
            open,
            [
              { name: 'Ouverts', count: open },
              { name: 'Clôturés', count: Math.max(0, total - open) },
            ],
            rows,
          );
        }
        case 'finance': {
          const [devis, accepted, rows] = await Promise.all([
            this.prisma.financeDevis.count(),
            this.prisma.financeDevis.count({ where: { status: 'ACCEPTED' } }),
            this.prisma.financeDevis.findMany({ select: { createdAt: true } }),
          ]);
          return pack(
            devis,
            accepted,
            devis - accepted,
            0,
            [
              { name: 'Devis', count: devis },
              { name: 'Acceptés (facturation)', count: accepted },
            ],
            rows,
          );
        }
        case 'securite': {
          const [total, active, rows] = await Promise.all([
            this.prisma.user.count({ where: { isTrashed: false } }),
            this.prisma.user.count({ where: { isTrashed: false, status: 'ACTIVE' } }),
            this.prisma.user.findMany({
              where: { isTrashed: false },
              select: { createdAt: true },
            }),
          ]);
          return pack(total, active, total - active, 0, [{ name: 'Comptes actifs', count: active }], rows);
        }
        case 'compagnie': {
          const [sites, teams, rows] = await Promise.all([
            this.prisma.clientSite.count(),
            this.prisma.rhTeam.count(),
            this.prisma.clientSite.findMany({ select: { createdAt: true } }),
          ]);
          return pack(
            sites + teams,
            sites,
            teams,
            0,
            [
              { name: 'Sites', count: sites },
              { name: 'Équipes', count: teams },
            ],
            rows,
          );
        }
        default: {
          const collab = await this.getCollaborateursStats(months);
          const total = Number(collab.kpis[0]?.trendValue ?? collab.kpis[0]?.value ?? 0);
          const active = Number(collab.kpis[0]?.value ?? 0);
          const absent = Number(collab.kpis[2]?.value ?? 0);
          const issues = Number(collab.kpis[3]?.value ?? 0);
          const rate = Number(String(collab.kpis[1]?.value ?? '100').replace('%', '')) || 100;
          return {
            totalCollaborators: total,
            activeCollaborators: active,
            absentCollaborators: absent,
            complianceRate: rate,
            complianceIssues: issues,
            categoryDistribution: collab.categoryDistribution ?? [],
            monthlyEvolution: (collab.monthlyEvolution ?? []).map((p) => ({
              date: p.date,
              count: p.count,
            })),
          };
        }
      }
    });
  }

  async getRhCertificationsStats(): Promise<{
    total: number;
    active: number;
    expiring: number;
    expired: number;
  }> {
    const cacheKey = 'stats:rh:certifications';
    return this.getCachedStats(cacheKey, async () => {
      const now = new Date();
      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() + 30);
      const [total, active, expiring, expired] = await Promise.all([
        this.prisma.userCertificate.count(),
        this.prisma.userCertificate.count({ where: { expiryDate: { gt: now } } }),
        this.prisma.userCertificate.count({
          where: { expiryDate: { gt: now, lte: threshold } },
        }),
        this.prisma.userCertificate.count({
          where: { OR: [{ expiryDate: { lte: now } }, { expiryDate: null }] },
        }),
      ]);
      return { total, active, expiring, expired };
    });
  }

  /**
   * Utilitaires de calcul communs
   */
  static toMonthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  static generateMonthlyTimeline(months: number = 12): { key: string; date: string }[] {
    const now = new Date();
    const timeline: { key: string; date: string }[] = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      timeline.push({
        key: this.toMonthKey(d),
        date: d.toISOString(),
      });
    }
    return timeline;
  }
}
