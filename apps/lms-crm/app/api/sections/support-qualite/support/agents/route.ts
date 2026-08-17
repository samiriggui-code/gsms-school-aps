import { prisma } from '@/lib/prisma';
import { ok } from '@/app/api/_shared/http/response';
import { requireSupportView } from '../../_lib/require-support-auth';

/** Agents support (staff actif) pour assignation. */
export async function GET() {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  const rows = await prisma.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      userCategory: 'INTERNAL',
      role: {
        isTrashed: false,
        permissions: {
          some: { permission: { slug: 'crm.support.edit' } },
        },
      },
    },
    orderBy: { name: 'asc' },
    take: 50,
    select: { id: true, name: true, email: true },
  });

  return ok(rows);
}
