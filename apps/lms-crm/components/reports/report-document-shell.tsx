import type { ReactNode } from 'react';
import { OfficialDocumentAuthorBadge } from '@/components/reports/official-document-author';
import type { ReportDocumentBrand } from '@/lib/reports/document-brand';
import type {
  OfficialDocumentAuthor,
  OfficialDocumentKind,
} from '@/lib/reports/official-document-types';

type Props = {
  title: string;
  subtitle?: string;
  periodLabel: string;
  generatedAt: string;
  author?: OfficialDocumentAuthor | null;
  /** @deprecated Préférer `author` */
  authorName?: string | null;
  summary?: string | null;
  reference?: string;
  brand?: ReportDocumentBrand;
  kind?: OfficialDocumentKind;
  children: ReactNode;
};

export function ReportDocumentShell({
  title,
  subtitle,
  periodLabel,
  generatedAt,
  author,
  authorName,
  summary,
  reference,
  brand,
  kind = 'corporate',
  children,
}: Props) {
  const dateStr = new Date(generatedAt).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const companyName = brand?.companyName ?? "FORM'SSI";
  const logoUrl = brand?.logoUrl ?? '/brand/formssi-logo-full.png';

  const resolvedAuthor: OfficialDocumentAuthor | null =
    author ??
    (authorName?.trim()
      ? { name: authorName.trim(), avatarUrl: null, email: null }
      : null);

  const kindClass = kind === 'legal' ? 'report-document--legal' : 'report-document--corporate';

  return (
    <article
      className={`report-document ${kindClass} mx-auto min-h-screen max-w-[210mm] bg-white text-slate-900 print:max-w-none`}
    >
      <header className="report-header border-b-2 border-slate-800 px-8 pb-6 pt-8">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={companyName}
              className="h-12 w-auto max-w-[180px] object-contain object-left"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
            {brand?.tagline ? (
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">{brand.tagline}</p>
            ) : null}
          </div>

          <div className="shrink-0 space-y-3 text-right text-xs text-slate-600">
            {reference ? (
              <div>
                <p className="font-semibold text-slate-800">Référence</p>
                <p className="font-mono text-[11px]">{reference}</p>
              </div>
            ) : null}
            <div>
              <p className="font-semibold text-slate-800">Période / contexte</p>
              <p>{periodLabel}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Date d&apos;édition</p>
              <p>{dateStr}</p>
            </div>
            {resolvedAuthor ? <OfficialDocumentAuthorBadge author={resolvedAuthor} /> : null}
          </div>
        </div>

        {summary ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            {summary}
          </p>
        ) : null}
      </header>

      <main className="report-body space-y-8 px-8 py-8">{children}</main>

      <footer className="report-footer border-t border-slate-200 px-8 py-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand?.iconUrl ?? logoUrl}
              alt=""
              aria-hidden
              className="mt-0.5 h-8 w-8 shrink-0 object-contain"
            />
            <div className="min-w-0 text-[10px] leading-relaxed text-slate-600">
              <p className="text-xs font-semibold text-slate-800">{companyName}</p>
              {brand?.addressLine ? <p className="mt-1">{brand.addressLine}</p> : null}
              {brand?.legalLine ? <p className="mt-1">{brand.legalLine}</p> : null}
              {brand?.contactLine ? <p className="mt-1">{brand.contactLine}</p> : null}
            </div>
          </div>

          {brand?.qualiopiLogoUrl ? (
            <div className="shrink-0 text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.qualiopiLogoUrl}
                alt="Certification Qualiopi"
                className="ml-auto h-10 w-auto object-contain"
              />
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-500">
          Document généré par le CRM {companyName} — confidentiel
        </p>
      </footer>
    </article>
  );
}
