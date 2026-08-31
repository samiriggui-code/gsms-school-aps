import { getServerSession } from 'next-auth/next';
import { FundingFunderType } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  buildOpcoDossierChecklist,
  isOpcoChecklistEligibleProvider,
  OPCO_DOSSIER_STEPS,
} from '@/lib/connectors/opco/opco-dossier-checklist';

type Ctx = { params: Promise<{ id: string }> };

/** GET — checklist manuelle OPCO (AFDAS/ATLAS / OPCO_HORS_APPRENTISSAGE). */
export async function GET(_request: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  try {
    const fundingCase = await prisma.fundingCase.findUnique({
      where: { id },
      include: {
        documents: { select: { id: true, code: true, status: true, label: true } },
        provider: { select: { code: true, label: true } },
      },
    });
    if (!fundingCase) return fail('Funding case not found', 404);
    if (fundingCase.funderType !== FundingFunderType.OPCO) {
      return fail('OPCO checklist applies only to OPCO funding cases', 400);
    }
    if (!isOpcoChecklistEligibleProvider(fundingCase.provider)) {
      return fail(
        'OPCO checklist limited to AFDAS/ATLAS (or matrix provider OPCO_HORS_APPRENTISSAGE)',
        400,
      );
    }

    const steps = buildOpcoDossierChecklist({
      caseStatus: fundingCase.status,
      documents: fundingCase.documents,
    });

    return ok({
      connector: 'OPCO_HORS_APPRENTISSAGE',
      transport: 'MANUAL_PORTAL',
      caseId: fundingCase.id,
      reference: fundingCase.reference,
      status: fundingCase.status,
      providerCode: fundingCase.provider.code,
      providerLabel: fundingCase.provider.label,
      steps,
      dueCount: steps.filter((s) => s.state === 'due').length,
      doneCount: steps.filter((s) => s.state === 'done').length,
    });
  } catch (e) {
    console.error('[opco-checklist] GET', e);
    return fail('Failed to load OPCO checklist', 500);
  }
}

/** POST — marquer étape OPCO faite (upsert FundingDocument VALIDATED). */
export async function POST(request: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  let body: { stepCode?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const step = OPCO_DOSSIER_STEPS.find((s) => s.code === body.stepCode?.trim());
  if (!step) return fail('Unknown OPCO step code', 400);

  try {
    const fundingCase = await prisma.fundingCase.findUnique({
      where: { id },
      include: { provider: { select: { code: true, label: true } } },
    });
    if (!fundingCase) return fail('Funding case not found', 404);
    if (fundingCase.funderType !== FundingFunderType.OPCO) {
      return fail('OPCO checklist applies only to OPCO funding cases', 400);
    }
    if (!isOpcoChecklistEligibleProvider(fundingCase.provider)) {
      return fail(
        'OPCO checklist limited to AFDAS/ATLAS (or matrix provider OPCO_HORS_APPRENTISSAGE)',
        400,
      );
    }

    const document = await prisma.fundingDocument.upsert({
      where: { caseId_code: { caseId: id, code: step.code } },
      create: {
        caseId: id,
        code: step.code,
        label: step.label,
        status: 'VALIDATED',
      },
      update: {
        label: step.label,
        status: 'VALIDATED',
      },
    });

    const docs = await prisma.fundingDocument.findMany({
      where: { caseId: id },
      select: { id: true, code: true, status: true },
    });
    const steps = buildOpcoDossierChecklist({
      caseStatus: fundingCase.status,
      documents: docs,
    });

    return ok({ document, steps });
  } catch (e) {
    console.error('[opco-checklist] POST', e);
    return fail('Failed to mark OPCO step done', 500);
  }
}
