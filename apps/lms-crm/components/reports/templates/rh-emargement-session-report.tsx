'use client';

import { getAvatarUrl } from '@/lib/helpers';
import {
  formatEmargementDateFr,
  type EmargementReportData,
} from '@/lib/suivi-formations/emargement-report-types';

export type { EmargementReportData, EmargementReportParticipant } from '@/lib/suivi-formations/emargement-report-types';

function KpiCell({ label, value, hint }: { label: string; value: string; hint?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function RhEmargementSessionReport({ data }: { data: EmargementReportData }) {
  const brand = data.brand;
  const participantCount = data.participantCount ?? data.participants.length;
  const hasStatusColumn = data.participants.some((p) => p.statusLabel?.trim());
  const sessionEndHint =
    data.sessionEndLabel && data.sessionEndLabel !== '—'
      ? `Fin ${data.sessionEndLabel}`
      : null;

  return (
    <div className="emargement-print-root mx-auto max-w-[297mm] bg-white text-slate-900">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background: white !important; }
          .emargement-print-root {
            max-width: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .emargement-no-print { display: none !important; }
        }
      `}</style>

      {brand ? (
        <header className="mb-5 flex items-start gap-5 border-b-2 border-slate-800 pb-4">
          <div className="shrink-0">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logoUrl}
                alt={brand.companyName}
                className="h-11 w-auto max-w-[160px] object-contain object-left"
              />
            ) : (
              <p className="text-lg font-bold text-slate-900">{brand.companyName}</p>
            )}
          </div>
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">{brand.companyName}</p>
            {brand.addressLine ? <p>{brand.addressLine}</p> : null}
            {brand.legalLine ? <p>{brand.legalLine}</p> : null}
            {brand.contactLine ? <p>{brand.contactLine}</p> : null}
          </div>
          {brand.qualiopiLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.qualiopiLogoUrl} alt="Qualiopi" className="h-10 w-auto shrink-0 object-contain" />
          ) : null}
        </header>
      ) : null}

      <div className="mb-4 text-center">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          Feuille de présence
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Session de formation — émargement {data.slotLabel.toLowerCase()}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCell
          label="Durée formation"
          value={data.formationDuration?.trim() || '—'}
          hint="Référentiel catalogue"
        />
        <KpiCell
          label="Stagiaires confirmés"
          value={String(participantCount)}
          hint={data.capacityLabel}
        />
        <KpiCell
          label="Lieu / salle"
          value={data.location}
          hint={data.roomFloor ? `Étage ${data.roomFloor}` : null}
        />
        <KpiCell
          label="Date du jour"
          value={formatEmargementDateFr(data.attendanceDate)}
          hint={data.sessionStartLabel ? `Session ${data.sessionStartLabel}` : null}
        />
      </div>

      <div className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs sm:grid-cols-3">
        <div>
          <span className="font-semibold uppercase tracking-wide text-slate-500">Formation</span>
          <p className="mt-0.5 font-medium text-slate-900">{data.formationName}</p>
        </div>
        <div>
          <span className="font-semibold uppercase tracking-wide text-slate-500">Session</span>
          <p className="mt-0.5 font-medium text-slate-900">{data.sessionLabel}</p>
        </div>
        <div>
          <span className="font-semibold uppercase tracking-wide text-slate-500">Formateur</span>
          <p className="mt-0.5 font-medium text-slate-900">{data.trainerName}</p>
          {data.trainerEmail ? (
            <p className="text-[11px] text-slate-500">{data.trainerEmail}</p>
          ) : null}
        </div>
      </div>

      {data.journalNotes?.trim() ? (
        <div className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 text-xs">
          <p className="font-semibold uppercase tracking-wide text-amber-900/80">
            Notes journal — {data.slotLabel.toLowerCase()}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-slate-800">{data.journalNotes}</p>
        </div>
      ) : null}

      <table className="mb-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-800 text-left text-[11px] uppercase tracking-wide text-white">
            <th className="w-10 border border-slate-700 px-2 py-2.5 text-center">N°</th>
            <th className="w-12 border border-slate-700 px-2 py-2.5" />
            <th className="border border-slate-700 px-3 py-2.5">Nom et prénom</th>
            <th className="border border-slate-700 px-3 py-2.5">Email</th>
            {hasStatusColumn ? (
              <th className="w-28 border border-slate-700 px-3 py-2.5">Statut</th>
            ) : null}
            <th className="w-40 border border-slate-700 px-3 py-2.5 text-center">Signature</th>
          </tr>
        </thead>
        <tbody>
          {data.participants.length === 0 ? (
            <tr>
              <td
                colSpan={hasStatusColumn ? 6 : 5}
                className="border border-slate-200 px-4 py-8 text-center text-slate-500"
              >
                Aucun stagiaire confirmé pour cette session.
              </td>
            </tr>
          ) : (
            data.participants.map((p) => (
              <tr key={p.index} className="even:bg-slate-50/50">
                <td className="border border-slate-200 px-2 py-2 text-center text-slate-600">
                  {p.index}
                </td>
                <td className="border border-slate-200 px-2 py-2">
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getAvatarUrl(p.avatarUrl)}
                      alt=""
                      className="mx-auto size-8 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="mx-auto size-8 rounded-full bg-slate-100 ring-1 ring-slate-200" />
                  )}
                </td>
                <td className="border border-slate-200 px-3 py-2.5 font-medium text-slate-900">
                  {p.name}
                </td>
                <td className="border border-slate-200 px-3 py-2.5 text-slate-600">{p.email}</td>
                {hasStatusColumn ? (
                  <td className="border border-slate-200 px-3 py-2.5 text-slate-700">
                    {p.statusLabel ?? '—'}
                  </td>
                ) : null}
                <td className="border border-slate-200 px-3 py-6" />
              </tr>
            ))
          )}
        </tbody>
      </table>

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-600">
        <p>
          Document de présence — à conserver 3 ans minimum (Code du travail, art. L.6353-1). Imprimer
          en fin de créneau, faire signer chaque stagiaire, scanner puis archiver dans le dossier
          session.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-700">Formateur référent</p>
            <div className="mt-6 border-b border-slate-400" />
            <p className="mt-1 text-slate-500">{data.trainerName}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Cachet / signature organisme</p>
            <div className="mt-6 border-b border-slate-400" />
            <p className="mt-1 text-slate-500">{brand?.companyName ?? "FORM'SSI"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
