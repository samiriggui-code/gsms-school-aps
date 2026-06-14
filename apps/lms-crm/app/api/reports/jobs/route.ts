import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { ReportJobService, ReportGenerationSkippedError } from '@repo/api-core';
import type { ReportOutputFormat } from '@repo/database';
import type { ReportPeriod } from '@repo/report-engine';
import { normalizeCustomDateRange } from '@repo/report-engine';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

const PERIODS = new Set<ReportPeriod>(['day', 'week', 'month', 'year', 'custom']);
const FORMATS = new Set<ReportOutputFormat>(['PDF', 'EXCEL', 'CSV']);

function parseCustomRange(body: {
  customRange?: { start?: string; end?: string };
}): { start: Date; end: Date } | undefined {
  const startRaw = body.customRange?.start;
  const endRaw = body.customRange?.end;
  if (!startRaw || !endRaw) return undefined;
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  return normalizeCustomDateRange({ start, end });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  let body: {
    templateKey?: string;
    format?: string;
    period?: string;
    parameters?: Record<string, unknown>;
    customRange?: { start?: string; end?: string };
    title?: string;
    summary?: string;
  };
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const templateKey = body.templateKey?.trim();
  const format = body.format?.toUpperCase() as ReportOutputFormat;
  const period = (body.period?.trim() || 'month') as ReportPeriod;

  if (!templateKey) return fail('templateKey requis.', 400);
  if (!FORMATS.has(format)) return fail('format invalide (PDF, EXCEL, CSV).', 400);
  if (!PERIODS.has(period)) return fail('period invalide.', 400);
  if (period === 'custom' && !parseCustomRange(body)) {
    return fail('customRange { start, end } requis pour period=custom.', 400);
  }

  try {
    const service = new ReportJobService(prisma);
    const job = await service.createJob({
      templateKey,
      format,
      period,
      requestedById: session.user.id,
      parameters: body.parameters,
      customRange: period === 'custom' ? parseCustomRange(body) : undefined,
      title: body.title,
      summary: body.summary,
      generationSource: 'manual',
    });
    return ok({ job: service.toDto(job) });
  } catch (error) {
    if (error instanceof ReportGenerationSkippedError) {
      return fail(error.message, 409, {
        code: error.code,
        existingJobId: error.existingJobId,
        existingFileAssetId: error.existingFileAssetId,
      });
    }
    const msg = error instanceof Error ? error.message : 'Création impossible';
    return fail(msg, 422, error);
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const limit = Math.min(100, Number(request.nextUrl.searchParams.get('limit') || 50));
  const service = new ReportJobService(prisma);
  const jobs = await service.listRecentForUser(session.user.id, limit);
  return ok({ jobs });
}
