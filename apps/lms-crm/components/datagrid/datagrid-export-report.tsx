import { ReportDocumentShell } from '@/components/reports/report-document-shell';
import type { DatagridExportDocument } from '@/lib/datagrid/export-document-types';
import type { ReportDocumentBrand } from '@/lib/reports/document-brand';
import { officialAuthorFromStoredDocument } from '@/lib/reports/official-document-author';

function formatCell(value: string | number): string {
  if (value == null || value === '') return '—';
  return String(value);
}

export function DatagridExportReport({
  document,
  brand,
}: {
  document: DatagridExportDocument;
  brand?: ReportDocumentBrand;
}) {
  const stats = document.stats ?? [];
  const author = officialAuthorFromStoredDocument(document);

  return (
    <ReportDocumentShell
      title={document.title}
      subtitle={document.subtitle}
      periodLabel={document.periodLabel}
      generatedAt={document.generatedAt}
      author={author}
      summary={document.summary}
      brand={brand}
      kind="corporate"
    >
      <div className="space-y-8">
        {stats.length > 0 ? (
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">
              Synthèse
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((kpi) => (
                <div
                  key={`${kpi.label}-${kpi.value}`}
                  className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {kpi.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{kpi.value}</p>
                  {kpi.subtitle ? (
                    <p className="text-xs text-slate-500">{kpi.subtitle}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                Détail des enregistrements
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {document.rows.length} ligne{document.rows.length > 1 ? 's' : ''} — export complet
                (hors pagination écran)
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-800 text-left text-[10px] uppercase text-white">
                  <th className="border border-slate-700 px-2 py-2 w-10 text-center">#</th>
                  {document.headers.map((header) => (
                    <th key={header} className="border border-slate-700 px-2 py-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {document.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}
                  >
                    <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-500">
                      {rowIndex + 1}
                    </td>
                    {document.headers.map((header, colIndex) => (
                      <td
                        key={`${rowIndex}-${header}`}
                        className="border border-slate-200 px-2 py-1.5 align-top text-slate-800"
                      >
                        {formatCell(row[colIndex] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ReportDocumentShell>
  );
}
