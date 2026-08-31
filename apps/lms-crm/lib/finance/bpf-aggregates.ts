import type { FundingCaseStatus, PrismaClient } from '@repo/database';

/** Heures proxy par créneau émargé PRESENT/LATE (matin ou soir). Documenté dans methodology. */
export const BPF_HOURS_PER_SLOT = 3.5;

/** Statuts où le montant accordé compte pour le BPF (post-décision financeur). */
export const BPF_APPROVED_STATUSES: FundingCaseStatus[] = [
  'APPROVED',
  'PARTIALLY_APPROVED',
  'SERVICE_IN_PROGRESS',
  'SERVICE_COMPLETED',
  'JUSTIFICATION_REQUIRED',
  'READY_TO_INVOICE',
  'INVOICED',
  'PAYMENT_PENDING',
  'PAID',
  'CLOSED',
];

export type BpfControl = {
  code: string;
  severity: 'info' | 'warn';
  message: string;
};

export type BpfFunderRow = {
  funderType: string;
  cases: number;
  requested: number;
  approved: number;
};

export type BpfAggregates = {
  year: number;
  periodStart: string;
  periodEnd: string;
  stagiairesCount: number;
  sessionsCount: number;
  hoursCatalog: number;
  hoursAttendedProxy: number;
  fundingCasesCount: number;
  amountRequested: number;
  amountApproved: number;
  byFunderType: BpfFunderRow[];
  controls: BpfControl[];
  methodology: string[];
};

