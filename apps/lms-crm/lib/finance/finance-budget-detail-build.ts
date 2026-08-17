import type { PrismaClient } from '@repo/database';
import { financeDecimalNum } from '@/lib/finance/finance-decimal';
import { budgetCategoryForPayment } from '@/lib/finance/finance-budget-sync';
import {
  equipmentAnnualAmortization,
  parseEquipmentFinanceMeta,
} from '@/lib/equipment-finance';

const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

const TRACK_LABELS: Record<string, string> = {
  surete: 'Pôle Sûreté',
  incendie: 'Pôle Incendie',
  habilitation: 'Pôle Habilitation',
  sst: 'Pôle SST',
  entreprise: 'Pôle Entreprise',
  autres: 'Autres formations',
};

function equipmentAcquisitionCost(metadata: unknown): number {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 0;
  const raw = (metadata as Record<string, unknown>).acquisitionCost;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export type FinanceBudgetMonthlySlice = {
  month: number;
  label: string;
  planned: number;
  actual: number;
  consumptionPct: number;
};

export type FinanceBudgetPoleSlice = {
  poleId: string;
  label: string;
  planned: number;
  actual: number;
  sharePct: number;
  headcount?: number;
  detail?: string;
};

export type FinanceBudgetMovement = {
  id: string;
  kind: 'payment' | 'devis' | 'inventory';
  reference: string;
  label: string;
  amount: number;
  status: string;
  date: string | null;
};

export type FinanceBudgetLineDetail = {
  line: {
    id: string;
    label: string;
    category: string;
    periodYear: number;
    periodMonth: number | null;
    plannedAmount: number;
    actualAmount: number;
    currency: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    ecart: number;
    consumptionPct: number;
    periodLabel: string;
  };
  summary: {
    siblingLines: number;
    movementCount: number;
    poleCount: number;
  };
  monthlySlices: FinanceBudgetMonthlySlice[];
  poleSlices: FinanceBudgetPoleSlice[];
  movements: FinanceBudgetMovement[];
  relatedLines: {
    id: string;
    label: string;
    periodMonth: number | null;
    plannedAmount: number;
    actualAmount: number;
  }[];
};

async function paymentsForCategoryYear(
  prisma: PrismaClient,
  category: string,
  year: number,
) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const payments = await prisma.financePayment.findMany({
    where: {
      OR: [
        { paidAt: { gte: yearStart, lt: yearEnd } },
        { paidAt: null, updatedAt: { gte: yearStart, lt: yearEnd } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      referenceCode: true,
      amount: true,
      status: true,
      paidAt: true,
      updatedAt: true,
      method: true,
      devis: {
        select: {
          referenceCode: true,
          title: true,
          formationId: true,
          notes: true,
          formation: { select: { track: true, name: true } },
        },
      },
    },
  });

  return payments.filter((p) => budgetCategoryForPayment(p.devis) === category);
}

function buildMonthlySlices(
  line: { plannedAmount: number; actualAmount: number; periodMonth: number | null },
  year: number,
  payments: Awaited<ReturnType<typeof paymentsForCategoryYear>>,
  relatedLines: { periodMonth: number | null; plannedAmount: number; actualAmount: number }[],
): FinanceBudgetMonthlySlice[] {
  const monthlyPlanned = new Map<number, number>();
  for (let m = 1; m <= 12; m += 1) {
    monthlyPlanned.set(m, 0);
  }

  if (line.periodMonth != null) {
    monthlyPlanned.set(line.periodMonth, line.plannedAmount);
  } else {
    const fromSiblings = relatedLines.filter((r) => r.periodMonth != null);
    if (fromSiblings.length > 0) {
      for (const r of fromSiblings) {
        if (r.periodMonth != null) monthlyPlanned.set(r.periodMonth, r.plannedAmount);
      }
    } else {
      const perMonth = line.plannedAmount / 12;
      for (let m = 1; m <= 12; m += 1) monthlyPlanned.set(m, perMonth);
    }
  }

  const monthlyActual = new Map<number, number>();
  for (let m = 1; m <= 12; m += 1) monthlyActual.set(m, 0);

  for (const p of payments) {
    if (p.status !== 'RECEIVED') continue;
    const when = p.paidAt ?? p.updatedAt;
    if (when.getFullYear() !== year) continue;
    const m = when.getMonth() + 1;
    monthlyActual.set(m, (monthlyActual.get(m) ?? 0) + financeDecimalNum(p.amount));
  }

  if (line.periodMonth != null && line.actualAmount > 0 && (monthlyActual.get(line.periodMonth) ?? 0) === 0) {
    monthlyActual.set(line.periodMonth, line.actualAmount);
  }

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const planned = round2(monthlyPlanned.get(month) ?? 0);
    const actual = round2(monthlyActual.get(month) ?? 0);
    return {
      month,
      label: MONTH_LABELS[i],
      planned,
      actual,
      consumptionPct: planned > 0 ? Math.round((actual / planned) * 100) : 0,
    };
  });
}

