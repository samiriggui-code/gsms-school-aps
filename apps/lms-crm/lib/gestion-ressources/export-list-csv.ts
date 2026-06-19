import { exportListData, type ExportFormat } from '@/lib/datagrid/list-export';

export { exportListData, fetchListForExport, type ExportFormat, type ListExportConfig } from '@/lib/datagrid/list-export';

type ExportListCsvOptions = {
  apiPath: string;
  filename: string;
  headers: string[];
  mapRow: (item: Record<string, unknown>) => (string | number | null | undefined)[];
  searchParams?: Record<string, string>;
  limit?: number;
};

/** @deprecated Préférer exportListData / DataGridExportMenu */
export async function exportListCsv(options: ExportListCsvOptions) {
  await exportListData(options, 'csv');
}
