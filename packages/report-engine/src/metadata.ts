import { getReportTemplate } from './registry';
import type { ReportOutputFormat, ReportPeriod } from './types';

/** Métadonnées stockées dans FileAsset.metadata pour la datatable rapports. */
export type ReportFileMetadata = {
  templateId: string;
  label: string;
  moduleKey: string;
  format: ReportOutputFormat | 'CSV';
  period: ReportPeriod | string;
  periodLabel: string;
  description: string;
  jobId?: string;
  editedByUserId?: string;
  editedAt?: string;
};

export function buildReportFileMetadata(input: {
  templateKey: string;
  label: string;
  format: ReportOutputFormat | 'CSV';
  period: string;
  periodLabel: string;
  description?: string;
}): ReportFileMetadata {
  const tpl = getReportTemplate(input.templateKey);
  return {
    templateId: input.templateKey,
    label: input.label,
    moduleKey: tpl?.moduleKey ?? '',
    format: input.format,
    period: input.period,
    periodLabel: input.periodLabel,
    description: input.description ?? tpl?.description ?? '',
  };
}

export function parseReportFileMetadata(raw: unknown): ReportFileMetadata | null {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object') return null;
  const m = value as Record<string, unknown>;
  const templateId =
    typeof m.templateId === 'string'
      ? m.templateId
      : typeof m.templateKey === 'string'
        ? m.templateKey
        : null;
  const label =
    typeof m.label === 'string'
      ? m.label
      : typeof m.title === 'string'
        ? m.title
        : null;
  if (!templateId || !label) return null;
  const tpl = getReportTemplate(templateId);
  const fmt = m.format;
  return {
    templateId,
    label,
    moduleKey: String(m.moduleKey ?? tpl?.moduleKey ?? ''),
    format: (fmt === 'PDF' || fmt === 'EXCEL' || fmt === 'CSV' ? fmt : 'CSV') as ReportFileMetadata['format'],
    period: String(m.period ?? 'month'),
    periodLabel: String(m.periodLabel ?? ''),
    description: String(m.description ?? tpl?.description ?? ''),
    jobId: typeof m.jobId === 'string' ? m.jobId : undefined,
    editedByUserId: typeof m.editedByUserId === 'string' ? m.editedByUserId : undefined,
    editedAt: typeof m.editedAt === 'string' ? m.editedAt : undefined,
  };
}
