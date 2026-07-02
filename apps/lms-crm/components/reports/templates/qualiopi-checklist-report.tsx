'use client';

const STATUS_LABEL: Record<string, string> = {
  ok: 'Conforme',
  review: 'À revoir',
  alert: 'Alerte',
};

const STATUS_CLASS: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  review: 'bg-amber-50 text-amber-900 border-amber-200',
  alert: 'bg-red-50 text-red-800 border-red-200',
};

export type QualiopiChecklistReportData = {
  quarter: number;
  year: number;
  summary: string;
  indicators: { id: number; label: string; status: string; detail: string }[];
};

export function QualiopiChecklistReport({ data }: { data: QualiopiChecklistReportData }) {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
        <p className="text-sm font-semibold text-indigo-900">
          Revue Qualiopi — T{data.quarter} {data.year}
        </p>
        <p className="mt-1 text-sm text-indigo-800">{data.summary}</p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
          8 indicateurs qualité
        </h2>
        <div className="space-y-3">
          {data.indicators.map((indicator) => (
            <div
              key={indicator.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {indicator.id}. {indicator.label}
                </p>
                <p className="mt-1 text-xs text-slate-600">{indicator.detail}</p>
              </div>
              <span
                className={`inline-flex shrink-0 self-start rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[indicator.status] ?? STATUS_CLASS.review}`}
              >
                {STATUS_LABEL[indicator.status] ?? indicator.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
