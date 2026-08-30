import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import { Prisma } from '@repo/database';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

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
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();

  const where: Prisma.FinanceInvoiceWhereInput = {
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: 'insensitive' } },
            { devis: { title: { contains: q, mode: 'insensitive' } } },
            { devis: { referenceCode: { contains: q, mode: 'insensitive' } } },
            { devis: { lead: { email: { contains: q, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  try {
    const rows = await prisma.financeInvoice.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      take: 5000,
      select: {
        number: true,
        kind: true,
        status: true,
        totalTtc: true,
        currency: true,
        issuedAt: true,
        einvoiceStatus: true,
        devis: {
          select: {
            referenceCode: true,
            title: true,
            clientSnapshot: true,
            lead: { select: { firstName: true, lastName: true, email: true, phone: true } },
            formation: { select: { name: true } },
          },
        },
      },
    });

    const header = [
      'NumeroFacture',
      'Devis',
      'Nature',
      'Statut',
      'Titre',
      'Client',
      'Email',
      'Telephone',
      'Entreprise',
      'Formation',
      'Montant TTC',
      'Devise',
      'Emise le',
      'Efacture',
    ];

    const lines = rows.map((r) => {
      const client = r.devis.lead
        ? `${r.devis.lead.firstName} ${r.devis.lead.lastName}`.trim()
        : '';
      return [
        r.number,
        r.devis.referenceCode,
        r.kind,
        r.status,
        r.devis.title,
        client,
        r.devis.lead?.email ?? '',
        r.devis.lead?.phone ?? '',
        companyFromClientSnapshot(r.devis.clientSnapshot),
        r.devis.formation?.name ?? '',
        decimalNum(r.totalTtc).toFixed(2),
        r.currency,
        r.issuedAt.toISOString().slice(0, 10),
        r.einvoiceStatus,
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
