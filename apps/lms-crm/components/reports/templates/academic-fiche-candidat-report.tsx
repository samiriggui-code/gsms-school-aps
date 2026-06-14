'use client';

export type FicheCandidatReportData = {
  fullName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  formationName: string;
  sessionLabel: string;
  birthDate: string;
  address: string;
  notes: string;
  createdAt: string;
  rows: { section: string; label: string; value: string }[];
};

export function AcademicFicheCandidatReport({ data }: { data: FicheCandidatReportData }) {
  const sections = [...new Set(data.rows.map((r) => r.section))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-slate-900">{data.fullName}</h2>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{data.status}</span>
        <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600">{data.source}</span>
      </div>

      {sections.map((section) => (
        <section key={section}>
          <h3 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">
            {section}
          </h3>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.rows
              .filter((r) => r.section === section)
              .map((r) => (
                <div key={`${r.section}-${r.label}`} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase text-slate-500">{r.label}</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{r.value}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
