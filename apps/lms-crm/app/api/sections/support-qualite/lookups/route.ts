import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/app/api/_shared/http/response';
import { requireSupportView } from '../_lib/require-support-auth';

/** Options pour lier ticket / équipement (sélecteurs incidents). */
export async function GET(request: NextRequest) {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const type = (sp.get('type') ?? 'tickets').trim();
  const q = (sp.get('q') ?? '').trim();
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 20, 1), 50);

  if (type === 'equipment') {
    const rows = await prisma.equipment.findMany({
      where: q
        ? {
            OR: [
              { label: { contains: q, mode: 'insensitive' } },
              { serialNumber: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { label: 'asc' },
      take: limit,
      select: {
        id: true,
        label: true,
        serialNumber: true,
        status: true,
      },
    });
    return ok(
      rows.map((r) => ({
        id: r.id,
        label: `${r.label} (${r.serialNumber})`,
        subtitle: r.status,
      })),
    );
  }

  const rows = await prisma.supportTicket.findMany({
    where: q
      ? {
          OR: [
            { referenceCode: { contains: q, mode: 'insensitive' } },
            { subject: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {},
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      referenceCode: true,
      subject: true,
      status: true,
    },
  });

  return ok(
    rows.map((r) => ({
      id: r.id,
      label: `${r.referenceCode} — ${r.subject}`,
      subtitle: r.status,
    })),
  );
}
