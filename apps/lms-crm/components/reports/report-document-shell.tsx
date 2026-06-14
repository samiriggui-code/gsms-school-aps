import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  periodLabel: string;
  generatedAt: string;
  authorName?: string | null;
  summary?: string | null;
  children: ReactNode;
};

export function ReportDocumentShell({
  title,
  subtitle,
  periodLabel,
  generatedAt,
  authorName,
  summary,
  children,
}: Props) {
  const dateStr = new Date(generatedAt).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <article className="report-document mx-auto min-h-screen max-w-[210mm] bg-white text-slate-900 print:max-w-none">
      <header className="report-header border-b-2 border-slate-800 px-8 pb-6 pt-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">FORM&apos;SSI</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Période</p>
            <p>{periodLabel}</p>
            <p className="mt-2 font-semibold text-slate-800">Généré le</p>
            <p>{dateStr}</p>
            {authorName ? (
              <>
                <p className="mt-2 font-semibold text-slate-800">Par</p>
                <p>{authorName}</p>
              </>
            ) : null}
          </div>
        </div>
        {summary ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">{summary}</p>
        ) : null}
      </header>

      <main className="report-body space-y-8 px-8 py-8">{children}</main>

      <footer className="report-footer border-t border-slate-200 px-8 py-4 text-center text-[10px] text-slate-500">
        Document généré par le CRM FORM&apos;SSI — confidentiel
      </footer>
    </article>
  );
}
