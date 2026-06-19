import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  getUserPresence,
  getUsersPresence,
  setUserPresence,
  type UserPresenceStatus,
} from '@/lib/user-presence-server';

const VALID: UserPresenceStatus[] = ['online', 'busy', 'away', 'offline'];

/** Statut de présence (en ligne / occupé / absent) — partagé portail, CRM, formateur. */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const userIdsRaw = new URL(request.url).searchParams.get('userIds')?.trim();
  if (userIdsRaw) {
    const userIds = userIdsRaw.split(',').map((id) => id.trim()).filter(Boolean);
    const presences = await getUsersPresence(userIds);
    return ok({ presences });
  }

  const status = await getUserPresence(session.user.id);
  return ok({ status });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  let body: { status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const status = body.status?.trim() as UserPresenceStatus | undefined;
  if (!status || !VALID.includes(status)) {
    return fail('status doit être online, busy, away ou offline.', 400);
  }

  await setUserPresence(session.user.id, status);
  return ok({ status });
}
