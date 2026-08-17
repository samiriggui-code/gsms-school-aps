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
    const p = (['day', 'week', 'month', 'quarter', 'year'].includes(period) ? period : 'month') as PilotagePeriod;
    const service = new PilotageHubService(this.prisma);
    const [payload, risks] = await Promise.all([
      service.getIndicateurs('gestion-ressources', p),
      service.getRisques('gestion-ressources'),
    ]);
    if (!payload) return null;

    const horizon30 = new Date(Date.now() + 30 * 86400000);

    const [equipmentRows, complianceRows, roomRows, maintenanceRows, absenceRows] = await Promise.all([
      this.prisma.equipment.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 40,
        select: {
          id: true,
          label: true,
          serialNumber: true,
          status: true,
          type: true,
          assignedSite: { select: { name: true } },
        },
      }),
      this.prisma.user.findMany({
        where: {
          isTrashed: false,
          status: 'ACTIVE',
          NOT: { role: { slug: { in: ['candidat', 'eleve'] } } },
        },
        orderBy: { lastName: 'asc' },
        take: 50,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobFunction: true,
          carteProExpiry: true,
          residencePermitExpiry: true,
        },
      }),
      this.prisma.formationVenueRoom.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        take: 25,
        select: { id: true, name: true, shortCode: true, capacity: true, isActive: true },
      }),
      this.prisma.equipmentMaintenance.findMany({
        where: { status: 'SCHEDULED', scheduledDate: { lte: horizon30 } },
        orderBy: { scheduledDate: 'asc' },
        take: 20,
        include: { equipment: { select: { label: true, serialNumber: true } } },
      }),
      this.prisma.rhAbsence.findMany({
        where: { endDate: { gte: new Date() }, status: 'APPROVED' },
        orderBy: { startDate: 'asc' },
        take: 20,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    const complianceStatus = (u: {
      carteProExpiry: Date | null;
      residencePermitExpiry: Date | null;
    }) => {
      const dates = [u.carteProExpiry, u.residencePermitExpiry].filter(Boolean) as Date[];
      if (!dates.length) return 'Non renseigné';
      const min = dates.reduce((a, b) => (a < b ? a : b));
      if (min <= new Date()) return 'Expiré';
      if (min <= horizon30) return 'Échéance < 30 j';
      return 'Conforme';
    };

    return {
      periodLabel: payload.period,
      kpis: payload.kpis.map((k) => ({ label: k.label, value: k.value, subtitle: k.subtitle })),
      evolution: payload.charts.evolution,
      evolutionTitle: payload.charts.evolutionTitle,
      distribution: payload.charts.distribution,
      distributionTitle: payload.charts.distributionTitle,
      secondaryDistribution: payload.charts.secondaryDistribution ?? [],
      secondaryDistributionTitle: payload.charts.secondaryDistributionTitle ?? 'Charge RH',
      methodology:
        'Synthèse ressources pour pilotage interne et pièces justificatives (Qualiopi critères 4–6 : moyens, qualification, déroulement). Données extraites du CRM à la date d’édition.',
      equipmentTable: equipmentRows.map((r) => ({
        id: r.id,
        label: r.label,
        serial: r.serialNumber,
        type: r.type ?? '—',
        status: r.status,
        site: r.assignedSite?.name ?? '—',
      })),
      complianceTable: complianceRows.map((r) => ({
        id: r.id,
        name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || r.email,
        function: r.jobFunction ?? '—',
        cartePro: r.carteProExpiry?.toLocaleDateString('fr-FR') ?? '—',
        permit: r.residencePermitExpiry?.toLocaleDateString('fr-FR') ?? '—',
        status: complianceStatus(r),
      })),
      roomsTable: roomRows.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.shortCode ?? '—',
        capacity: r.capacity ?? '—',
        status: r.isActive ? 'Active' : 'Inactive',
      })),
      maintenanceTable: maintenanceRows.map((r) => ({
        id: r.id,
        equipment: r.equipment.label,
        serial: r.equipment.serialNumber,
        scheduled: r.scheduledDate?.toLocaleDateString('fr-FR') ?? '—',
        title: r.title ?? 'Maintenance planifiée',
      })),
      absencesTable: absenceRows.map((r) => ({
        id: r.id,
        name:
          `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || r.user.email,
        from: r.startDate.toLocaleDateString('fr-FR'),
        to: r.endDate.toLocaleDateString('fr-FR'),
        type: r.type ?? '—',
      })),
      risksTable: (risks?.rows ?? []).map((r) => ({
        id: r.id,
        risk: r.risque,
        severity: r.gravite,
        exposure: r.exposition,
        measure: r.mesure,
      })),
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

    const [openCandidatures, upcomingSessions] = await Promise.all([
      this.prisma.candidature.findMany({
        where: { archivedAt: null, status: { notIn: ['COMPLETED', 'ARCHIVED', 'REJECTED'] } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          status: true,
          updatedAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          formation: { select: { name: true } },
        },
      }),
      this.prisma.formationSession.findMany({
        where: { endDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
        take: 15,
        select: {
          startDate: true,
          endDate: true,
          formation: { select: { name: true } },
          venueRoom: { select: { name: true } },
          _count: { select: { participants: true } },
        },
      }),
    ]);

    return {
      summary: digest.summary,
      methodology:
        'Bilan opérationnel hebdomadaire : activité pédagogique, pipeline candidatures et alertes à traiter. Document transmissible en comité de pilotage ou en annexe financeur.',
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
      financeHighlights: (digest.finance.kpis ?? []).slice(0, 4).map((k) => ({
        label: k.label,
        value: String(k.value),
      })),
      candidaturesTable: openCandidatures.map((c, i) => ({
        id: String(i),
        candidate:
          `${c.user.firstName ?? ''} ${c.user.lastName ?? ''}`.trim() || c.user.email,
        formation: c.formation?.name ?? '—',
        status: c.status,
        updated: c.updatedAt.toLocaleDateString('fr-FR'),
      })),
      sessionsTable: upcomingSessions.map((s, i) => ({
        id: String(i),
        formation: s.formation?.name ?? '—',
        dates:
          [s.startDate, s.endDate]
            .filter(Boolean)
            .map((d) => d!.toLocaleDateString('fr-FR'))
            .join(' → ') || '—',
        room: s.venueRoom?.name ?? '—',
        participants: s._count.participants,
      })),
    };
  }

  async loadFinanceMonthly() {
    const digest = await fetchFinanceMonthlyDigest(this.prisma);

    const pipelineDevis = await this.prisma.financeDevis.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 25,
      select: {
        referenceCode: true,
        title: true,
        status: true,
        totalTtc: true,
        currency: true,
        updatedAt: true,
        lead: { select: { email: true } },
      },
    });

    return {
      summary: digest.summary,
      methodology:
        'Synthèse financière mensuelle pour pilotage interne et organismes financeurs (OPCO, Pôle emploi, entreprises). Inclut encaissements, impayés et pipeline commercial.',
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
      overdueRows: digest.overdue.items.slice(0, 30).map((item) => ({
        reference: item.referenceCode,
        title: item.title,
        amount: `${item.amountDue.toFixed(2)} ${item.currency}`,
        daysOverdue: item.daysOverdue,
        candidate: item.candidateName ?? '—',
      })),
      pipelineTable: pipelineDevis.map((d) => ({
        id: d.referenceCode,
        reference: d.referenceCode,
        title: d.title,
        status: d.status,
        amount: `${Number(d.totalTtc).toFixed(2)} ${d.currency}`,
        lead: d.lead?.email ?? '—',
        updated: d.updatedAt.toLocaleDateString('fr-FR'),
      })),
    };
  }

  async loadQualiopiChecklist() {
    const digest = await fetchQualiopiChecklistDigest(this.prisma);

    const [formations, sessions, trainers, candidaturesRecent, satisfactionRows] = await Promise.all([
      this.prisma.formation.findMany({
        where: { status: 'ACTIVE' },
        take: 15,
        orderBy: { name: 'asc' },
        select: {
          name: true,
          duration: true,
          qualiopiCertified: true,
          cpfEligible: true,
          clientSatisfactionRate: true,
        },
      }),
      this.prisma.formationSession.findMany({
        orderBy: { startDate: 'desc' },
        take: 20,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          formation: { select: { name: true } },
          trainer: { select: { firstName: true, lastName: true } },
          _count: { select: { participants: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { isTrashed: false, role: { slug: 'formateur' } },
        take: 20,
        orderBy: { lastName: 'asc' },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          carteProExpiry: true,
          qualification: true,
        },
      }),
      this.prisma.candidature.findMany({
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 15,
        select: {
          status: true,
          updatedAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          formation: { select: { name: true } },
        },
      }),
      this.prisma.formation.findMany({
        where: { clientSatisfactionRate: { not: null } },
        take: 10,
        select: { name: true, clientSatisfactionRate: true, successRate: true },
      }),
    ]);

    const rnmCriteria = [
      {
        id: 1,
        title: 'Information du public',
        indicators: 'Ind. 1–3',
        objectif: 'Transparence sur les prestations, tarifs, délais et résultats attendus.',
      },
      {
        id: 2,
        title: 'Identification des objectifs',
        indicators: 'Ind. 4–6',
        objectif: 'Adéquation des objectifs aux publics et évaluation des acquis.',
      },
      {
        id: 3,
        title: 'Adaptation aux publics',
        indicators: 'Ind. 7–9',
        objectif: 'Positionnement, accompagnement et accessibilité des parcours.',
      },
      {
        id: 4,
        title: 'Moyens pédagogiques',
        indicators: 'Ind. 10–12',
        objectif: 'Salles, matériels et ressources pédagogiques adaptés.',
      },
      {
        id: 5,
        title: 'Qualification du personnel',
        indicators: 'Ind. 13–15',
        objectif: 'Compétences, habilitations et veille des formateurs.',
      },
      {
        id: 6,
        title: 'Inscription et déroulement',
        indicators: 'Ind. 16–21',
        objectif: 'Conditions d’accès, émargement, suivi et évaluation.',
      },
      {
        id: 7,
        title: 'Recueil des appréciations',
        indicators: 'Ind. 22–25',
        objectif: 'Satisfaction, réclamations et actions d’amélioration.',
      },
    ];

    return {
      quarter: digest.quarter,
      year: digest.year,
      summary: digest.summary,
      methodology:
        'Document de revue qualité aligné sur le référentiel national qualité (RNQ) et la certification Qualiopi. Destiné aux audits internes, financeurs (OPCO, Pôle emploi, entreprises) et partenaires institutionnels.',
      indicators: digest.indicators.map((i) => ({
        id: i.id,
        label: i.label,
        status: i.status,
        detail: i.detail,
      })),
      rnmCriteria,
      formationsTable: formations.map((f, i) => ({
        id: String(i),
        name: f.name,
        duration: f.duration.slice(0, 80),
        qualiopi: f.qualiopiCertified ? 'Oui' : 'Non',
        cpf: f.cpfEligible ? 'Oui' : 'Non',
        satisfaction:
          f.clientSatisfactionRate != null
            ? `${Number(f.clientSatisfactionRate).toFixed(0)} %`
            : '—',
      })),
      sessionsTable: sessions.map((s) => ({
        id: s.id,
        formation: s.formation?.name ?? '—',
        period:
          [s.startDate, s.endDate]
            .filter(Boolean)
            .map((d) => d!.toLocaleDateString('fr-FR'))
            .join(' → ') || '—',
        trainer:
          [s.trainer?.firstName, s.trainer?.lastName].filter(Boolean).join(' ').trim() || '—',
        participants: s._count.participants,
      })),
      trainersTable: trainers.map((t, i) => ({
        id: String(i),
        name: `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.email,
        qualification: t.qualification ?? '—',
        cartePro: t.carteProExpiry?.toLocaleDateString('fr-FR') ?? '—',
        status:
          t.carteProExpiry && t.carteProExpiry >= new Date() ? 'Valide' : 'À vérifier',
      })),
      candidaturesTable: candidaturesRecent.map((c, i) => ({
        id: String(i),
        candidate:
          `${c.user.firstName ?? ''} ${c.user.lastName ?? ''}`.trim() || c.user.email,
        formation: c.formation?.name ?? '—',
        status: c.status,
        updated: c.updatedAt.toLocaleDateString('fr-FR'),
      })),
      satisfactionTable: satisfactionRows.map((f, i) => ({
        id: String(i),
        formation: f.name,
        satisfaction:
          f.clientSatisfactionRate != null
            ? `${Number(f.clientSatisfactionRate).toFixed(1)} %`
            : '—',
        success:
          f.successRate != null ? `${Number(f.successRate).toFixed(1)} %` : '—',
      })),
    };
  }
}
