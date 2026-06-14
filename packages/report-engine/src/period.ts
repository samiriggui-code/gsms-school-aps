import type { ReportPeriod, ReportPeriodRange } from './types';

export function resolveReportPeriod(
  period: ReportPeriod,
  custom?: { start: Date; end: Date },
): ReportPeriodRange {
  const end = new Date();
  const start = new Date(end);

  if (period === 'custom' && custom) {
    return {
      period,
      start: custom.start,
      end: custom.end,
      label: `${formatShort(custom.start)} — ${formatShort(custom.end)}`,
    };
  }

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      return { period, start, end, label: "Aujourd'hui" };
    case 'week':
      start.setDate(start.getDate() - 7);
      return { period, start, end, label: '7 derniers jours' };
    case 'month':
      start.setMonth(start.getMonth() - 1);
      return { period, start, end, label: '30 derniers jours' };
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      return { period, start, end, label: '12 derniers mois' };
    default:
      start.setMonth(start.getMonth() - 1);
      return { period: 'month', start, end, label: '30 derniers jours' };
  }
}

function formatShort(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Bornes inclusives pour filtres liste (début 00:00, fin 23:59:59). */
export function normalizeCustomDateRange(range: { start: Date; end: Date }): { start: Date; end: Date } {
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
