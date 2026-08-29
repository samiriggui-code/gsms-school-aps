import {
  ComplianceDossierKind,
  ComplianceSubjectType,
  SubcontractorQualificationStatus,
} from '@repo/database';
import { ComplianceService } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, GOVERNANCE_PERMISSION } from '@/lib/auth/crm-permissions';
import { requirePermission } from '@/lib/auth/require-permission';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';
import { canSetSubcontractorStatus } from '@/lib/organisation/subcontractor-transitions';

/** WF-39 — liste + création sous-traitants. */
export async function GET() {
  const auth = await requirePermission(GOVERNANCE_PERMISSION.conformiteView);
  if ('error' in auth) return auth.error;

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
  const auth = await requirePermission(CRM_PERMISSION.ressourcesEdit);
  if ('error' in auth) return auth.error;

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
        actorUserId: auth.userId,
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
