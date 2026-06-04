import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const userId = (await params).id;
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isTrashed: false,
      role: { slug: { in: ['candidat', 'eleve'] }, isTrashed: false },
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      role: { select: { slug: true, name: true } },
      candidatures: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          status: true,
          source: true,
          notes: true,
          cnapsReference: true,
          cnapsPrefavorable: true,
          cnapsSubmittedAt: true,
          cnapsDecisionAt: true,
          validatedAt: true,
          updatedAt: true,
          formation: { select: { id: true, name: true } },
          interestedSession: { select: { id: true, dateDisplayLabel: true, formationId: true } },
        },
      },
      formationSessionParticipants: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          enrollmentStatus: true,
          candidatureId: true,
          session: {
            select: {
              id: true,
              dateDisplayLabel: true,
              formation: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: 'Candidat introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}
