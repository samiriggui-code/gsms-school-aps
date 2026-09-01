import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import {
  CandidatureSource,
  CandidatureStatus,
  LANDING_PREINSCRIPTION_LEAD_SOURCE,
} from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { createWorkflowEngine } from '@repo/api-core';
import { afterCandidatureCreated } from '@/lib/of/candidature-assessment-bootstrap';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ leadId: string }> };

/**
 * Cas rare : lead préinscription sans candidature (import partiel, données anciennes).
 * Rattache une candidature au compte utilisateur correspondant à l’email du lead.
 */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.communicationEdit)) {
    return fail('Forbidden', 403);
  }

  const { leadId } = await context.params;

  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        source: LANDING_PREINSCRIPTION_LEAD_SOURCE,
      },
      select: {
        id: true,
        email: true,
        notes: true,
        formationId: true,
        candidature: { select: { id: true } },
      },
    });

    if (!lead) {
      return fail('Lead introuvable ou ce n’est pas une préinscription.', 404);
    }

    if (lead.candidature) {
      return fail('Une candidature est déjà liée à ce lead.', 409);
    }

    const user = await prisma.user.findUnique({
      where: { email: lead.email },
      select: { id: true },
    });
    if (!user) {
      return fail(
        'Aucun compte candidat à cet email. Créez le dossier depuis Vie scolaire ou vérifiez l’adresse.',
        400,
      );
    }

    const candidature = await prisma.candidature.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        formationId: lead.formationId,
        source: CandidatureSource.LANDING_SESSION,
        status: CandidatureStatus.DRAFT,
        notes: lead.notes,
      },
      select: { id: true, userId: true },
    });

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.lead.converted',
        {
          leadId: lead.id,
          candidatureId: candidature.id,
          userId: candidature.userId,
          email: lead.email,
        },
        { dedupeKey: `workflow:lead-converted:${lead.id}` },
      );
      await workflows.emit(
        'crm.candidature.created',
        {
          candidatureId: candidature.id,
          userId: candidature.userId,
          email: lead.email,
          source: CandidatureSource.LANDING_SESSION,
          leadId: lead.id,
        },
        { dedupeKey: `workflow:candidature-created:${candidature.id}` },
      );
    } catch (e) {
      console.error('[convert-to-candidature] workflow', e);
    }

    await afterCandidatureCreated(prisma, candidature.id, request);

    return ok({
      candidatureId: candidature.id,
      userId: candidature.userId,
    });
  } catch (e) {
    console.error('[convert-to-candidature]', e);
    return fail('Création de la candidature impossible.', 500, e);
  }
}
