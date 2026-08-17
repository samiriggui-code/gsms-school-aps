import type { PrismaClient } from '@repo/database';
import { FinanceDevisStatus } from '@repo/database';
import {
  mergeDevisWorkflowSettings,
  type DevisWorkflowSettings,
} from './devis-workflow-settings';

export async function loadDevisWorkflowSettings(
  prisma: PrismaClient,
): Promise<DevisWorkflowSettings> {
  const row = await prisma.moduleSetting.findUnique({
    where: {
      moduleKey_settingKey: { moduleKey: 'finance', settingKey: 'devis-workflow' },
    },
  });
  return mergeDevisWorkflowSettings(row?.value as Record<string, unknown> | undefined);
}

export function validUntilFromDays(days: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + Math.max(1, days));
  return d;
}

/** Passe en EXPIRED les devis SENT dont validUntil est dépassée. */
export async function expireOverdueSentDevis(prisma: PrismaClient): Promise<number> {
  const result = await prisma.financeDevis.updateMany({
    where: {
      status: FinanceDevisStatus.SENT,
      validUntil: { lt: new Date() },
    },
    data: { status: FinanceDevisStatus.EXPIRED },
  });
  return result.count;
}
