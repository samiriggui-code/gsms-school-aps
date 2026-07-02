'use client';

export type FinanceMonthlyReportData = {
  summary: string;
  kpis: { label: string; value: string | number; subtitle: string }[];
  overdueRows: {
    reference: string;
    title: string;
    amount: string;
    daysOverdue: number;
    candidate: string;
  }[];
};

export function FinanceMonthlySummaryReport({ data }: { data: FinanceMonthlyReportData }) {
  return (
    <div className="space-y-8">
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{data.summary}</p>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Indicateurs finance</h2>
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

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Impayés prioritaires</h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pe-2">Référence</th>
              <th className="py-2 pe-2">Titre</th>
              <th className="py-2 pe-2">Montant dû</th>
              <th className="py-2 pe-2">Retard (j)</th>
              <th className="py-2">Candidat</th>
            </tr>
          </thead>
          <tbody>
            {data.overdueRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-slate-500">
                  Aucun impayé enregistré.
                </td>
              </tr>
            ) : (
              data.overdueRows.map((row) => (
                <tr key={row.reference} className="border-b border-slate-100">
                  <td className="py-2 pe-2 font-mono text-[11px]">{row.reference}</td>
                  <td className="py-2 pe-2">{row.title}</td>
                  <td className="py-2 pe-2 font-medium">{row.amount}</td>
                  <td className="py-2 pe-2">{row.daysOverdue}</td>
                  <td className="py-2">{row.candidate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
