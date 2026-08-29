import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FundingCaseStatus, FundingFunderType, FundingTransport } from '@repo/database';

const FUNDING_STATUSES = new Set(Object.values(FundingCaseStatus));
const FUNDER_TYPES = new Set(Object.values(FundingFunderType));
const TRANSPORTS = new Set(Object.values(FundingTransport));

/** POST — créer un FundingCase DRAFT (G5). */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const body = (await request.json()) as {
      providerId?: string;
      providerCode?: string;
      reference?: string;
      funderType?: string;
      transport?: string;
      status?: string;
      notes?: string;
      requestedAmount?: number | string | null;
      externalReference?: string;
    };

    const provider = body.providerId
      ? await prisma.fundingProvider.findUnique({ where: { id: body.providerId } })
      : body.providerCode
        ? await prisma.fundingProvider.findUnique({ where: { code: body.providerCode } })
        : null;

    if (!provider) return fail('FundingProvider required (providerId or providerCode)', 400);

    const funderType = (body.funderType as FundingFunderType | undefined) ?? provider.funderType;
    const transport = (body.transport as FundingTransport | undefined) ?? provider.transport;
    const status = (body.status as FundingCaseStatus | undefined) ?? FundingCaseStatus.DRAFT;

    if (!FUNDER_TYPES.has(funderType)) return fail('Invalid funderType', 400);
    if (!TRANSPORTS.has(transport)) return fail('Invalid transport', 400);
    if (!FUNDING_STATUSES.has(status)) return fail('Invalid status', 400);

    const amountRaw = body.requestedAmount;
    const requestedAmount =
      amountRaw === undefined || amountRaw === null || amountRaw === ''
        ? undefined
        : Number(amountRaw);
    if (requestedAmount !== undefined && Number.isNaN(requestedAmount)) {
      return fail('Invalid requestedAmount', 400);
    }

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.fundingCase.create({
        data: {
          providerId: provider.id,
          funderType,
          transport,
          status,
          reference: body.reference?.trim() || null,
          notes: body.notes?.trim() || null,
          externalReference: body.externalReference?.trim() || null,
          requestedAmount,
          ownerUserId: session.user?.id ?? null,
        },
        include: { provider: { select: { code: true, label: true } } },
      });
      await tx.fundingCaseEvent.create({
        data: {
          caseId: row.id,
          fromStatus: null,
          toStatus: row.status,
          source: 'ui',
          actorUserId: session.user?.id ?? null,
          payload: { action: 'create' },
        },
      });
      return row;
    });

    return ok({
      id: created.id,
      reference: created.reference,
      status: created.status,
      providerCode: created.provider.code,
      providerLabel: created.provider.label,
    });
  } catch (e) {
    console.error('[financeurs/cases] POST', e);
    return fail('Failed to create funding case', 500);
  }
}
