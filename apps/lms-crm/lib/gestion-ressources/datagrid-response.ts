import type { DataGridApiResponse } from '@/components/ui/data-grid';

/** Normalise une réponse liste DataGrid (propriété `empty` requise). */
export function buildDataGridListResponse<T>(
  rows: T[],
  pagination: { total: number; page: number },
): DataGridApiResponse<T> {
  return {
    data: rows,
    pagination,
    empty: rows.length === 0,
  };
}
