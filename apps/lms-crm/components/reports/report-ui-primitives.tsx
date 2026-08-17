'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ReportPageBreak() {
  return <div className="report-page-break" aria-hidden />;
}

type ReportSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  breakable?: boolean;
  className?: string;
};

export function ReportSection({ title, description, children, breakable, className }: ReportSectionProps) {
  return (
    <section className={cn('report-section', breakable && 'report-section--breakable', className)}>
      <div className="mb-4 border-b border-slate-200 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

type KpiItem = { label: string; value: string | number; subtitle?: string };

export function ReportKpiGrid({ items, columns = 3 }: { items: KpiItem[]; columns?: 2 | 3 | 4 }) {
  const colClass =
    columns === 4 ? 'sm:grid-cols-4' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  return (
    <div className={cn('grid grid-cols-2 gap-3', colClass)}>
      {items.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{kpi.value}</p>
          {kpi.subtitle ? <p className="text-xs text-slate-500">{kpi.subtitle}</p> : null}
        </div>
      ))}
    </div>
  );
}

export type ReportTableColumn<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  cell: (row: T) => ReactNode;
  className?: string;
};

type ReportDataTableProps<T> = {
  columns: ReportTableColumn<T>[];
  rows: T[];
  emptyLabel?: string;
  caption?: string;
  dense?: boolean;
};

export function ReportDataTable<T extends { id?: string } | Record<string, unknown>>({
  columns,
  rows,
  emptyLabel = 'Aucune donnée sur la période.',
  caption,
  dense,
}: ReportDataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className={cn('w-full border-collapse text-left', dense ? 'text-[10px]' : 'text-xs')}>
        {caption ? (
          <caption className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-start text-[10px] font-medium text-slate-600">
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr className="border-b border-slate-200 bg-slate-100/90">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2 font-semibold uppercase tracking-wide text-slate-600',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={'id' in row && row.id ? String(row.id) : i}
                className="border-b border-slate-100 last:border-0 even:bg-slate-50/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2 align-top text-slate-800',
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ReportCallout({
  title,
  children,
  tone = 'neutral',
}: {
  title?: string;
  children: ReactNode;
  tone?: 'neutral' | 'info' | 'warning' | 'success';
}) {
  const toneClass =
    tone === 'info'
      ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
          : 'border-slate-200 bg-slate-50 text-slate-800';
  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm leading-relaxed', toneClass)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? 'mt-1 text-xs sm:text-sm' : undefined}>{children}</div>
    </div>
  );
}

export function ReportStatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'ok' | 'review' | 'alert' | 'neutral';
}) {
  const cls =
    tone === 'ok'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : tone === 'review'
        ? 'bg-amber-100 text-amber-900 border-amber-200'
        : tone === 'alert'
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
        cls,
      )}
    >
      {label}
    </span>
  );
}

export function ReportKeyValueList({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-slate-100 bg-white px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
