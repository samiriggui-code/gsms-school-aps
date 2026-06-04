import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { MarketingCampaignStatus } from '@repo/database';

type Ctx = { params: Promise<{ campaignId: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { campaignId } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.channel !== undefined) data.channel = String(body.channel).trim();
  if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;
  if (body.status !== undefined) {
    const status = String(body.status).trim() as MarketingCampaignStatus;
    if (!Object.values(MarketingCampaignStatus).includes(status)) return fail('Statut invalide.', 400);
    data.status = status;
  }

  try {
    await prisma.marketingCampaign.update({ where: { id: campaignId }, data });
    return ok({ updated: true });
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { campaignId } = await context.params;
  try {
    await prisma.marketingCampaign.delete({ where: { id: campaignId } });
    return ok({ deleted: true });
  } catch (e) {
    return fail('Suppression impossible.', 500, e);
  }
}
