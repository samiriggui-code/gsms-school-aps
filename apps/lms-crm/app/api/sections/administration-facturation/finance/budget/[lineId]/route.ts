import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildFinanceBudgetLineDetail } from '@/lib/finance/finance-budget-detail-build';

type Ctx = { params: Promise<{ lineId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  const { lineId } = await context.params;
  try {
    const detail = await buildFinanceBudgetLineDetail(prisma, lineId);
    if (!detail) return fail('Ligne budget introuvable.', 404);
    return ok(detail);
  } catch (e) {
    return fail('Impossible de charger le détail budget.', 500, e);
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { lineId } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: Record<string, unknown> = {};
  if (body.label !== undefined) data.label = String(body.label).trim();
  if (body.category !== undefined) data.category = String(body.category).trim();
  if (body.plannedAmount !== undefined) data.plannedAmount = Number(body.plannedAmount);
  if (body.actualAmount !== undefined) data.actualAmount = Number(body.actualAmount);
  if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;

  try {
    await prisma.financeBudgetLine.update({ where: { id: lineId }, data });
    return ok({ updated: true });
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { lineId } = await context.params;
  try {
    await prisma.financeBudgetLine.delete({ where: { id: lineId } });
    return ok({ deleted: true });
  } catch (e) {
    return fail('Suppression impossible.', 500, e);
  }
}
