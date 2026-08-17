import type { PrismaClient } from '@repo/database';
import { createWorkflowEngine } from '@repo/api-core';
import { syncBudgetFromPaymentStatusChange } from '@/lib/finance/finance-budget-sync';

/** Passe un paiement en RECEIVED, sync budget et émet `crm.finance.payment.recorded`. */
export async function markFinancePaymentReceived(
  prisma: PrismaClient,
  paymentId: string,
): Promise<boolean> {
  const existing = await prisma.financePayment.findUnique({
    where: { id: paymentId },
    select: { status: true },
  });
  if (!existing) return false;
  if (existing.status === 'RECEIVED') return true;

  await prisma.financePayment.update({
    where: { id: paymentId },
    data: { status: 'RECEIVED', paidAt: new Date() },
  });

  await syncBudgetFromPaymentStatusChange(prisma, paymentId, existing.status, 'RECEIVED');

  try {
    const payment = await prisma.financePayment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        referenceCode: true,
        amount: true,
        currency: true,
        devisId: true,
        status: true,
      },
    });
    if (payment) {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.finance.payment.recorded',
        {
          paymentId: payment.id,
          referenceCode: payment.referenceCode,
          amount: Number(payment.amount),
          currency: payment.currency,
          devisId: payment.devisId,
          status: payment.status,
        },
        { dedupeKey: `workflow:payment-received:${payment.id}` },
      );
    }
  } catch (e) {
    console.error('[finance-payment] workflow RECEIVED', e);
  }

  return true;
}
