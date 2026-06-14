import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { ReportJobDto } from '@repo/api-core';
import type { ReportPeriod } from '@repo/report-engine';

async function parse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } }).error?.message ?? 'Erreur serveur';
    throw new Error(msg);
  }
  return unwrapSectionApiData<T>(json) as T;
}

export async function createReportJob(input: {
  templateKey: string;
  format: 'PDF' | 'EXCEL' | 'CSV';
  period: ReportPeriod;
  parameters?: Record<string, unknown>;
  customRange?: { start: string; end: string };
  title?: string;
  summary?: string;
}) {
  const res = await apiFetch('/api/reports/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parse<{ job: ReportJobDto }>(res);
}

export async function fetchReportJob(id: string) {
  const res = await apiFetch(`/api/reports/jobs/${id}`);
  return parse<{ job: ReportJobDto }>(res);
}

export function reportRenderPreviewUrl(jobId: string, token: string) {
  return `/reports/render/${jobId}?token=${encodeURIComponent(token)}`;
}
