import { getServerSession } from 'next-auth/next';
import {
  ComplianceDossierKind,
  ComplianceItemStatus,
  ComplianceSubjectType,
  CrmCompanyKind,
} from '@repo/database';
import { ComplianceService } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { QUALIOPI_SCHOOL_SUBJECT_ID } from '@/lib/of/qualiopi-indicators';
import { ensureDisabilityReferentTemplate } from '@/lib/organisation/ensure-disability-referent-template';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

const SATISFIED: ComplianceItemStatus[] = ['RECEIVED', 'VALIDATED', 'WAIVED'];

async function recompute(dossierId: string) {
  const items = await prisma.complianceDossierItem.findMany({
    where: { dossierId },
    select: { required: true, status: true },
  });
  const applicable = items.filter((i) => i.required);
  const total = applicable.length || 1;
  const satisfied = applicable.filter((i) => SATISFIED.includes(i.status)).length;
  const completenessPct = Math.round((satisfied / total) * 100);
  const hasExpired = items.some((i) => i.required && i.status === 'EXPIRED');
  const missingCount = applicable.filter((i) => !SATISFIED.includes(i.status)).length;
  const status = hasExpired ? 'EXPIRED' : missingCount === 0 ? 'COMPLETE' : 'INCOMPLETE';
  await prisma.complianceDossier.update({
    where: { id: dossierId },
    data: { completenessPct, status },
  });
}

/** WF-40 — contact référent + checklist Compliance DISABILITY_REFERENT + partenaires. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    await ensureDisabilityReferentTemplate();

    const settings = await prisma.systemSetting.findFirst({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        disabilityReferentName: true,
        disabilityReferentEmail: true,
        disabilityReferentPhone: true,
      },
    });

    const compliance = new ComplianceService(prisma);
    const dossier = await compliance.ensureDossier({
      kind: ComplianceDossierKind.DISABILITY_REFERENT,
      subjectType: ComplianceSubjectType.SCHOOL,
      subjectId: QUALIOPI_SCHOOL_SUBJECT_ID,
    });
    const summary = await compliance.getDossierSummary(dossier.id);

    const items = await prisma.complianceDossierItem.findMany({
      where: { dossierId: dossier.id },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        label: true,
        status: true,
        fileCategory: true,
        rejectionReason: true,
        validatedAt: true,
      },
    });

    const partners = await prisma.company.findMany({
      where: { kind: CrmCompanyKind.PARTNER, isActive: true },
      orderBy: { name: 'asc' },
      take: 50,
      select: { id: true, name: true, email: true, phone: true, notes: true },
    });

    return ok({
      settings: settings
        ? {
            id: settings.id,
            disabilityReferentName: settings.disabilityReferentName,
            disabilityReferentEmail: settings.disabilityReferentEmail,
            disabilityReferentPhone: settings.disabilityReferentPhone,
          }
        : null,
      dossierId: dossier.id,
      summary,
      items,
      partners,
    });
  } catch (e) {
    console.error('[referent-handicap] GET', e);
    return fail('Failed to load disability referent', 500);
  }
}

/** PATCH — met à jour les champs SystemSetting disabilityReferent*. */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  let body: {
    disabilityReferentName?: string | null;
    disabilityReferentEmail?: string | null;
    disabilityReferentPhone?: string | null;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  try {
    const settings = await prisma.systemSetting.findFirst({ orderBy: { id: 'asc' } });
    if (!settings) return fail('SystemSetting introuvable', 404);

    const trimOrNull = (v: string | null | undefined) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const t = v.trim();
      return t.length ? t : null;
    };

    const updated = await prisma.systemSetting.update({
      where: { id: settings.id },
      data: {
        ...(body.disabilityReferentName !== undefined
          ? { disabilityReferentName: trimOrNull(body.disabilityReferentName) }
          : {}),
        ...(body.disabilityReferentEmail !== undefined
          ? { disabilityReferentEmail: trimOrNull(body.disabilityReferentEmail) }
          : {}),
        ...(body.disabilityReferentPhone !== undefined
          ? { disabilityReferentPhone: trimOrNull(body.disabilityReferentPhone) }
          : {}),
      },
      select: {
        id: true,
        disabilityReferentName: true,
        disabilityReferentEmail: true,
        disabilityReferentPhone: true,
      },
    });

    return ok({ settings: updated });
  } catch (e) {
    console.error('[referent-handicap] PATCH', e);
    return fail('Failed to update referent contact', 500);
  }
}

/**
 * POST — marque une pièce checklist VALIDATED + Evidence DISABILITY_REFERENT_ACTION_RECORDED.
 * Body: `{ itemId, note? }`
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  let body: { itemId?: string; note?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const itemId = body.itemId?.trim();
  if (!itemId) return fail('itemId is required', 400);
  const note =
    typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;

  try {
    const existing = await prisma.complianceDossierItem.findUnique({
      where: { id: itemId },
      include: { dossier: { select: { id: true, kind: true } } },
    });
    if (!existing) return fail('Item not found', 404);
    if (existing.dossier.kind !== ComplianceDossierKind.DISABILITY_REFERENT) {
      return fail('Item does not belong to DISABILITY_REFERENT dossier', 400);
    }

    const fromStatus = existing.status;
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.complianceDossierItem.update({
        where: { id: itemId },
        data: {
          status: ComplianceItemStatus.VALIDATED,
          validatedAt: new Date(),
          validatedById: session.user.id,
          ...(note ? { rejectionReason: note } : {}),
        },
      });

      await tx.complianceItemEvent.create({
        data: {
          dossierId: row.dossierId,
          dossierItemId: row.id,
          eventType: 'ITEM_UPDATED',
          actorId: session.user.id,
          payload: {
            status: row.status,
            note,
            source: 'disability-referent-action',
          },
        },
      });

      await recordStatusEvidence(tx, {
        category: 'disability_referent',
        sourceType: 'LOG',
        sourceId: row.id,
        eventName: 'DISABILITY_REFERENT_ACTION_RECORDED',
        fromStatus,
        toStatus: ComplianceItemStatus.VALIDATED,
        indicatorCodes: ['Q-I20', 'Q-I26'],
        metadata: {
          itemCode: row.code,
          dossierId: row.dossierId,
          note,
        },
      });

      return row;
    });

    await recompute(updated.dossierId);

    return ok({
      item: {
        id: updated.id,
        code: updated.code,
        label: updated.label,
        status: updated.status,
        rejectionReason: updated.rejectionReason,
        validatedAt: updated.validatedAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    console.error('[referent-handicap] POST', e);
    return fail('Failed to record disability action', 500);
  }
}
