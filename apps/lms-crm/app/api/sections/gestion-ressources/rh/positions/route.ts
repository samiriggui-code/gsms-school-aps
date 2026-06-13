import { prisma } from '@/lib/prisma';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET() {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const rows = await prisma.rhPosition.findMany({
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    select: { id: true, label: true, code: true },
  });

  return ok(rows);
}
