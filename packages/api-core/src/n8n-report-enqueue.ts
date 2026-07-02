import type { PrismaClient, ReportOutputFormat, ReportScheduleFrequency } from '@repo/database';
import { getReportTemplate } from '@repo/report-engine';
import { ReportJobService } from './report-jobs';
import { resolveSchedulePeriod } from './report-dedup';

export type N8nEnqueueReportInput = {
  templateKey: string;
  format?: ReportOutputFormat;
  frequency?: ReportScheduleFrequency;
  period?: string;
  title?: string;
  summary?: string;
};

export async function enqueueReportFromN8n(prisma: PrismaClient, input: N8nEnqueueReportInput) {
  const template = getReportTemplate(input.templateKey);
  if (!template) throw new Error(`Modèle inconnu : ${input.templateKey}`);

  const requesterId =
    process.env.N8N_REPORT_REQUESTER_USER_ID ??
    (
      await prisma.user.findFirst({
        where: { status: 'ACTIVE', isTrashed: false },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
    )?.id;
  if (!requesterId) throw new Error('Aucun utilisateur actif pour la génération de rapport.');

  const format =
    input.format ??
    (template.supportedFormats.includes('PDF')
      ? 'PDF'
      : template.supportedFormats[0]);

  const frequency =
    input.frequency ??
    (input.templateKey.includes('weekly')
      ? 'WEEKLY'
      : input.templateKey.includes('monthly')
        ? 'MONTHLY'
        : 'QUARTERLY');

  const window = resolveSchedulePeriod(frequency);
  const jobService = new ReportJobService(prisma);

  return jobService.createJob({
    templateKey: input.templateKey,
    format,
    period: input.period ?? window.period,
    periodStart: window.start,
    periodEnd: window.end,
    periodLabel: window.label,
    dedupeBucketKey: `n8n:${window.bucketKey}`,
    requestedById: requesterId,
    title: input.title ?? template.label,
    summary: input.summary ?? template.description,
    generationSource: 'schedule',
    parameters: { n8nAutomation: true },
  });
}
