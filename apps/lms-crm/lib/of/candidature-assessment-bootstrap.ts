import type { NextRequest } from 'next/server';
import type { PrismaClient } from '@repo/database';
import { bootstrapNeedsAnalysisForCandidature } from '@/lib/of/candidature-assessment-service';

/** Headers synthétiques si l’appelant n’a pas de NextRequest (ex. transaction RH). */
export function assessmentInviteRequestLike(
  request?: Pick<NextRequest, 'headers'> | null,
): Pick<NextRequest, 'headers'> {
  if (request) return request;
  const raw = process.env.NEXTAUTH_URL?.trim() || '';
  let host = 'localhost:3001';
  let proto = 'http';
  if (raw) {
    try {
      const u = new URL(raw);
      host = u.host;
      proto = u.protocol.replace(':', '');
    } catch {
      /* ignore */
    }
  }
  const headers = new Headers();
  headers.set('host', host);
  headers.set('x-forwarded-proto', proto);
  return { headers };
}

/** WF-02 — best-effort après création candidature (ne bloque pas le flux principal). */
export async function afterCandidatureCreated(
  prisma: PrismaClient,
  candidatureId: string,
  request?: Pick<NextRequest, 'headers'> | null,
): Promise<void> {
  try {
    await bootstrapNeedsAnalysisForCandidature(
      prisma,
      candidatureId,
      assessmentInviteRequestLike(request),
    );
  } catch (e) {
    console.error('[candidature-assessment] bootstrap WF-02', e);
  }
}
