'use client';

export type OpsWeeklyReportData = {
  summary: string;
  kpis: { label: string; value: string | number; subtitle: string }[];
  financeHighlights: { label: string; value: string }[];
};

export function PilotageOpsWeeklyReport({ data }: { data: OpsWeeklyReportData }) {
  return (
    <div className="space-y-8">
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{data.summary}</p>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Indicateurs ops</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-500">{kpi.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {data.financeHighlights.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Finance (aperçu)</h3>
          <div className="grid grid-cols-2 gap-3">
            {data.financeHighlights.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 p-3 text-sm">
                <span className="text-slate-500">{item.label}</span>
                <p className="mt-1 font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
