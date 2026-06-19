import type { DatagridExportKpi } from '@/lib/datagrid/export-document-types';

const FILTER_LABELS: Record<string, string> = {
  status: 'Statut',
  query: 'Recherche',
  profileType: 'Profil',
  kind: 'Type',
  page: 'Page',
  limit: 'Limite',
};

export function humanizeExportTitle(filename: string): string {
  const base = filename.replace(/\.(csv|xlsx|pdf)$/i, '').replace(/-/g, ' ').trim();
  if (!base) return 'Export';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function formatExportFiltersLabel(searchParams?: Record<string, string>): string {
  if (!searchParams) return 'Liste complète';

  const parts = Object.entries(searchParams)
    .filter(([key, value]) => key !== 'page' && key !== 'limit' && value.trim() !== '')
    .map(([key, value]) => {
      const label = FILTER_LABELS[key] ?? key;
      return `${label} : ${value}`;
    });

  return parts.length > 0 ? parts.join(' · ') : 'Liste complète';
}

function findStatusColumnIndex(headers: string[]): number {
  return headers.findIndex((header) => /état|statut|status|résultat/i.test(header));
}

export function buildAutoExportStats(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): DatagridExportKpi[] {
  const stats: DatagridExportKpi[] = [
    {
      label: 'Lignes exportées',
      value: rows.length,
      subtitle: 'Ensemble des enregistrements filtrés',
    },
    {
      label: 'Colonnes',
      value: headers.length,
      subtitle: 'Champs inclus dans l’export',
    },
  ];

  const statusIndex = findStatusColumnIndex(headers);
  if (statusIndex >= 0 && rows.length > 0) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const raw = row[statusIndex];
      const key = raw == null || String(raw).trim() === '' ? '—' : String(raw).trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const topStatuses = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    for (const [status, count] of topStatuses) {
      stats.push({
        label: status,
        value: count,
        subtitle: headers[statusIndex] ?? 'Répartition',
      });
    }
  }

  return stats.slice(0, 4);
}