function yearBounds(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sessionOverlapsYear(
  startDate: Date | null,
  endDate: Date | null,
  yearStart: Date,
  yearEnd: Date,
): boolean {
  const start = startDate ?? endDate;
  const end = endDate ?? startDate;
  if (!start && !end) return false;
  const s = start ?? end!;
  const e = end ?? start!;
  return s <= yearEnd && e >= yearStart;
}

/**
 * Agrégats BPF déterministes (G11) — pas de LLM, pas de PDF Cerfa.
 * Sources : FormationSession / Participant / Emargement / FundingCase.
 */
export async function buildBpfAggregates(
  prisma: PrismaClient,
  year: number,
): Promise<BpfAggregates> {
  const { start: yearStart, end: yearEnd } = yearBounds(year);

  const [sessions, sessionsWithoutDates] = await Promise.all([
    prisma.formationSession.findMany({
      where: {
        OR: [
          { startDate: { gte: yearStart, lte: yearEnd } },
          { endDate: { gte: yearStart, lte: yearEnd } },
          {
            AND: [{ startDate: { lte: yearStart } }, { endDate: { gte: yearEnd } }],
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        formation: { select: { hoursMin: true, hoursMax: true } },
        participants: {
          where: { enrollmentStatus: { not: 'CANCELLED' } },
          select: {
            id: true,
            userId: true,
            emargements: {
              where: {
                status: { in: ['PRESENT', 'LATE'] },
                day: { dayDate: { gte: yearStart, lte: yearEnd } },
              },
              select: { id: true },
            },
          },
        },
      },
    }),
    // Contrôle qualité : hors filtre année (dates nulles ne matchent aucun exercice).
    prisma.formationSession.count({
      where: { startDate: null, endDate: null },
    }),
  ]);

  const sessionsInYear = sessions.filter((s) =>
    sessionOverlapsYear(s.startDate, s.endDate, yearStart, yearEnd),
  );

  const stagiaireIds = new Set<string>();
  let hoursCatalog = 0;
  let attendedSlots = 0;
  let sessionsDatesIncoherent = 0;
  let zeroHoursFormationSessions = 0;

  for (const session of sessionsInYear) {
    if (
      session.startDate &&
      session.endDate &&
      session.endDate.getTime() < session.startDate.getTime()
    ) {
      sessionsDatesIncoherent += 1;
    }

    const hoursMin = session.formation.hoursMin;
    const hoursMax = session.formation.hoursMax;
    const hours = hoursMin ?? hoursMax ?? 0;
    const catalogUndefined =
      (hoursMin == null || hoursMin === 0) && (hoursMax == null || hoursMax === 0);

    if (catalogUndefined && session.participants.length > 0) {
      zeroHoursFormationSessions += 1;
    }

    for (const p of session.participants) {
      stagiaireIds.add(p.userId);
      hoursCatalog += hours;
      attendedSlots += p.emargements.length;
    }
  }

  const hoursAttendedProxy = attendedSlots * BPF_HOURS_PER_SLOT;

  const fundingCases = await prisma.fundingCase.findMany({
    where: {
      OR: [
        { createdAt: { gte: yearStart, lte: yearEnd } },
        {
          session: {
            OR: [
              { startDate: { gte: yearStart, lte: yearEnd } },
              { endDate: { gte: yearStart, lte: yearEnd } },
            ],
          },
        },
      ],
    },
    select: {
      status: true,
      funderType: true,
      requestedAmount: true,
      approvedAmount: true,
    },
  });

  let amountRequested = 0;
  let amountApproved = 0;
  const byType = new Map<string, BpfFunderRow>();
  let approvedMissingAmount = 0;
  let approvedOverRequested = 0;

  for (const c of fundingCases) {
    const requested = toNumber(c.requestedAmount);
    const approved = toNumber(c.approvedAmount);
    amountRequested += requested;
    const countsAsApproved = BPF_APPROVED_STATUSES.includes(c.status);
    if (countsAsApproved) {
      amountApproved += approved;
      if (c.approvedAmount == null) approvedMissingAmount += 1;
    }
    if (c.approvedAmount != null && approved > requested) {
      approvedOverRequested += 1;
    }

    const row = byType.get(c.funderType) ?? {
      funderType: c.funderType,
      cases: 0,
      requested: 0,
      approved: 0,
    };
    row.cases += 1;
    row.requested += requested;
    if (countsAsApproved) row.approved += approved;
    byType.set(c.funderType, row);
  }

  const controls: BpfControl[] = [];
  if (sessionsInYear.length === 0 && fundingCases.length === 0) {
    controls.push({
      code: 'EMPTY_YEAR',
      severity: 'info',
      message: `Aucune session ni FundingCase pour ${year} — agrégats à zéro attendus.`,
    });
  }
  if (sessionsWithoutDates > 0) {
    controls.push({
      code: 'SESSION_NO_DATES',
      severity: 'warn',
      message: `${sessionsWithoutDates} session(s) sans startDate ni endDate — exclues de tout exercice BPF (comptage global, hors filtre année).`,
    });
  }
  if (hoursCatalog > 0 && hoursAttendedProxy === 0 && stagiaireIds.size > 0) {
    controls.push({
      code: 'NO_EMARGEMENT',
      severity: 'warn',
      message: 'Heures catalogue > 0 mais aucun émargement PRESENT/LATE sur la période.',
    });
  }
  if (approvedMissingAmount > 0) {
    controls.push({
      code: 'APPROVED_AMOUNT_NULL',
      severity: 'warn',
      message: `${approvedMissingAmount} dossier(s) post-approbation sans approvedAmount.`,
    });
  }
  if (hoursCatalog > 0 && hoursAttendedProxy > hoursCatalog) {
    controls.push({
      code: 'HOURS_OVER_CATALOG',
      severity: 'warn',
      message: `Heures émargées (proxy ${Math.round(hoursAttendedProxy * 10) / 10} h) > heures catalogue (${hoursCatalog} h) — possible double émargement ou hoursMin/Max sous-estimés.`,
    });
  }
  if (approvedOverRequested > 0) {
    controls.push({
      code: 'APPROVED_OVER_REQUESTED',
      severity: 'warn',
      message: `${approvedOverRequested} dossier(s) FundingCase avec approvedAmount > requestedAmount.`,
    });
  }
  if (sessionsDatesIncoherent > 0) {
    controls.push({
      code: 'SESSION_DATES_INCOHERENT',
      severity: 'warn',
      message: `${sessionsDatesIncoherent} session(s) avec endDate < startDate sur l’exercice ${year}.`,
    });
  }
  if (zeroHoursFormationSessions > 0) {
    controls.push({
      code: 'ZERO_HOURS_FORMATION',
      severity: 'warn',
      message: `${zeroHoursFormationSessions} session(s) avec stagiaires mais Formation.hoursMin/hoursMax nuls ou 0 — heures catalogue non fiables.`,
    });
  }

  return {
    year,
    periodStart: yearStart.toISOString().slice(0, 10),
    periodEnd: yearEnd.toISOString().slice(0, 10),
    stagiairesCount: stagiaireIds.size,
    sessionsCount: sessionsInYear.length,
    hoursCatalog,
    hoursAttendedProxy: Math.round(hoursAttendedProxy * 10) / 10,
    fundingCasesCount: fundingCases.length,
    amountRequested: Math.round(amountRequested * 100) / 100,
    amountApproved: Math.round(amountApproved * 100) / 100,
    byFunderType: [...byType.values()].sort((a, b) => a.funderType.localeCompare(b.funderType)),
    controls,
    methodology: [
      'Stagiaires = userId distincts avec enrollmentStatus ≠ CANCELLED sur sessions chevauchant l’année.',
      'Heures catalogue = sum(Formation.hoursMin ?? hoursMax) par inscription non annulée.',
      `Heures émargées (proxy) = créneaux PRESENT|LATE × ${BPF_HOURS_PER_SLOT} h (pas la durée réelle du créneau).`,
      'Montants funding = FundingCase de l’année (createdAt ou session liée) ; approvedAmount si statut post-approbation.',
      'Garde-fous erreur_ctrl (OF-07) : HOURS_OVER_CATALOG, APPROVED_OVER_REQUESTED, SESSION_DATES_INCOHERENT, ZERO_HOURS_FORMATION.',
      'Export PDF synthèse disponible (OF-07) — pas un Cerfa 10443 pixel-perfect.',
    ],
  };
}
