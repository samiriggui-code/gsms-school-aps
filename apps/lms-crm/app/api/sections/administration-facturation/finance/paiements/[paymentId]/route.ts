import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FinancePaymentStatus } from '@repo/database';
import { syncBudgetFromPaymentStatusChange } from '@/lib/finance/finance-budget-sync';
import { markFinancePaymentReceived } from '@/lib/finance/finance-payment-workflow';

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

  let nextStatus: FinancePaymentStatus | undefined;
  if (body.status !== undefined) {
    const status = String(body.status).trim() as FinancePaymentStatus;
    if (!Object.values(FinancePaymentStatus).includes(status)) return fail('Statut invalide.', 400);
    nextStatus = status;
  }

  const sideData: { method?: string | null; notes?: string | null } = {};
  if (body.method !== undefined) sideData.method = String(body.method).trim() || null;
  if (body.notes !== undefined) sideData.notes = String(body.notes).trim() || null;

  try {
    const existing = await prisma.financePayment.findUnique({
      where: { id: paymentId },
      select: { status: true },
    });
    if (!existing) return fail('Paiement introuvable.', 404);

    if (nextStatus === 'RECEIVED' && existing.status !== 'RECEIVED') {
      if (Object.keys(sideData).length > 0) {
        await prisma.financePayment.update({ where: { id: paymentId }, data: sideData });
      }
      await markFinancePaymentReceived(prisma, paymentId);
      return ok({ updated: true });
    }

    const data: Record<string, unknown> = { ...sideData };
    if (nextStatus !== undefined) {
      data.status = nextStatus;
      if (nextStatus === 'RECEIVED') data.paidAt = new Date();
    }

    if (Object.keys(data).length === 0) return ok({ updated: true });

    await prisma.financePayment.update({ where: { id: paymentId }, data });

    if (nextStatus !== undefined && nextStatus !== existing.status) {
      await syncBudgetFromPaymentStatusChange(prisma, paymentId, existing.status, nextStatus);
    }

    return ok({ updated: true });
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}
