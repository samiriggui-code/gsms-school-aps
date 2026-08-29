import { NextRequest } from 'next/server';
import { ok } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';
import { processJ5PrepReminders } from '@/lib/of/j5-prep-reminders';

/** Cron WF-14 — rappels J-5 préparation pédagogique. */
export async function GET(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  const dateParam = request.nextUrl.searchParams.get('date');
  let ref = new Date();
  if (dateParam) {
    const parsed = new Date(`${dateParam}T12:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) ref = parsed;
  }

  const result = await processJ5PrepReminders(prisma, request, ref);
  return ok(result);
}