async function buildFormationPoleSlices(
  prisma: PrismaClient,
  line: { plannedAmount: number; actualAmount: number },
  payments: Awaited<ReturnType<typeof paymentsForCategoryYear>>,
): Promise<FinanceBudgetPoleSlice[]> {
  const tracks = await prisma.formation.groupBy({
    by: ['track'],
    _count: { _all: true },
  });
  const totalFormations = tracks.reduce((s, t) => s + t._count._all, 0) || 1;

  const actualByTrack = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== 'RECEIVED') continue;
    const track = p.devis?.formation?.track ?? 'autres';
    actualByTrack.set(track, (actualByTrack.get(track) ?? 0) + financeDecimalNum(p.amount));
  }

  return tracks.map((t) => {
    const share = t._count._all / totalFormations;
    const planned = round2(line.plannedAmount * share);
    const actual = round2(actualByTrack.get(t.track) ?? 0);
    const totalActual = line.actualAmount || Array.from(actualByTrack.values()).reduce((a, b) => a + b, 0);
    return {
      poleId: t.track,
      label: TRACK_LABELS[t.track] ?? t.track,
      planned,
      actual,
      sharePct: totalActual > 0 ? Math.round((actual / totalActual) * 100) : Math.round(share * 100),
      headcount: t._count._all,
      detail: `${t._count._all} formation(s) catalogue`,
    };
  });
}

async function buildRhPoleSlices(
  prisma: PrismaClient,
  line: { plannedAmount: number; actualAmount: number },
): Promise<FinanceBudgetPoleSlice[]> {
  const poles = await prisma.rhOrgUnit.findMany({
    where: { type: 'POLE' },
    include: {
      teams: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  formateurProfile: { select: { hourlyRate: true } },
                  collaborateurProfile: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  if (poles.length === 0) {
    const teams = await prisma.rhTeam.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { formateurProfile: { select: { hourlyRate: true } } },
            },
          },
        },
        orgUnit: { select: { id: true, name: true } },
      },
    });
    const byName = new Map<string, { headcount: number; rateSum: number }>();
    for (const team of teams) {
      const label = team.orgUnit?.name ?? team.name;
      const cur = byName.get(label) ?? { headcount: 0, rateSum: 0 };
      for (const m of team.members) {
        cur.headcount += 1;
        const rate = m.user.formateurProfile?.hourlyRate;
        if (typeof rate === 'number' && rate > 0) cur.rateSum += rate;
      }
      byName.set(label, cur);
    }
    const entries = Array.from(byName.entries());
    const totalWeight = entries.reduce((s, [, v]) => s + (v.rateSum || v.headcount), 0) || 1;
    return entries.map(([label, v], i) => {
      const weight = v.rateSum || v.headcount;
      const share = weight / totalWeight;
      return {
        poleId: `team-${i}`,
        label,
        planned: round2(line.plannedAmount * share),
        actual: round2(line.actualAmount * share),
        sharePct: Math.round(share * 100),
        headcount: v.headcount,
        detail: v.rateSum > 0 ? `Charge estimée (taux horaires)` : `Prorata effectifs`,
      };
    });
  }

  const weights = poles.map((pole) => {
    let headcount = 0;
    let rateSum = 0;
    for (const team of pole.teams) {
      for (const m of team.members) {
        headcount += 1;
        const rate = m.user.formateurProfile?.hourlyRate;
        if (typeof rate === 'number' && rate > 0) rateSum += rate;
      }
    }
    return { pole, headcount, rateSum, weight: rateSum || headcount || 1 };
  });
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0) || 1;

  return weights.map(({ pole, headcount, rateSum, weight }) => {
    const share = weight / totalWeight;
    return {
      poleId: pole.id,
      label: pole.name,
      planned: round2(line.plannedAmount * share),
      actual: round2(line.actualAmount * share),
      sharePct: Math.round(share * 100),
      headcount,
      detail: rateSum > 0 ? 'Répartition selon masse salariale horaire' : 'Répartition au prorata des effectifs',
    };
  });
}

