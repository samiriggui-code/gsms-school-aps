import { getServerSession } from 'next-auth/next';
import {
  ComplianceDossierKind,
  ComplianceSubjectType,
  SubcontractorQualificationStatus,
} from '@repo/database';
import { ComplianceService } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';
import { canSetSubcontractorStatus } from '@/lib/organisation/subcontractor-transitions';

/** WF-39 — liste + création sous-traitants. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const rows = await prisma.subcontractorRecord.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { events: true } },
      },
    });
    const byStatus = await prisma.subcontractorRecord.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return ok({
      total: rows.length,
      statusCounts: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      items: rows.map((r) => ({
        id: r.id,
        label: r.label,
        siret: r.siret,
        status: r.status,
        companyId: r.companyId,
        companyName: r.company?.name ?? null,
        complianceDossierId: r.complianceDossierId,
        notes: r.notes,
        eventCount: r._count.events,
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[sous-traitants] GET', e);
    return fail('Failed to list subcontractors', 500);
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  let body: { label?: string; siret?: string; companyId?: string; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail('Invalid JSON body', 400);
  }

  const label = body.label?.trim();
  if (!label) return fail('label is required', 400);

  try {
    const row = await prisma.subcontractorRecord.create({
      data: {
        label,
        siret: body.siret?.trim() || null,
        companyId: body.companyId?.trim() || null,
        notes: body.notes?.trim() || null,
        status: SubcontractorQualificationStatus.PENDING_VALIDATION,
      },
    });

    await prisma.subcontractorStatusEvent.create({
      data: {
        subcontractorId: row.id,
        fromStatus: null,
        toStatus: SubcontractorQualificationStatus.PENDING_VALIDATION,
        source: 'manual',
        actorUserId: session.user.id,
      },
    });

    const compliance = new ComplianceService(prisma);
    const dossier = await compliance.ensureDossier({
      kind: ComplianceDossierKind.SUBCONTRACTOR_QUALIFICATION,
      subjectType: ComplianceSubjectType.SUBCONTRACTOR,
      subjectId: row.id,
    });

    const created = await prisma.subcontractorRecord.update({
      where: { id: row.id },
      data: { complianceDossierId: dossier.id },
    });

    await recordStatusEvidence(prisma, {
      category: 'subcontractor',
      sourceType: 'VALIDATION',
      sourceId: created.id,
      eventName: 'SUBCONTRACTOR_STATUS_CHANGED',
      fromStatus: null,
      toStatus: SubcontractorQualificationStatus.PENDING_VALIDATION,
      companyId: created.companyId,
      indicatorCodes: ['Q-I27'],
    });

    return ok({ item: created }, 201);
  } catch (e) {
    console.error('[sous-traitants] POST', e);
    return fail('Failed to create subcontractor', 500);
  }
}
