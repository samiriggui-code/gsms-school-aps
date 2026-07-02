import type { PrismaClient } from '@repo/database';
import { PilotageHubService, type PilotagePeriod } from './pilotage-hub';
import {
  fetchFinanceMonthlyDigest,
  fetchOpsWeeklyDigest,
  fetchQualiopiChecklistDigest,
} from './workflows/n8n-automation-data';

function str(v: unknown): string {
  if (v == null) return '—';
  if (v instanceof Date) return v.toLocaleDateString('fr-FR');
  return String(v);
}

function contractLabel(t: string | null | undefined): string {
  if (!t) return '—';
  const map: Record<string, string> = {
    CDI: 'CDI',
    CDD: 'CDD',
    INTERIM: 'Intérim',
    STAGE: 'Stage',
  };
  return map[t] ?? t;
}

export class ReportDataService {
  constructor(private readonly prisma: PrismaClient) {}

  async loadPilotageIndicateurs(period: string) {
    const p = (['day', 'week', 'month', 'year'].includes(period) ? period : 'month') as PilotagePeriod;
    const service = new PilotageHubService(this.prisma);
    const payload = await service.getIndicateurs('gestion-ressources', p);
    if (!payload) return null;
    return {
      kpis: payload.kpis,
      evolution: payload.charts.evolution,
      evolutionTitle: payload.charts.evolutionTitle,
      distribution: payload.charts.distribution,
      distributionTitle: payload.charts.distributionTitle,
    };
  }