async function buildEquipmentPoleSlices(
  prisma: PrismaClient,
  line: { plannedAmount: number; actualAmount: number },
  payments: Awaited<ReturnType<typeof paymentsForCategoryYear>>,
): Promise<FinanceBudgetPoleSlice[]> {
  const rooms = await prisma.formationVenueRoom.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      fixedEquipment: {
        include: { equipment: { select: { metadata: true, type: true } } },
      },
    },
  });

  if (rooms.some((r) => r.fixedEquipment.length > 0)) {
    const rows: FinanceBudgetPoleSlice[] = [];
    let totalActual = 0;
    for (const room of rooms) {
      let actual = 0;
      for (const fx of room.fixedEquipment) {
        const finance = parseEquipmentFinanceMeta(fx.equipment.metadata, fx.equipment.type);
        actual += equipmentAnnualAmortization(finance) * fx.quantity;
      }
      totalActual += actual;
      rows.push({
        poleId: room.id,
        label: room.name,
        planned: 0,
        actual: round2(actual),
        sharePct: 0,
        headcount: room.fixedEquipment.length,
        detail: 'Inventaire fixe de salle (amortissement annuel)',
      });
    }
    const plannedSum = line.plannedAmount || 1;
    return rows.map((r) => ({
      ...r,
      planned: round2((r.actual / (totalActual || 1)) * plannedSum),
      sharePct: totalActual > 0 ? Math.round((r.actual / totalActual) * 100) : 0,
    }));
  }

  const equipment = await prisma.equipment.findMany({
    select: {
      id: true,
      type: true,
      label: true,
      metadata: true,
      assignedSite: { select: { name: true } },
    },
  });

  const bySite = new Map<string, { planned: number; actual: number; count: number }>();
  for (const eq of equipment) {
    const site = eq.assignedSite?.name ?? eq.type ?? 'Non affecté';
    const cur = bySite.get(site) ?? { planned: 0, actual: 0, count: 0 };
    cur.actual += equipmentAcquisitionCost(eq.metadata);
    cur.count += 1;
    bySite.set(site, cur);
  }

  let payTotal = 0;
  for (const p of payments) {
    if (p.status === 'RECEIVED') payTotal += financeDecimalNum(p.amount);
  }

  const entries = Array.from(bySite.entries());
  const inventoryTotal = entries.reduce((s, [, v]) => s + v.actual, 0);
  const totalActual = inventoryTotal + payTotal || line.actualAmount || 1;

  if (entries.length === 0) {
    return [
      {
        poleId: 'global',
        label: 'Inventaire global',
        planned: line.plannedAmount,
        actual: line.actualAmount,
        sharePct: 100,
        detail: 'Aucun équipement inventorié',
      },
    ];
  }

  return entries.map(([site, v]) => {
    const actual = round2(v.actual + (payTotal > 0 ? (v.actual / (inventoryTotal || 1)) * payTotal : 0));
    return {
      poleId: site,
      label: site,
      planned: round2((v.count / equipment.length) * line.plannedAmount),
      actual,
      sharePct: Math.round((actual / totalActual) * 100),
      headcount: v.count,
      detail: `${v.count} équipement(s)`,
    };
  });
}

