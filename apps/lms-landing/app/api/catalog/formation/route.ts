import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCache, setCache } from '@repo/redis';

export const dynamic = 'force-dynamic';

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'object' && v !== null && 'toNumber' in v ? (v as { toNumber: () => number }).toNumber() : Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatPrice(amount: unknown, currencyRaw: string | null | undefined): string {
  const amountNum = numOrNull(amount);
  if (amountNum == null) return '';
  const currency = (currencyRaw || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amountNum);
  } catch {
    return `${Math.round(amountNum)} €`;
  }
}

function hoursLabel(row: {
  volumeHoursLabel: string | null;
  hoursMin: number | null;
  hoursMax: number | null;
  duration: string;
}): string {
  const v = row.volumeHoursLabel?.trim();
  if (v) return v.includes('h') || /\d/.test(v) ? v : `${v}h`;
  if (row.hoursMin != null && row.hoursMax != null) return `${row.hoursMin}-${row.hoursMax}h`;
  if (row.hoursMin != null) return `${row.hoursMin}h minimum`;
  return row.duration?.trim() || '';
}

function traineesLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}-${max}`;
  if (min != null) return `${min}+`;
  if (max != null) return `≤${max}`;
  return '';
}

function successLabel(rate: unknown): string {
  const n = numOrNull(rate);
  if (n == null) return '';
  return `${Math.round(n)}%`;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim();
  if (!slug) {
    return NextResponse.json({ message: 'Paramètre slug requis.' }, { status: 400 });
  }

  try {
    const cacheKey = `formation:${slug}`;
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const formation = await prisma.formation.findFirst({
      where: { slug, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        slug: true,
        duration: true,
        hoursMin: true,
        hoursMax: true,
        volumeHoursLabel: true,
        traineesMin: true,
        traineesMax: true,
        priceFrom: true,
        currency: true,
        successRate: true,
        catalogOffer: {
          select: {
            catalogStatus: true,
            priceFromOverride: true,
            currencyOverride: true,
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({ formation: null, stats: null, catalogInactive: false });
    }

    if (formation.catalogOffer && formation.catalogOffer.catalogStatus !== 'ACTIVE') {
      return NextResponse.json({
        formation: { id: formation.id, name: formation.name, slug: formation.slug },
        stats: null,
        catalogInactive: true,
      });
    }

    const priceValue = formation.catalogOffer?.priceFromOverride ?? formation.priceFrom;
    const currency = formation.catalogOffer?.currencyOverride ?? formation.currency ?? 'EUR';

    const hoursDisplay = hoursLabel(formation);
    const traineesDisplay = traineesLabel(formation.traineesMin, formation.traineesMax);
    const priceAmountOnly = numOrNull(priceValue);
    const priceFormatted = formatPrice(priceValue, currency);
    const successDisplay = successLabel(formation.successRate);
    /** Pas de tarif public → le landing peut proposer une demande de devis. */
    const requiresQuote = priceAmountOnly == null;

    const result = {
      formation: { id: formation.id, name: formation.name, slug: formation.slug },
      catalogInactive: false,
      requiresQuote,
      stats: {
        hoursDisplay,
        traineesDisplay,
        /** nombre sans symbole pour la carte (ex: 1190) — suffixe € ajouté par le composant */
        priceAmountText:
          priceAmountOnly != null
            ? String(Math.round(priceAmountOnly))
            : '',
        priceFormatted,
        successDisplay,
      },
    };

    // Cache pour 1 heure (3600 secondes)
    await setCache(cacheKey, result, 3600);

    return NextResponse.json(result);
  } catch (e) {
    console.error('[catalog/formation]', e);
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
