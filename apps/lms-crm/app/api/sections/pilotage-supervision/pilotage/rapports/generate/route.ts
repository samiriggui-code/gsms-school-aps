import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import {
  PILOTAGE_REPORT_ENTITY,
  PILOTAGE_REPORT_MODULE,
  PilotageHubService,
  ReportDedupService,
  ReportGenerationSkippedError,
  buildReportDedupeBucketKey,
  notifyReportGenerated,
  sendReportGeneratedEmails,
  pilotagePeriodRange,
  type PilotagePeriod,
} from '@repo/api-core';
import { getReportTemplate } from '@repo/report-engine';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


const PERIODS = new Set<PilotagePeriod>(['day', 'week', 'month', 'quarter', 'year']);

function parsePeriod(raw: unknown): PilotagePeriod {
  if (typeof raw === 'string' && PERIODS.has(raw as PilotagePeriod)) return raw as PilotagePeriod;
  return 'month';
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.pilotageView)) {
    return fail('Forbidden', 403);
  }

  let body: { templateId?: string; period?: string; label?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const templateId = body.templateId?.trim();
  if (!templateId) return fail('templateId requis.', 400);
  const period = parsePeriod(body.period);

  try {
    const service = new PilotageHubService(prisma);
    const registryTpl = getReportTemplate(templateId);
    const legacyTpl = service.getLegacyReportTemplate(templateId);
    if (!registryTpl?.exportDataset && !legacyTpl?.exportDataset) {
      return fail('Modèle de rapport introuvable ou sans export CSV.', 404);
    }

    const prepared = await service.prepareReportCsv(templateId, period);
    if (!prepared) return fail('Impossible de préparer ce rapport.', 422);

    const range = pilotagePeriodRange(period);
    const bucketKey = `${period}:${range.start.toISOString().slice(0, 10)}:${range.end.toISOString().slice(0, 10)}`;
    const dedup = new ReportDedupService(prisma);
    const dup = await dedup.checkCsvDuplicate(templateId, bucketKey);
    if (dup.skip) {
      throw new ReportGenerationSkippedError(dup);
    }

    const meta = {
      ...prepared.meta,
      dedupeBucketKey: buildReportDedupeBucketKey(templateId, 'CSV', bucketKey),
      generationSource: 'manual' as const,
      ...(body.label?.trim() ? { label: body.label.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() } : {}),
    };

    const file = new File([prepared.content], prepared.filename, { type: 'text/csv;charset=utf-8' });
    const uploaded = await uploadFile({
      file,
      module: PILOTAGE_REPORT_MODULE,
      entityType: PILOTAGE_REPORT_ENTITY,
      entityId: templateId,
      category: 'export',
      visibility: 'private',
    });

    const asset = await prisma.fileAsset.create({
      data: {
        module: PILOTAGE_REPORT_MODULE,
        entityType: PILOTAGE_REPORT_ENTITY,
        entityId: templateId,
        category: 'export',
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        storageKey: uploaded.key,
        url: uploaded.url,
        visibility: 'PRIVATE',
        status: 'ACTIVE',
        metadata: meta,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    await prisma.systemLog.create({
      data: {
        userId: session.user.id,
        entityId: asset.id,
        entityType: PILOTAGE_REPORT_ENTITY,
        event: 'pilotage.report.generated',
        description: `Rapport généré : ${meta.label}`,
        meta: JSON.stringify({ templateId, period, format: 'CSV' }),
      },
    });

    const row = service.serializeReportAsset(asset);
    if (!row) return fail('Rapport créé mais sérialisation impossible.', 500);

    try {
      await notifyReportGenerated(prisma, {
        jobId: asset.id,
        fileAssetId: asset.id,
        templateKey: templateId,
        title: meta.label,
        periodLabel: meta.periodLabel,
        format: 'CSV',
        requestedById: session.user.id,
        source: 'manual',
      });
      await sendReportGeneratedEmails(prisma, {
        jobId: asset.id,
        fileAssetId: asset.id,
        templateKey: templateId,
        title: meta.label,
        periodLabel: meta.periodLabel,
        format: 'CSV',
        requestedById: session.user.id,
        source: 'manual',
      });
    } catch (err) {
      console.error('[pilotage-rapports-generate] notification', err);
    }

    return ok({ row });
  } catch (error) {
    if (error instanceof ReportGenerationSkippedError) {
      return fail(error.message, 409, {
        code: error.code,
        existingJobId: error.existingJobId,
        existingFileAssetId: error.existingFileAssetId,
      });
    }
    console.error('[pilotage-rapports-generate]', error);
    return fail('Génération du rapport impossible.', 500, error);
  }
}