async function buildGenericPoleSlices(line: {
  plannedAmount: number;
  actualAmount: number;
  category: string;
}): Promise<FinanceBudgetPoleSlice[]> {
  return [
    {
      poleId: line.category,
      label: line.category,
      planned: line.plannedAmount,
      actual: line.actualAmount,
      sharePct: 100,
      detail: 'Ventilation non configurée pour cette catégorie',
    },
  ];
}

function buildMovements(
  category: string,
  payments: Awaited<ReturnType<typeof paymentsForCategoryYear>>,
): FinanceBudgetMovement[] {
  const rows: FinanceBudgetMovement[] = [];
  for (const p of payments.slice(0, 30)) {
    rows.push({
      id: p.id,
      kind: 'payment',
      reference: p.referenceCode,
      label: p.devis?.title ?? p.devis?.referenceCode ?? 'Paiement',
      amount: financeDecimalNum(p.amount),
      status: p.status,
      date: (p.paidAt ?? p.updatedAt)?.toISOString() ?? null,
    });
  }
  return rows;
}

export async function buildFinanceBudgetLineDetail(
  prisma: PrismaClient,
  lineId: string,
): Promise<FinanceBudgetLineDetail | null> {
  const row = await prisma.financeBudgetLine.findUnique({ where: { id: lineId } });
  if (!row) return null;

  const plannedAmount = financeDecimalNum(row.plannedAmount);
  const actualAmount = financeDecimalNum(row.actualAmount);
  const ecart = round2(plannedAmount - actualAmount);
  const consumptionPct = plannedAmount > 0 ? Math.round((actualAmount / plannedAmount) * 100) : 0;

  const relatedLines = await prisma.financeBudgetLine.findMany({
    where: {
      category: row.category,
      periodYear: row.periodYear,
      id: { not: row.id },
    },
    orderBy: [{ periodMonth: 'asc' }, { label: 'asc' }],
    select: {
      id: true,
      label: true,
      periodMonth: true,
      plannedAmount: true,
      actualAmount: true,
    },
  });

  const payments = await paymentsForCategoryYear(prisma, row.category, row.periodYear);
  const monthlySlices = buildMonthlySlices(
    { plannedAmount, actualAmount, periodMonth: row.periodMonth },
    row.periodYear,
    payments,
    relatedLines.map((r) => ({
      periodMonth: r.periodMonth,
      plannedAmount: financeDecimalNum(r.plannedAmount),
      actualAmount: financeDecimalNum(r.actualAmount),
    })),
  );

  let poleSlices: FinanceBudgetPoleSlice[];
  if (row.category === 'FORMATION') {
    poleSlices = await buildFormationPoleSlices(prisma, { plannedAmount, actualAmount }, payments);
  } else if (row.category === 'RH') {
    poleSlices = await buildRhPoleSlices(prisma, { plannedAmount, actualAmount });
  } else if (row.category === 'EQUIPEMENT') {
    poleSlices = await buildEquipmentPoleSlices(prisma, { plannedAmount, actualAmount }, payments);
  } else {
    poleSlices = await buildGenericPoleSlices({ plannedAmount, actualAmount, category: row.category });
  }

  const movements = buildMovements(row.category, payments);

  const periodLabel =
    row.periodMonth != null
      ? `${MONTH_LABELS[row.periodMonth - 1]} ${row.periodYear}`
      : `Annuel ${row.periodYear}`;

  return {
    line: {
      id: row.id,
      label: row.label,
      category: row.category,
      periodYear: row.periodYear,
      periodMonth: row.periodMonth,
      plannedAmount,
      actualAmount,
      currency: row.currency,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      ecart,
      consumptionPct,
      periodLabel,
    },
    summary: {
      siblingLines: relatedLines.length,
      movementCount: movements.length,
      poleCount: poleSlices.length,
    },
    monthlySlices,
    poleSlices,
    movements,
    relatedLines: relatedLines.map((r) => ({
      id: r.id,
      label: r.label,
      periodMonth: r.periodMonth,
      plannedAmount: financeDecimalNum(r.plannedAmount),
      actualAmount: financeDecimalNum(r.actualAmount),
    })),
  };
}
