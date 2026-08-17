import { NextRequest } from 'next/server';
import { fetchOpsWeeklyDigest } from '@repo/api-core';
import { ok } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';

export async function GET(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();
  const digest = await fetchOpsWeeklyDigest(prisma);
  return ok(digest);
}
