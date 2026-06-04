import { prisma } from '@/lib/prisma';
import { Prisma } from '@repo/database';
import type { FinanceCatalogLineRow } from '@/lib/finance-catalog-line-types';

/**
 * Alimente / met à jour les lignes catalogue de type FORMATION depuis les offres catalogue
 * (statuts ACTIVE et DRAFT, comme la liste « Au catalogue » des formations).
 * Désactive les lignes FORMATION dont l’offre n’est plus dans cette liste.
 */
export async function syncFinanceCatalogLinesFromCatalogOffers(): Promise<void> {
  const offers = await prisma.formationCatalogOffer.findMany({
    where: { catalogStatus: { in: ['ACTIVE', 'DRAFT'] } },
    include: {
      formation: {
        select: {
          id: true,
          name: true,
          tag: true,
          duration: true,
          priceFrom: true,
          currency: true,
        },
      },
    },
    orderBy: [{ formation: { track: 'asc' } }, { formation: { name: 'asc' } }],
  });

  const activeFormationIds = offers.map((o) => o.formationId);

  if (activeFormationIds.length > 0) {
    await prisma.financeCatalogLine.updateMany({
      where: {
        category: 'FORMATION',
        formationId: { not: null, notIn: activeFormationIds },
      },
      data: { isActive: false },
    });
  } else {
    await prisma.financeCatalogLine.updateMany({
      where: { category: 'FORMATION', formationId: { not: null } },
      data: { isActive: false },
    });
  }

  let sortOrder = 0;
  for (const o of offers) {
    const f = o.formation;
    const hasOverride = o.priceFromOverride != null && String(o.priceFromOverride).trim() !== '';
    const priceNum = hasOverride
      ? Number(o.priceFromOverride)
      : f.priceFrom != null
        ? Number(f.priceFrom)
        : NaN;
    const currency =
      o.currencyOverride != null && o.currencyOverride.trim() !== '' ? o.currencyOverride : f.currency ?? 'EUR';
    const descParts = [f.tag, f.duration].filter((x) => typeof x === 'string' && x.trim() !== '');
    const description = descParts.length ? descParts.join(' · ') : null;

    const defaultUnitPriceHt =
      Number.isFinite(priceNum) && priceNum >= 0 ? new Prisma.Decimal(priceNum) : null;

    await prisma.financeCatalogLine.upsert({
      where: { formationId: o.formationId },
      create: {
        category: 'FORMATION',
        formationId: o.formationId,
        label: f.name,
        description,
        defaultUnitPriceHt,
        defaultVatRate: new Prisma.Decimal(20),
        currency,
        sortOrder,
        isActive: true,
      },
      update: {
        label: f.name,
        description,
        defaultUnitPriceHt,
        defaultVatRate: new Prisma.Decimal(20),
        currency,
        sortOrder,
        isActive: true,
      },
    });
    sortOrder += 10;
  }
}

function decimalToNumber(d: unknown): number {
  if (d == null) return 0;
  if (typeof d === 'object' && d !== null && 'toNumber' in d) {
    return (d as { toNumber: () => number }).toNumber();
  }
  const n = Number(d);
  return Number.isFinite(n) ? n : 0;
}

export async function listFinanceCatalogLinesForApi(): Promise<FinanceCatalogLineRow[]> {
  await syncFinanceCatalogLinesFromCatalogOffers();

  const rows = await prisma.financeCatalogLine.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    select: {
      id: true,
      category: true,
      formationId: true,
      label: true,
      description: true,
      defaultUnitPriceHt: true,
      defaultVatRate: true,
      currency: true,
      sortOrder: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    formationId: r.formationId,
    label: r.label,
    description: r.description,
    defaultUnitPriceHt:
      r.defaultUnitPriceHt == null ? null : Math.round(decimalToNumber(r.defaultUnitPriceHt) * 100) / 100,
    defaultVatRate: Math.round(decimalToNumber(r.defaultVatRate) * 100) / 100,
    currency: r.currency,
    sortOrder: r.sortOrder,
  }));
}
