import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const where: any = {};
    if (userId) {
      where.entityType = 'User';
      where.entityId = userId;
    }

    const documents = await prisma.fileAsset.findMany({
      where,
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        url: true,
        category: true,
        module: true,
        status: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to expected interface: { id, type, number, issueDate, expiryDate, status, fileUrl }
    const mapped = documents.map((doc) => ({
      id: doc.id,
      type: doc.category || 'DOCUMENT',
      number: doc.originalName,
      issueDate: doc.createdAt.toISOString(),
      expiryDate: null,
      status: doc.status,
      fileUrl: doc.url,
    }));

    return ok(mapped);
  } catch (error) {
    return fail('Impossible de récupérer les documents.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  // Upload de document serait géré ailleurs; renvoie vide pour l'instant
  return fail('Not implemented', 501);
}
