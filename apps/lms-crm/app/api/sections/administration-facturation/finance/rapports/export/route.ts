import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import { FinanceDevisStatus } from '@repo/database';

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const months = 12;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  try {
    const [devis, leads] = await Promise.all([
      prisma.financeDevis.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true, status: true },
      }),
      prisma.lead.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
    ]);

    const header = ['Mois', 'Leads', 'Devis crees', 'Devis acceptes', 'Devis refuses'];
    const lines: string[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const monthLeads = leads.filter((l) => l.createdAt >= d && l.createdAt < next).length;
      const monthDevis = devis.filter((x) => x.createdAt >= d && x.createdAt < next);
      const accepted = monthDevis.filter((x) => x.status === FinanceDevisStatus.ACCEPTED).length;
      const rejected = monthDevis.filter((x) => x.status === FinanceDevisStatus.REJECTED).length;

      lines.push(
        [label, monthLeads, monthDevis.length, accepted, rejected].map(csvEscape).join(','),
      );
    }

    const csv = `\ufeff${header.join(',')}\n${lines.join('\n')}`;
    const filename = `rapports-finance-${now.toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return fail('Export impossible.', 500, e);
  }
}
