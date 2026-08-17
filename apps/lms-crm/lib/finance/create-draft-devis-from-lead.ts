import type { Prisma, PrismaClient } from '@repo/database';
import { FinanceDevisStatus } from '@repo/database';
import { totalsFromLines, type DevisLineInput } from '@/lib/finance-devis-totals';
import { clientSnapshotFieldsFromLead, companyFromLeadNotes } from '@/lib/landing-lead-notes';
import { financeDecimalNum } from '@/lib/finance/finance-decimal';

function defaultValidUntil(validityDays = 45): Date {
  const d = new Date();
  d.setDate(d.getDate() + validityDays);
  return d;
}

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
    unitHt = financeDecimalNum(formation.catalogOffer.priceFromOverride);
  }
  if (unitHt <= 0) unitHt = financeDecimalNum(formation.priceFrom);
  return [
    {
      label: formation.name,
      quantity: 1,
      unitPriceHt: Math.max(0, Math.round(unitHt * 100) / 100),
      vatRate: 20,
    },
  ];
}

function nextReferenceCode(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DEV-${t.toString(36).toUpperCase()}-${r}`;
}

async function allocateReferenceCode(prisma: PrismaClient): Promise<string> {
  let ref = nextReferenceCode();
  for (let i = 0; i < 5; i += 1) {
    const clash = await prisma.financeDevis.findUnique({ where: { referenceCode: ref }, select: { id: true } });
    if (!clash) break;
    ref = nextReferenceCode();
  }
  return ref;
}

export type CreateDraftDevisFromLeadResult = {
  id: string;
  referenceCode: string;
  title: string;
  reusedDraft?: boolean;
  created?: boolean;
};

/** Crée ou réutilise un brouillon de devis rattaché à un lead (flux Marketing / landing). */
export async function createDraftDevisFromLead(
  prisma: PrismaClient,
  leadId: string,
  options?: { title?: string; forceNew?: boolean; validityDays?: number },
): Promise<CreateDraftDevisFromLeadResult | null> {
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
  if (!lead) return null;

  const candidature = await prisma.candidature.findUnique({
    where: { leadId: lead.id },
    select: { id: true, interestedSessionId: true },
  });

  const orgLabel = companyFromLeadNotes(lead.notes) ?? `${lead.firstName} ${lead.lastName}`.trim();
  const title =
    (options?.title ?? '').trim() ||
    (lead.formation?.name
      ? `Devis ${lead.formation.name} — ${orgLabel}`.trim()
      : `Proposition commerciale — ${orgLabel}`.trim());

  const clientSnapshot = clientSnapshotFieldsFromLead(lead) as Prisma.InputJsonValue;

  if (!options?.forceNew) {
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
      return { ...existingDraft, title, reusedDraft: true };
    }
  }

  const lines = initialLinesForFormation(lead.formation);
  const lineTotals = totalsFromLines(lines);
  const currency =
    lead.formation?.currency?.trim().length === 3
      ? lead.formation.currency.trim().toUpperCase()
      : 'EUR';

  const ref = await allocateReferenceCode(prisma);
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
      validUntil: defaultValidUntil(options?.validityDays ?? 45),
      status: FinanceDevisStatus.DRAFT,
    },
    select: { id: true, referenceCode: true, title: true },
  });

  return { ...created, created: true };
}

export function isFinanceAutoDevisFromLeadEnabled(): boolean {
  return process.env.CRM_FINANCE_AUTO_DEVIS_FROM_LEAD === '1';
}
