import type { PrismaClient, ReportGenerationJob, ReportJobStatus, ReportOutputFormat } from '@repo/database';
import {
  getReportTemplate,
  resolveReportPeriod,
  validateTemplateParameters,
  type ReportPeriod,
} from '@repo/report-engine';
import {
  ReportDedupService,
  ReportGenerationSkippedError,
  buildReportDedupeBucketKey,
  type ReportGenerationSource,
} from './report-dedup';

export type CreateReportJobInput = {
  templateKey: string;
  format: ReportOutputFormat;
  period: ReportPeriod | string;
  requestedById: string;
  parameters?: Record<string, unknown>;
  customRange?: { start: Date; end: Date };
  title?: string;
  summary?: string;
  /** Fenêtre calendaire explicite (automatisations). */
  periodStart?: Date;
  periodEnd?: Date;
  periodLabel?: string;
  dedupeBucketKey?: string;
  scheduleId?: string;
  generationSource?: ReportGenerationSource;
  skipDedup?: boolean;
};

export type ReportJobDto = {
  id: string;
  templateKey: string;
  format: ReportOutputFormat;
  period: string;
  periodLabel: string;
  title: string;
  summary: string | null;
  status: ReportJobStatus;
  progress: number;
  errorMessage: string | null;
  fileAssetId: string | null;
  createdAt: string;
  completedAt: string | null;
  requestedByName: string | null;
};

export class ReportJobService {
  constructor(private readonly prisma: PrismaClient) {}

  async createJob(input: CreateReportJobInput): Promise<ReportGenerationJob> {
    const template = getReportTemplate(input.templateKey);
    if (!template) throw new Error(`Modèle inconnu : ${input.templateKey}`);

    const paramErr = validateTemplateParameters(template, input.parameters ?? {});
    if (paramErr) throw new Error(paramErr);

    const fmt = input.format;
    if (!template.supportedFormats.includes(fmt as 'PDF' | 'EXCEL' | 'CSV')) {
      throw new Error(`Format ${fmt} non supporté pour ${template.label}`);
    }

    const range = input.periodStart && input.periodEnd
      ? {
          period: String(input.period),
          start: input.periodStart,
          end: input.periodEnd,
          label: input.periodLabel ?? String(input.period),
        }
      : resolveReportPeriod(input.period as ReportPeriod, input.customRange);

    const bucketKey =
      input.dedupeBucketKey ??
      `${range.period}:${range.start.toISOString().slice(0, 10)}:${range.end.toISOString().slice(0, 10)}`;
    const dedupeKey = buildReportDedupeBucketKey(template.key, fmt, bucketKey);

    if (!input.skipDedup) {
      const dedup = new ReportDedupService(this.prisma);
      const check = await dedup.assertCanGenerate({
        templateKey: template.key,
        format: fmt,
        periodStart: range.start,
        periodEnd: range.end,
        dedupeBucketKey: bucketKey,
        requestedById: input.requestedById,
      });
      if (check.skip) throw new ReportGenerationSkippedError(check);
    }

    const parameters = {
      ...(input.parameters ?? {}),
      dedupeBucketKey: dedupeKey,
      ...(input.scheduleId ? { scheduleId: input.scheduleId } : {}),
      ...(input.generationSource ? { generationSource: input.generationSource } : {}),
    };

    return this.prisma.reportGenerationJob.create({
      data: {
        templateKey: template.key,
        format: fmt,
        period: range.period,
        periodStart: range.start,
        periodEnd: range.end,
        periodLabel: range.label,
        title: input.title?.trim() || template.label,
        summary: input.summary?.trim() || template.description,
        parameters: parameters as object,
        requestedById: input.requestedById,
      },
    });
  }

  async getJob(id: string): Promise<ReportGenerationJob | null> {
    return this.prisma.reportGenerationJob.findUnique({ where: { id } });
  }

  async getJobForRender(id: string, token: string): Promise<ReportGenerationJob | null> {
    return this.prisma.reportGenerationJob.findFirst({
      where: { id, renderToken: token },
    });
  }

  async listPending(limit = 5): Promise<ReportGenerationJob[]> {
    return this.prisma.reportGenerationJob.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markRunning(id: string): Promise<void> {
    await this.prisma.reportGenerationJob.update({
      where: { id },
      data: { status: 'RUNNING', progress: 10 },
    });
  }

  async markCompleted(id: string, fileAssetId: string): Promise<void> {
    await this.prisma.reportGenerationJob.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        fileAssetId,
        completedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async markFailed(id: string, message: string): Promise<void> {
    await this.prisma.reportGenerationJob.update({
      where: { id },
      data: { status: 'FAILED', errorMessage: message.slice(0, 2000) },
    });
  }

  async listRecentForUser(userId: string, limit = 50): Promise<ReportJobDto[]> {
    const rows = await this.prisma.reportGenerationJob.findMany({
      where: { requestedById: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        requestedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return rows.map((r) => this.toDto(r));
  }

  toDto(
    job: ReportGenerationJob & {
      requestedBy?: { firstName: string | null; lastName: string | null; email: string } | null;
    },
  ): ReportJobDto {
    const name = job.requestedBy
      ? [job.requestedBy.firstName, job.requestedBy.lastName].filter(Boolean).join(' ').trim()
      : '';
    return {
      id: job.id,
      templateKey: job.templateKey,
      format: job.format,
      period: job.period,
      periodLabel: job.periodLabel,
      title: job.title,
      summary: job.summary,
      status: job.status,
      progress: job.progress,
      errorMessage: job.errorMessage,
      fileAssetId: job.fileAssetId,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
      requestedByName: name || job.requestedBy?.email || null,
    };
  }
}
