import { NextRequest, NextResponse } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';
import { CandidatureStatus, Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import { postRhCandidature } from '../../_lib/rh-candidatures-handlers';

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const statusParam = searchParams.get('status');
  const pipeline = searchParams.get('pipeline')?.trim();
  const formationId = searchParams.get('formationId')?.trim();
  const query = (searchParams.get('query') || '').trim();

  const statusWhere =
    statusParam && (Object.values(CandidatureStatus) as string[]).includes(statusParam)
      ? { status: statusParam as (typeof CandidatureStatus)[keyof typeof CandidatureStatus] }
      : {};

  let pipelineWhere: Prisma.CandidatureWhereInput = {};
  if (!statusParam && (pipeline === 'pending' || pipeline === 'validated')) {
    pipelineWhere =
      pipeline === 'pending'
        ? { status: { notIn: [CandidatureStatus.VALIDATED, CandidatureStatus.ARCHIVED] } }
        : { status: CandidatureStatus.VALIDATED };
  }

  const where: Prisma.CandidatureWhereInput = {
    ...pipelineWhere,
    ...statusWhere,
    ...(formationId ? { formationId } : {}),
    ...(query
      ? {
          user: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const totalCount = await prisma.candidature.count({ where });
  const rows = await prisma.candidature.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          role: { select: { slug: true, name: true } },
        },
      },
      formation: { select: { id: true, name: true } },
      interestedSession: {
        select: { id: true, dateDisplayLabel: true, formationId: true },
      },
    },
  });

  return NextResponse.json({
    data: rows,
    pagination: { total: totalCount, page, limit },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;
  return postRhCandidature(request);
}
