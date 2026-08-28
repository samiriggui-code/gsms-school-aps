import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Complément à la checklist « session publiable » (idée 5) : les autres critères
 * (dates, lieu, formateur, tarif) sont déjà portés par la fiche session côté client —
 * seul le signal "documents générés" nécessite une requête (FileAsset archivé).
 */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await context.params;

  try {
    const documentAsset = await prisma.fileAsset.findFirst({
      where: {
        module: 'gestion-academique',
        entityType: 'formation_session',
        entityId: id,
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    return ok({ hasDocuments: Boolean(documentAsset) });
  } catch (e) {
    return fail('Vérification impossible.', 500, e);
  }
}
