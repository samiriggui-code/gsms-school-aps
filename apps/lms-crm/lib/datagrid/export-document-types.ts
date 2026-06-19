export type DatagridExportKpi = {
  label: string;
  value: string | number;
  subtitle?: string;
};

export type DatagridExportDocument = {
  title: string;
  subtitle?: string;
  summary?: string | null;
  periodLabel: string;
  generatedAt: string;
  authorName?: string | null;
  authorEmail?: string | null;
  authorAvatarUrl?: string | null;
  headers: string[];
  rows: (string | number)[][];
  stats?: DatagridExportKpi[];
};

export const DATAGRID_EXPORT_CACHE_PREFIX = 'datagrid-export:';
export const DATAGRID_EXPORT_TTL_SECONDS = 300;
