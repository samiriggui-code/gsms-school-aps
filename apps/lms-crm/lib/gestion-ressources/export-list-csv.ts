import { apiFetch } from '@/lib/api';
import { downloadCsv } from '@/lib/csv-export';

type ExportListCsvOptions = {
  apiPath: string;
  filename: string;
  headers: string[];
  mapRow: (item: Record<string, unknown>) => (string | number | null | undefined)[];
  searchParams?: Record<string, string>;
  limit?: number;
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

export async function exportListCsv({
  apiPath,
  filename,
  headers,
  mapRow,
  searchParams = {},
  limit = 5000,
}: ExportListCsvOptions) {
  const params = new URLSearchParams({ page: '1', limit: String(limit), ...searchParams });
  const response = await apiFetch(`${apiPath}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('export_failed');
  }

  const json = await response.json();
  const payload =
    json && typeof json === 'object' && 'success' in json && (json as { data?: unknown }).data !== undefined
      ? (json as { data: unknown }).data
      : json;
  const rows = normalizeListPayload(payload).map(mapRow);
  downloadCsv(filename, headers, rows);
}
