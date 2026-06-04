import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FinancePaymentStatus } from '@repo/database';

type Ctx = { params: Promise<{ paymentId: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { paymentId } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    const status = String(body.status).trim() as FinancePaymentStatus;
    if (!Object.values(FinancePaymentStatus).includes(status)) return fail('Statut invalide.', 400);
    data.status = status;
    if (status === 'RECEIVED') data.paidAt = new Date();
  }
  if (body.method !== undefined) data.method = String(body.method).trim() || null;
  if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;

  try {
    await prisma.financePayment.update({ where: { id: paymentId }, data });
    return ok({ updated: true });
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}
