import { NextRequest, NextResponse } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

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
