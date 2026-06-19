import { apiFetch } from '@/lib/api';
import { downloadCsv } from '@/lib/csv-export';
import type { DatagridExportKpi } from '@/lib/datagrid/export-document-types';
import {
  buildAutoExportStats,
  formatExportFiltersLabel,
  humanizeExportTitle,
} from '@/lib/datagrid/export-document-utils';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export type ListExportConfig = {
  apiPath: string;
  filename: string;
  headers: string[];
  mapRow: (item: Record<string, unknown>) => (string | number | null | undefined)[];
  searchParams?: Record<string, string>;
  /** Nombre max de lignes exportées (toute la liste filtrée, pas la page courante). */
  limit?: number;
  /** Titre affiché sur le document PDF (sinon dérivé du filename). */
  title?: string;
  /** Sous-titre / module affiché sous le titre. */
  subtitle?: string;
  /** Résumé contextuel en en-tête du PDF. */
  summary?: string;
  /** Libellé de période / filtres (sinon dérivé des searchParams). */
  periodLabel?: string;
  /** KPIs personnalisés pour le PDF (sinon calcul automatique). */
  stats?: DatagridExportKpi[];
};

function normalizeListPayload(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as Record<string, unknown>[];
    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items as Record<string, unknown>[];
      if (Array.isArray(nested.data)) return nested.data as Record<string, unknown>[];
    }
    if (Array.isArray(record.items)) return record.items as Record<string, unknown>[];
  }

  return [];
}

export async function fetchListForExport({
  apiPath,
  searchParams = {},
  limit = 5000,
}: Pick<ListExportConfig, 'apiPath' | 'searchParams' | 'limit'>): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ page: '1', limit: String(limit), ...searchParams });
  const response = await apiFetch(`${apiPath}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('export_fetch_failed');
  }

  const json = await response.json();
  const payload =
    json && typeof json === 'object' && 'success' in json && (json as { data?: unknown }).data !== undefined
      ? (json as { data: unknown }).data
      : json;
  return normalizeListPayload(payload);
}

function sanitizeFilename(filename: string, ext: string) {
  const base = filename.replace(/\.(csv|xlsx|pdf)$/i, '');
  return `${base}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function downloadExcel(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(row.map((cell) => cell ?? ''));
  }
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, sanitizeFilename(filename, 'xlsx'));
}

async function downloadPdfReport(
  config: ListExportConfig,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const title = config.title ?? humanizeExportTitle(config.filename);
  const response = await apiFetch('/api/common/export/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      subtitle: config.subtitle,
      summary: config.summary ?? null,
      periodLabel: config.periodLabel ?? formatExportFiltersLabel(config.searchParams),
      headers,
      rows: rows.map((row) => row.map((cell) => cell ?? '')),
      stats: config.stats ?? buildAutoExportStats(headers, rows),
    }),
  });

  if (!response.ok) {
    throw new Error('export_pdf_failed');
  }

  const json = (await response.json()) as { success?: boolean; data?: { previewUrl?: string } };
  const previewUrl = json.data?.previewUrl;
  if (!previewUrl) {
    throw new Error('export_pdf_failed');
  }

  window.open(previewUrl, '_blank', 'noopener,noreferrer');
}

export async function exportListData(config: ListExportConfig, format: ExportFormat): Promise<number> {
  const items = await fetchListForExport(config);
  const rows = items.map(config.mapRow);

  if (format === 'csv') {
    downloadCsv(config.filename, config.headers, rows);
  } else if (format === 'excel') {
    await downloadExcel(config.filename, config.headers, rows);
  } else {
    await downloadPdfReport(config, config.headers, rows);
  }

  return rows.length;
}
