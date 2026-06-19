import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import type { NextResponse } from 'next/server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';
import { sessionHasAnyPermission, sessionHasPermission } from '@/lib/auth/crm-permissions';

type AuthOk = { session: Session; userId: string };
type AuthErr = { error: NextResponse };

export type CrmApiAuthResult =
  | { ok: true; session: Session; userId: string }
  | { ok: false; response: NextResponse };

export async function requireAuthenticatedSession(): Promise<AuthOk | AuthErr> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { error: fail('Unauthorized request', 401) };
  return { session, userId };
}

export async function requireCrmApiAuth(permissionSlug: string): Promise<CrmApiAuthResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, response: fail('Unauthorized request', 401) };
  }
  if (!sessionHasPermission(session, permissionSlug)) {
    return { ok: false, response: fail('Accès refusé — permission requise.', 403) };
  }
  return { ok: true, session, userId };
}

export async function requirePermission(slug: string): Promise<AuthOk | AuthErr> {
  const result = await requireCrmApiAuth(slug);
  if (!result.ok) return { error: result.response };
  return { session: result.session, userId: result.userId };
}

export async function requireAnyPermission(slugs: string[]): Promise<AuthOk | AuthErr> {
  const auth = await requireAuthenticatedSession();
  if ('error' in auth) return auth;
  if (!sessionHasAnyPermission(auth.session, slugs)) {
    return { error: fail('Accès refusé — permission requise.', 403) };
  }
  return auth;
}
