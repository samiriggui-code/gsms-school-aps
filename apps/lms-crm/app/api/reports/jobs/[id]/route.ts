import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { ReportJobService } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const { id } = await params;
  const service = new ReportJobService(prisma);
  const job = await service.getJob(id);
  if (!job || job.requestedById !== session.user.id) return fail('Job introuvable.', 404);

  const withUser = await prisma.reportGenerationJob.findUnique({
    where: { id },
    include: { requestedBy: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!withUser) return fail('Job introuvable.', 404);

  return ok({ job: service.toDto(withUser) });
}
