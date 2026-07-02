'use client';

export type GrConformiteReportData = {
  kpis: { label: string; value: string | number; subtitle: string }[];
  criticalRows: {
    name: string;
    email: string;
    function: string;
    carteProExpiry: string;
    permitExpiry: string;
  }[];
  soonRows: {
    name: string;
    email: string;
    carteProExpiry: string;
    permitExpiry: string;
  }[];
};

export function PilotageGrConformiteReport({ data }: { data: GrConformiteReportData }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Synthèse</h2>
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
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Échéances critiques (&lt; 7 jours)</h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pe-2">Collaborateur</th>
              <th className="py-2 pe-2">Fonction</th>
              <th className="py-2 pe-2">Carte pro</th>
              <th className="py-2">Titre séjour</th>
            </tr>
          </thead>
          <tbody>
            {data.criticalRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-slate-500">
                  Aucune échéance critique sur la période.
                </td>
              </tr>
            ) : (
              data.criticalRows.map((row) => (
                <tr key={row.email} className="border-b border-slate-100">
                  <td className="py-2 pe-2 font-medium text-slate-900">{row.name}</td>
                  <td className="py-2 pe-2">{row.function}</td>
                  <td className="py-2 pe-2">{row.carteProExpiry}</td>
                  <td className="py-2">{row.permitExpiry}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {data.soonRows.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Échéances à 30 jours</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pe-2">Collaborateur</th>
                <th className="py-2 pe-2">Carte pro</th>
                <th className="py-2">Titre séjour</th>
              </tr>
            </thead>
            <tbody>
              {data.soonRows.map((row) => (
                <tr key={row.email} className="border-b border-slate-100">
                  <td className="py-2 pe-2 font-medium text-slate-900">{row.name}</td>
                  <td className="py-2 pe-2">{row.carteProExpiry}</td>
                  <td className="py-2">{row.permitExpiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
