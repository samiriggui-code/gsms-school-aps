import { NextRequest } from 'next/server';
import {
  ReportGenerationSkippedError,
  enqueueReportFromN8n,
  type N8nEnqueueReportInput,
} from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';

export async function POST(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  let body: N8nEnqueueReportInput;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  if (!body.templateKey?.trim()) return fail('templateKey requis.', 400);

  try {
    const job = await enqueueReportFromN8n(prisma, {
      ...body,
      templateKey: body.templateKey.trim(),
    });
    return ok({ jobId: job.id, status: job.status });
  } catch (error) {
    if (error instanceof ReportGenerationSkippedError) {
      return ok({
        skipped: true,
        reason: error.message,
        existingJobId: error.existingJobId,
        existingFileAssetId: error.existingFileAssetId,
      });
    }
    console.error('[n8n-reports-enqueue]', error);
    return fail(error instanceof Error ? error.message : 'Enqueue impossible.', 500);
  }
}