  async loadEmargementSession(sessionId: string) {
    const session = await this.prisma.formationSession.findUnique({
      where: { id: sessionId },
      include: {
        formation: { select: { name: true } },
        trainer: { select: { firstName: true, lastName: true, email: true } },
        venueRoom: { select: { name: true } },
        participants: {
          include: {
            user: {
              select: { firstName: true, lastName: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!session) return null;

    const trainerName =
      [session.trainer?.firstName, session.trainer?.lastName].filter(Boolean).join(' ').trim() ||
      session.trainer?.email ||
      '—';
    const sessionLabel = session.dateDisplayLabel || session.sessionSubtitle || session.id.slice(0, 8);
    const attendanceDate = (session.startDate ?? new Date()).toISOString().slice(0, 10);

    return {
      formationName: session.formation?.name ?? 'Formation',
      sessionLabel,
      location: session.venueRoom?.name || session.location || '—',
      trainerName,
      attendanceDate,
      slotLabel: 'Journée',
      participants: session.participants.map((p, i) => ({
        index: i + 1,
        name:
          p.user.name?.trim() ||
          [p.user.firstName, p.user.lastName].filter(Boolean).join(' ').trim() ||
          p.user.email,
        email: p.user.email,
        avatarUrl: p.user.avatar,
      })),
    };
  }

  async loadFicheCandidat(candidatureId: string) {
    const c = await this.prisma.candidature.findUnique({
      where: { id: candidatureId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            birthDate: true,
            city: true,
            postalCode: true,
          },
        },
        formation: { select: { name: true } },
        interestedSession: { select: { dateDisplayLabel: true, sessionSubtitle: true, startDate: true } },
      },
    });
    if (!c) return null;

    const fullName = [c.user.firstName, c.user.lastName].filter(Boolean).join(' ').trim() || c.user.email;

    return {
      fullName,
      email: c.user.email,
      phone: c.user.phone ?? '—',
      status: c.status,
      source: c.source,
      formationName: c.formation?.name ?? '—',
      sessionLabel: c.interestedSession?.dateDisplayLabel ?? c.interestedSession?.sessionSubtitle ?? '—',
      birthDate: c.user.birthDate?.toLocaleDateString('fr-FR') ?? '—',
      address: [c.user.postalCode, c.user.city].filter(Boolean).join(' ') || '—',
      notes: c.notes ?? '',
      createdAt: c.createdAt.toLocaleDateString('fr-FR'),
      rows: [
        { section: 'Identité', label: 'Nom complet', value: fullName },
        { section: 'Identité', label: 'Email', value: c.user.email },
        { section: 'Identité', label: 'Téléphone', value: str(c.user.phone) },
        { section: 'Identité', label: 'Naissance', value: str(c.user.birthDate) },
        { section: 'Identité', label: 'Adresse', value: [c.user.postalCode, c.user.city].filter(Boolean).join(' ') || '—' },
        { section: 'Formation', label: 'Formation visée', value: c.formation?.name ?? '—' },
        { section: 'Formation', label: 'Session', value: c.interestedSession?.dateDisplayLabel ?? '—' },
        { section: 'Pipeline', label: 'Statut', value: c.status },
        { section: 'Pipeline', label: 'Source', value: c.source },
        { section: 'Pipeline', label: 'Créé le', value: c.createdAt.toLocaleDateString('fr-FR') },
        { section: 'Notes', label: 'Commentaires', value: c.notes ?? '—' },
      ],
    };
  }

  async loadContratTravail(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId, isTrashed: false },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobFunction: true,
        qualification: true,
        contractType: true,
        workTimeType: true,
        contractStartDate: true,
        contractEndDate: true,
        address: true,
        city: true,
        postalCode: true,
        socialSecurityNumber: true,
        carteProNumber: true,
        carteProExpiry: true,
      },
    });
    if (!u) return null;

    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
    const workTime =
      u.workTimeType === 'FULL_TIME' ? 'Temps plein' : u.workTimeType === 'PART_TIME' ? 'Temps partiel' : '—';

    return {
      fullName,
      email: u.email,
      jobFunction: u.jobFunction ?? '—',
      qualification: u.qualification ?? '—',
      contractType: contractLabel(u.contractType),
      workTime,
      contractStartDate: str(u.contractStartDate),
      contractEndDate: str(u.contractEndDate),
      address: [u.address, u.postalCode, u.city].filter(Boolean).join(', ') || '—',
      nir: u.socialSecurityNumber ? '•••••••••••' : '—',
      cartePro: u.carteProNumber ?? '—',
      carteProExpiry: str(u.carteProExpiry),
      rows: [
        { label: 'Salarié', value: fullName },
        { label: 'Email', value: u.email },
        { label: 'Fonction', value: u.jobFunction ?? '—' },
        { label: 'Qualification', value: u.qualification ?? '—' },
        { label: 'Type de contrat', value: contractLabel(u.contractType) },
        { label: 'Temps de travail', value: workTime },
        { label: 'Date début', value: str(u.contractStartDate) },
        { label: 'Date fin', value: str(u.contractEndDate) },
        { label: 'Adresse', value: [u.address, u.postalCode, u.city].filter(Boolean).join(', ') || '—' },
        { label: 'Carte pro', value: u.carteProNumber ?? '—' },
        { label: 'Échéance carte pro', value: str(u.carteProExpiry) },
      ],
    };
  }

  async loadFicheCollaborateur(userId: string) {
    return this.loadContratTravail(userId);
  }

