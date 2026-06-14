'use client';

function formatDateFr(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export type EmargementReportData = {
  formationName: string;
  sessionLabel: string;
  location: string;
  trainerName: string;
  attendanceDate: string;
  participants: { index: number; name: string; email: string }[];
};

export function RhEmargementSessionReport({ data }: { data: EmargementReportData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Formation</p>
          <p className="font-medium">{data.formationName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Session</p>
          <p className="font-medium">{data.sessionLabel}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Lieu</p>
          <p className="font-medium">{data.location}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Formateur</p>
          <p className="font-medium">{data.trainerName}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Date</p>
          <p className="font-medium">{formatDateFr(data.attendanceDate)}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-800 text-left text-xs uppercase text-white">
            <th className="border border-slate-300 px-3 py-2 w-12">N°</th>
            <th className="border border-slate-300 px-3 py-2">Nom et prénom</th>
            <th className="border border-slate-300 px-3 py-2">Email</th>
            <th className="border border-slate-300 px-3 py-2 w-40">Signature</th>
          </tr>
        </thead>
        <tbody>
          {data.participants.map((p) => (
            <tr key={p.index}>
              <td className="border border-slate-200 px-3 py-3 text-center">{p.index}</td>
              <td className="border border-slate-200 px-3 py-3 font-medium">{p.name}</td>
              <td className="border border-slate-200 px-3 py-3 text-slate-600">{p.email}</td>
              <td className="border border-slate-200 px-3 py-8" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
