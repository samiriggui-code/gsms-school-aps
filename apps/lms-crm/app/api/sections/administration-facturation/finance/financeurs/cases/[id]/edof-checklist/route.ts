import { getServerSession } from 'next-auth/next';
import { FundingFunderType } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  buildEdofDossierChecklist,
  EDOF_DOSSIER_STEPS,
} from '@/lib/connectors/edof/edof-dossier-checklist';

type Ctx = { params: Promise<{ id: string }> };

/** GET — checklist manuelle EDOF_DOSSIER pour un FundingCase CPF. */
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
    if (fundingCase.funderType !== FundingFunderType.CPF) {
      return fail('EDOF dossier checklist applies only to CPF funding cases', 400);
    }

    const steps = buildEdofDossierChecklist({
      caseStatus: fundingCase.status,
      documents: fundingCase.documents,
    });

    return ok({
      connector: 'EDOF_DOSSIER',
      transport: 'MANUAL_PORTAL',
      caseId: fundingCase.id,
      reference: fundingCase.reference,
      status: fundingCase.status,
      providerLabel: fundingCase.provider.label,
      steps,
      dueCount: steps.filter((s) => s.state === 'due').length,
      doneCount: steps.filter((s) => s.state === 'done').length,
    });
  } catch (e) {
    console.error('[edof-checklist] GET', e);
    return fail('Failed to load EDOF checklist', 500);
  }
}

/**
 * POST — marquer une étape EDOF comme faite (upsert FundingDocument VALIDATED).
 * Body: `{ stepCode: "EDOF_ENTREE_FORMATION" }`
 */
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

  const stepCode = body.stepCode?.trim();
  const step = EDOF_DOSSIER_STEPS.find((s) => s.code === stepCode);
  if (!step) return fail('Unknown EDOF step code', 400);

  try {
    const fundingCase = await prisma.fundingCase.findUnique({ where: { id } });
    if (!fundingCase) return fail('Funding case not found', 404);
    if (fundingCase.funderType !== FundingFunderType.CPF) {
      return fail('EDOF dossier checklist applies only to CPF funding cases', 400);
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
    const steps = buildEdofDossierChecklist({
      caseStatus: fundingCase.status,
      documents: docs,
    });

    return ok({ document, steps });
  } catch (e) {
    console.error('[edof-checklist] POST', e);
    return fail('Failed to mark EDOF step done', 500);
  }
}
