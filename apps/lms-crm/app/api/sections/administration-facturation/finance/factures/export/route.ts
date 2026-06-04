import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import { FinanceDevisStatus, Prisma } from '@repo/database';

function decimalNum(d: Prisma.Decimal | null | undefined): number {
  if (d == null) return 0;
  return typeof d === 'object' && 'toNumber' in d ? d.toNumber() : Number(d);
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function companyFromClientSnapshot(raw: unknown): string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return '';
  const c = (raw as Record<string, unknown>).company;
  return typeof c === 'string' ? c.trim() : '';
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();

  const where: Prisma.FinanceDevisWhereInput = {
    status: FinanceDevisStatus.ACCEPTED,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { referenceCode: { contains: q, mode: 'insensitive' } },
            { lead: { email: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  try {
    const rows = await prisma.financeDevis.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 5000,
      select: {
        referenceCode: true,
        title: true,
        totalTtc: true,
        currency: true,
        validUntil: true,
        updatedAt: true,
        clientSnapshot: true,
        lead: { select: { firstName: true, lastName: true, email: true, phone: true } },
        formation: { select: { name: true } },
      },
    });

    const header = [
      'Reference',
      'Titre',
      'Client',
      'Email',
      'Telephone',
      'Entreprise',
      'Formation',
      'Montant TTC',
      'Devise',
      'Echeance',
      'Mise a jour',
    ];

    const lines = rows.map((r) => {
      const client = r.lead ? `${r.lead.firstName} ${r.lead.lastName}`.trim() : '';
      return [
        r.referenceCode,
        r.title,
        client,
        r.lead?.email ?? '',
        r.lead?.phone ?? '',
        companyFromClientSnapshot(r.clientSnapshot),
        r.formation?.name ?? '',
        decimalNum(r.totalTtc).toFixed(2),
        r.currency,
        r.validUntil?.toISOString().slice(0, 10) ?? '',
        r.updatedAt.toISOString().slice(0, 10),
      ]
        .map(csvEscape)
        .join(',');
    });

    const csv = `\ufeff${header.join(',')}\n${lines.join('\n')}`;
    const filename = `factures-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error('[finance-factures export]', e);
    return fail('Export impossible.', 500, e);
  }
}
