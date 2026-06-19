'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  exportListData,
  type ExportFormat,
  type ListExportConfig,
} from '@/lib/datagrid/list-export';

export function useDatagridExport(config: ListExportConfig) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const exportAs = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      setExportingFormat(format);
      try {
        const count = await exportListData(config, format);
        const label = format === 'csv' ? 'CSV' : format === 'excel' ? 'Excel' : 'PDF';
        toast.success(`Export ${label} — ${count} ligne${count > 1 ? 's' : ''}.`);
      } catch {
        toast.error("Impossible d'exporter la liste.");
      } finally {
        setIsExporting(false);
        setExportingFormat(null);
      }
    },
    [config],
  );

  return { exportAs, isExporting, exportingFormat };
}
