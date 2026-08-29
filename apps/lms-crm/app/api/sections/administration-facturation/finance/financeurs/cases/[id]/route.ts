import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FundingCaseStatus } from '@repo/database';
import {
  canCancelFundingCase,
  nextFundingCaseStatus,
} from '@/lib/funding/funding-case-transitions';

const FUNDING_STATUSES = new Set(Object.values(FundingCaseStatus));

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH — transition de statut FundingCase + FundingCaseEvent (G5).
 * Body: `{ advance: true }` | `{ cancel: true }` | `{ status: FundingCaseStatus }`
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;
  if (!id) return fail('Case id required', 400);

  try {
    const body = (await request.json()) as {
      status?: string;
      advance?: boolean;
      cancel?: boolean;
      notes?: string;
    };

    const existing = await prisma.fundingCase.findUnique({
      where: { id },
      include: { provider: { select: { code: true, label: true } } },
    });
    if (!existing) return fail('FundingCase not found', 404);

    const fromStatus = existing.status;
    let toStatus: FundingCaseStatus | null = null;

    if (body.cancel === true) {
      if (!canCancelFundingCase(fromStatus)) {
        return fail(`Cannot cancel from status ${fromStatus}`, 400);
      }
      toStatus = FundingCaseStatus.CANCELLED;
    } else if (body.advance === true) {
      toStatus = nextFundingCaseStatus(fromStatus);
      if (!toStatus) {
        return fail(`No next status from ${fromStatus}`, 400);
      }
    } else if (body.status) {
      if (!FUNDING_STATUSES.has(body.status as FundingCaseStatus)) {
        return fail('Invalid status', 400);
      }
      toStatus = body.status as FundingCaseStatus;
    } else {
      return fail('Provide advance, cancel, or status', 400);
    }

    if (toStatus === fromStatus) {
      return fail('Status unchanged', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.fundingCase.update({
        where: { id },
        data: {
          status: toStatus!,
          ...(body.notes?.trim() ? { notes: body.notes.trim() } : {}),
        },
        include: { provider: { select: { code: true, label: true } } },
      });
      await tx.fundingCaseEvent.create({
        data: {
          caseId: id,
          fromStatus,
          toStatus: toStatus!,
          source: 'ui',
          actorUserId: session.user?.id ?? null,
          payload: {
            action: body.cancel ? 'cancel' : body.advance ? 'advance' : 'set_status',
          },
        },
      });
      return row;
    });

    return ok({
      id: updated.id,
      reference: updated.reference,
      status: updated.status,
      fromStatus,
      toStatus: updated.status,
      providerCode: updated.provider.code,
      providerLabel: updated.provider.label,
      nextStatus: nextFundingCaseStatus(updated.status),
      canCancel: canCancelFundingCase(updated.status),
    });
  } catch (e) {
    console.error('[financeurs/cases/[id]] PATCH', e);
    return fail('Failed to transition funding case', 500);
  }
}
