'use client';

export type ContratTravailReportData = {
  fullName: string;
  email: string;
  jobFunction: string;
  qualification: string;
  contractType: string;
  workTime: string;
  contractStartDate: string;
  contractEndDate: string;
  address: string;
  cartePro: string;
  carteProExpiry: string;
  rows: { label: string; value: string }[];
};

export function RhContratTravailReport({ data }: { data: ContratTravailReportData }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-slate-800 bg-gradient-to-br from-slate-50 to-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Synthèse contractuelle</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">{data.fullName}</h2>
        <p className="text-sm text-slate-600">{data.email}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">{data.contractType}</span>
          <span className="rounded-full border border-slate-300 px-4 py-1 text-sm font-medium text-slate-700">
            {data.workTime}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-slate-200 px-4 py-3">
            <dt className="text-xs font-semibold uppercase text-slate-500">{r.label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{r.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-xs text-slate-500 italic">
        Document de synthèse RH — ne remplace pas un contrat de travail signé. Généré depuis le dossier collaborateur CRM.
      </p>
    </div>
  );
}
