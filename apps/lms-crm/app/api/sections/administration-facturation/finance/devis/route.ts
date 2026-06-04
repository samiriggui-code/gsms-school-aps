import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@repo/api-core';
import { FinanceDevisStatus, Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { totalsFromLines, type DevisLineInput } from '@/lib/finance-devis-totals';
import { clientSnapshotFieldsFromLead, companyFromLeadNotes } from '@/lib/landing-lead-notes';

async function notifyDevisCreated(created: { referenceCode: string; title: string }) {
  const notifier = new NotificationService(prisma);
  const adminIds = (
    await prisma.user.findMany({
      where: {
        isTrashed: false,
        status: 'ACTIVE',
        role: { slug: 'admin', isTrashed: false },
      },
      select: { id: true },
      take: 20,
    })
  ).map((u) => u.id);
  if (adminIds.length === 0) return;
  await notifier.emitMany(adminIds, {
    category: 'FINANCE',
    title: `Devis ${created.referenceCode}`,
    body: created.title,
    href: '/administration-facturation/finance/devis',
    dedupeKey: `devis:${created.referenceCode}`,
  });
}

function decimalNum(d: Prisma.Decimal | null | undefined): number {
  if (d == null) return 0;
  return typeof d === 'object' && 'toNumber' in d ? d.toNumber() : Number(d);
}

function companyFromClientSnapshot(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = (raw as Record<string, unknown>).company;
  if (typeof c !== 'string') return null;
  const t = c.trim();
  return t.length ? t : null;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const leadIdFilter = (sp.get('leadId') ?? '').trim();
  const q = (sp.get('q') ?? '').trim();
  const statusRaw = (sp.get('status') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const sortRaw = (sp.get('sort') ?? 'updatedAt').trim();
  const dir = sp.get('dir') === 'asc' ? 'asc' : 'desc';

  let orderBy: Prisma.FinanceDevisOrderByWithRelationInput = { updatedAt: dir };
  if (sortRaw === 'referenceCode') orderBy = { referenceCode: dir };
  else if (sortRaw === 'title') orderBy = { title: dir };
  else if (sortRaw === 'totalTtc') orderBy = { totalTtc: dir };
  else if (sortRaw === 'status') orderBy = { status: dir };
  else if (sortRaw === 'updatedAt') orderBy = { updatedAt: dir };

  const statusFilter: FinanceDevisStatus | undefined =
    statusRaw && statusRaw !== 'all' && (Object.values(FinanceDevisStatus) as string[]).includes(statusRaw)
      ? (statusRaw as FinanceDevisStatus)
      : undefined;

  const where: Prisma.FinanceDevisWhereInput = {
    ...(leadIdFilter ? { leadId: leadIdFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { referenceCode: { contains: q, mode: 'insensitive' } },
            { lead: { email: { contains: q, mode: 'insensitive' } } },
            {
              lead: {
                OR: [
                  { firstName: { contains: q, mode: 'insensitive' } },
                  { lastName: { contains: q, mode: 'insensitive' } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  try {
    const [total, pipelineAgg, grouped, rows] = await Promise.all([
      prisma.financeDevis.count({ where }),
      prisma.financeDevis.aggregate({
        where: {
          ...where,
          status: { in: [FinanceDevisStatus.DRAFT, FinanceDevisStatus.SENT] },
        },
        _sum: { totalTtc: true },
      }),
      prisma.financeDevis.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.financeDevis.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          referenceCode: true,
          title: true,
          status: true,
          subtotalHt: true,
          vatTotal: true,
          totalTtc: true,
          currency: true,
          validUntil: true,
          createdAt: true,
          updatedAt: true,
          leadId: true,
          formationId: true,
          clientSnapshot: true,
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          formation: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    const countBy = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

    const stats = {
      total,
      brouillons: countBy.DRAFT ?? 0,
      envoyes: countBy.SENT ?? 0,
      /** Pipeline : somme TTC des devis encore « ouverts » (brouillon + envoyé). */
      pipelineTtc: decimalNum(pipelineAgg._sum.totalTtc),
    };

    const items = rows.map((r) => ({
      id: r.id,
      referenceCode: r.referenceCode,
      title: r.title,
      status: r.status,
      subtotalHt: decimalNum(r.subtotalHt),
      vatTotal: decimalNum(r.vatTotal),
      totalTtc: decimalNum(r.totalTtc),
      currency: r.currency,
      validUntil: r.validUntil?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      leadId: r.leadId,
      formationId: r.formationId,
      /** Raison sociale (contexte client / snapshot devis), distinct du contact lead. */
      clientCompany: companyFromClientSnapshot(r.clientSnapshot),
      lead: r.lead,
      formation: r.formation,
    }));

    return ok({
      stats,
      items,
      pagination: { page, limit, total },
    });
  } catch (e) {
    console.error('[finance-devis GET]', e);
    return fail('Impossible de charger les devis.', 500, e);
  }
}

type PostBody = {
  leadId?: string;
  title?: string;
  /** Formation catalogue CRM (optionnel), uniquement si création sans lead. */
  formationId?: string;
  /** Si vrai, crée un nouveau brouillon même si un DRAFT existe déjà pour ce lead. */
  forceNew?: boolean;
};

function defaultValidUntil(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 45);
  return d;
}

function decimalToNumber(d: unknown): number {
  if (d == null) return 0;
  if (typeof d === 'object' && d !== null && 'toNumber' in d && typeof (d as { toNumber: () => number }).toNumber === 'function') {
    return (d as { toNumber: () => number }).toNumber();
  }
  const n = Number(d);
  return Number.isFinite(n) ? n : 0;
}

/** Ligne(s) par défaut : formation catalogue + prix public / override catalogue si actif. */
function initialLinesForFormation(
  formation: {
    name: string;
    priceFrom: unknown;
    catalogOffer: { catalogStatus: string; priceFromOverride: unknown } | null;
  } | null,
): DevisLineInput[] {
  if (!formation) {
    return [{ label: 'Prestation — détail et prix à renseigner', quantity: 1, unitPriceHt: 0, vatRate: 20 }];
  }
  let unitHt = 0;
  if (formation.catalogOffer?.catalogStatus === 'ACTIVE' && formation.catalogOffer.priceFromOverride != null) {
    unitHt = decimalToNumber(formation.catalogOffer.priceFromOverride);
  }
  if (unitHt <= 0) {
    unitHt = decimalToNumber(formation.priceFrom);
  }
  return [{ label: formation.name, quantity: 1, unitPriceHt: Math.max(0, Math.round(unitHt * 100) / 100), vatRate: 20 }];
}

function nextReferenceCode(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DEV-${t.toString(36).toUpperCase()}-${r}`;
}

async function allocateReferenceCode(): Promise<string> {
  let ref = nextReferenceCode();
  for (let i = 0; i < 5; i += 1) {
    const clash = await prisma.financeDevis.findUnique({ where: { referenceCode: ref }, select: { id: true } });
    if (!clash) break;
    ref = nextReferenceCode();
  }
  return ref;
}

/**
 * Crée un brouillon de devis.
 * - Avec `leadId` : rattache au lead (flux Marketing / landing).
 * - Sans `leadId` : brouillon autonome module Finance (`leadId` null en base).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const leadId = (body.leadId ?? '').trim();

  try {
    const ref = await allocateReferenceCode();

    if (!leadId) {
      const title = (body.title ?? '').trim() || 'Nouveau devis';
      let formationId: string | null = null;
      const formationIdRaw = (body.formationId ?? '').trim();
      let formationForLines: {
        name: string;
        priceFrom: unknown;
        currency: string;
        catalogOffer: { catalogStatus: string; priceFromOverride: unknown } | null;
      } | null = null;

      if (formationIdRaw) {
        const formation = await prisma.formation.findFirst({
          where: { id: formationIdRaw, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            priceFrom: true,
            currency: true,
            catalogOffer: { select: { catalogStatus: true, priceFromOverride: true } },
          },
        });
        if (formation) {
          formationId = formation.id;
          formationForLines = formation;
        }
      }

      const lines = initialLinesForFormation(formationForLines);
      const lineTotals = totalsFromLines(lines);
      const currency =
        formationForLines?.currency?.trim().length === 3
          ? formationForLines.currency.trim().toUpperCase()
          : 'EUR';

      const created = await prisma.financeDevis.create({
        data: {
          referenceCode: ref,
          title,
          leadId: null,
          formationId,
          candidatureId: null,
          formationSessionId: null,
          clientSnapshot: {},
          lines: lines as unknown as Prisma.InputJsonValue,
          subtotalHt: lineTotals.subtotalHt,
          vatTotal: lineTotals.vatTotal,
          totalTtc: lineTotals.totalTtc,
          currency,
          notes: null,
          validUntil: defaultValidUntil(),
          status: FinanceDevisStatus.DRAFT,
        },
        select: { id: true, referenceCode: true, title: true },
      });

      await notifyDevisCreated(created);
      return ok(created, 201);
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        formationId: true,
        notes: true,
        formation: {
          select: {
            name: true,
            priceFrom: true,
            currency: true,
            catalogOffer: { select: { catalogStatus: true, priceFromOverride: true } },
          },
        },
      },
    });
    if (!lead) return fail('Lead introuvable.', 404);

    const candidature = await prisma.candidature.findUnique({
      where: { leadId: lead.id },
      select: { id: true, interestedSessionId: true },
    });

    const orgLabel =
      companyFromLeadNotes(lead.notes) ?? `${lead.firstName} ${lead.lastName}`.trim();
    const title =
      (body.title ?? '').trim() ||
      (lead.formation?.name
        ? `Devis ${lead.formation.name} — ${orgLabel}`.trim()
        : `Proposition commerciale — ${orgLabel}`.trim());

    const clientSnapshot = clientSnapshotFieldsFromLead(lead) as Prisma.InputJsonValue;

    const forceNew = body.forceNew === true;

    if (!forceNew) {
      const existingDraft = await prisma.financeDevis.findFirst({
        where: { leadId: lead.id, status: FinanceDevisStatus.DRAFT },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, referenceCode: true, title: true },
      });
      if (existingDraft) {
        await prisma.financeDevis.update({
          where: { id: existingDraft.id },
          data: {
            title,
            clientSnapshot,
            notes: lead.notes,
            formationId: lead.formationId,
            candidatureId: candidature?.id ?? null,
            formationSessionId: candidature?.interestedSessionId ?? null,
          },
        });
        return ok(
          { id: existingDraft.id, referenceCode: existingDraft.referenceCode, title, reusedDraft: true },
          200,
        );
      }
    }

    const lines = initialLinesForFormation(lead.formation);
    const lineTotals = totalsFromLines(lines);
    const currency =
      lead.formation?.currency?.trim().length === 3
        ? lead.formation.currency.trim().toUpperCase()
        : 'EUR';

    const created = await prisma.financeDevis.create({
      data: {
        referenceCode: ref,
        title,
        leadId: lead.id,
        formationId: lead.formationId,
        candidatureId: candidature?.id ?? null,
        formationSessionId: candidature?.interestedSessionId ?? null,
        clientSnapshot,
        lines: lines as unknown as Prisma.InputJsonValue,
        subtotalHt: lineTotals.subtotalHt,
        vatTotal: lineTotals.vatTotal,
        totalTtc: lineTotals.totalTtc,
        currency,
        notes: lead.notes,
        validUntil: defaultValidUntil(),
        status: FinanceDevisStatus.DRAFT,
      },
      select: { id: true, referenceCode: true, title: true },
    });

    await notifyDevisCreated(created);
    return ok(created, 201);
  } catch (e) {
    console.error('[finance-devis POST]', e);
    return fail('Création du devis impossible.', 500, e);
  }
}