  async loadGrConformite() {
    const horizon7 = new Date(Date.now() + 7 * 86400000);
    const horizon30 = new Date(Date.now() + 30 * 86400000);

    const [criticalUsers, soonUsers, missingItems, expiredItems] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          isTrashed: false,
          OR: [
            { carteProExpiry: { lte: horizon7 } },
            { residencePermitExpiry: { lte: horizon7 } },
          ],
        },
        take: 50,
        orderBy: { carteProExpiry: 'asc' },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          jobFunction: true,
          carteProExpiry: true,
          residencePermitExpiry: true,
        },
      }),
      this.prisma.user.findMany({
        where: {
          isTrashed: false,
          OR: [
            { carteProExpiry: { gt: horizon7, lte: horizon30 } },
            { residencePermitExpiry: { gt: horizon7, lte: horizon30 } },
          ],
        },
        take: 50,
        select: {
          firstName: true,
          lastName: true,
          email: true,
          carteProExpiry: true,
          residencePermitExpiry: true,
        },
      }),
      this.prisma.complianceDossierItem.count({
        where: { required: true, status: { in: ['MISSING', 'REJECTED'] } },
      }),
      this.prisma.complianceDossierItem.count({
        where: { required: true, status: 'EXPIRED' },
      }),
    ]);

    return {
      kpis: [
        { label: 'Échéances < 7 j', value: criticalUsers.length, subtitle: 'Action immédiate' },
        { label: 'Échéances < 30 j', value: soonUsers.length, subtitle: 'À planifier' },
        { label: 'Pièces manquantes', value: missingItems, subtitle: 'Dossiers incomplets' },
        { label: 'Pièces expirées', value: expiredItems, subtitle: 'À renouveler' },
      ],
      criticalRows: criticalUsers.map((u) => ({
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
        email: u.email,
        function: u.jobFunction ?? '—',
        carteProExpiry: u.carteProExpiry?.toLocaleDateString('fr-FR') ?? '—',
        permitExpiry: u.residencePermitExpiry?.toLocaleDateString('fr-FR') ?? '—',
      })),
      soonRows: soonUsers.map((u) => ({
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
        email: u.email,
        carteProExpiry: u.carteProExpiry?.toLocaleDateString('fr-FR') ?? '—',
        permitExpiry: u.residencePermitExpiry?.toLocaleDateString('fr-FR') ?? '—',
      })),
    };
  }

  async loadOpsWeekly() {
    const digest = await fetchOpsWeeklyDigest(this.prisma);
    return {
      summary: digest.summary,
      kpis: [
        { label: 'Sessions actives', value: digest.activeSessions, subtitle: 'En cours ou récentes' },
        {
          label: 'Candidatures ouvertes',
          value: digest.candidaturesOpen,
          subtitle: 'Pipeline actif',
        },
        {
          label: 'Émargements non signés',
          value: digest.pedagogyToday.totalUnsigned,
          subtitle: "Aujourd'hui",
        },
        {
          label: 'Absences non justifiées',
          value: digest.pedagogyToday.totalUnjustifiedAbsences,
          subtitle: "Aujourd'hui",
        },
      ],
      financeHighlights: (digest.finance.kpis ?? []).slice(0, 2).map((k) => ({
        label: k.label,
        value: String(k.value),
      })),
    };
  }

  async loadFinanceMonthly() {
    const digest = await fetchFinanceMonthlyDigest(this.prisma);
    return {
      summary: digest.summary,
      kpis: [
        { label: 'CA encaissé', value: `${digest.caMonth.toFixed(2)} €`, subtitle: 'Mois en cours' },
        { label: 'Paiements', value: digest.paymentCount, subtitle: 'Encaissements reçus' },
        { label: 'Impayés', value: digest.overdue.count, subtitle: 'Devis avec solde dû' },
        {
          label: 'Relances >15j',
          value: digest.overdue.items.filter((i) => i.daysOverdue >= 15).length,
          subtitle: 'À relancer',
        },
      ],
      overdueRows: digest.overdue.items.slice(0, 20).map((item) => ({
        reference: item.referenceCode,
        title: item.title,
        amount: `${item.amountDue.toFixed(2)} ${item.currency}`,
        daysOverdue: item.daysOverdue,
        candidate: item.candidateName ?? '—',
      })),
    };
  }

  async loadQualiopiChecklist() {
    const digest = await fetchQualiopiChecklistDigest(this.prisma);
    return {
      quarter: digest.quarter,
      year: digest.year,
      summary: digest.summary,
      indicators: digest.indicators.map((i) => ({
        id: i.id,
        label: i.label,
        status: i.status,
        detail: i.detail,
      })),
    };
  }
}
