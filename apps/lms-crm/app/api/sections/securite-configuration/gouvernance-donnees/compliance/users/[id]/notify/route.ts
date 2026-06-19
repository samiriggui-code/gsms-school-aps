import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { notifyUserComplianceIssues } from '@/lib/governance/global-user-compliance';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message : undefined;
    const result = await notifyUserComplianceIssues({
      userId: id,
      message,
      requestedById: (session.user as { id?: string })?.id ?? null,
    });
    return ok(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Impossible d’envoyer la relance.';
    return fail(msg, 400, e);
  }
}
