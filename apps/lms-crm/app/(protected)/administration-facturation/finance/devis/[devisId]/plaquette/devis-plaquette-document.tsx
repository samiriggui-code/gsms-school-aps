import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, FileText, MessageSquareText, PenLine, Receipt } from 'lucide-react';
import type { PlaquettePayload } from '@/lib/devis-plaquette-types';
import type { ReportDocumentBrand } from '@/lib/reports/document-brand';
import { ReportDocumentShell } from '@/components/reports/report-document-shell';
import { cn } from '@/lib/utils';
import { PlaquetteInteractiveRail } from './plaquette-interactive-rail';
import { PlaquettePublicWorkspace } from './plaquette-public-workspace';

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  } catch {
    return '—';
  }
}

function fmtMoney(n: number, cur: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur || 'EUR' }).format(n);
}

function sectionClass() {
  return 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:shadow-none print:border-slate-300';
}

export function DevisPlaquetteDocument({
  data,
  devisHubUrl,
  variant,
  publicToken = null,
  brand,
}: {
  data: PlaquettePayload;
  devisHubUrl: string | null;
  variant: 'crm' | 'public';
  publicToken?: string | null;
  brand: ReportDocumentBrand;
}) {
  const {
    devis,
    lead,
    formation,
    formationSession,
    hasCatalogOffer,
    viewModel: vm,
    clientNeeds,
    timeline,
    plaquetteMessages,
  } = data;
  const pres = vm.presentation;

  const acceptanceHint =
    variant === 'public'
      ? 'Utilisez le panneau à droite pour échanger avec l’équipe RH et accepter le devis en ligne.'
      : 'Les messages client depuis le lien public s’affichent dans la fiche devis (onglet Suivi client).';

  const timelinePrint = [...timeline].sort(
    (a, b) => new Date(a.atIso).getTime() - new Date(b.atIso).getTime(),
  );

  const periodLabel = devis.validUntil
    ? `Valable jusqu'au ${format(new Date(devis.validUntil), 'd MMMM yyyy', { locale: fr })}`
    : 'Validité à confirmer avec votre conseiller';

  const summary = `${fmtMoney(devis.totalTtc, devis.currency)} TTC — statut : ${devis.statusLabel}`;

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <div className="mx-auto w-full max-w-[1360px] px-4 py-6 print:max-w-none print:px-0 print:py-0">
        <div className="grid items-start gap-6 text-left lg:grid-cols-[minmax(0,1fr)_min(340px,32vw)] lg:gap-8">
          <ReportDocumentShell
            title={formation.name}
            subtitle={
              variant === 'public'
                ? 'Proposition commerciale — consultation client sécurisée'
                : 'Plaquette devis — aperçu interne CRM'
            }
            periodLabel={periodLabel}
            generatedAt={devis.updatedAt}
            reference={devis.referenceCode}
            brand={brand}
            summary={summary}
            maxWidthClass="max-w-none"
          >
            <div className="space-y-6">
              <section className={sectionClass()}>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-medium">
                    {devis.referenceCode}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
                    {devis.statusLabel}
                  </span>
                  {!hasCatalogOffer ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900">
                      Hors catalogue vitrine
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Montant devis</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">{fmtMoney(devis.totalTtc, devis.currency)} TTC</p>
                    <p className="text-xs text-slate-500">{fmtMoney(devis.subtotalHt, devis.currency)} HT</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Volume &amp; rythme</p>
                    <p className="mt-1 text-sm font-medium">{vm.programStrip.volume}</p>
                    <p className="text-xs text-slate-500">
                      Théorie {vm.programStrip.theory} · Pratique {vm.programStrip.practice}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CPF / qualité</p>
                    <p className="mt-1 text-sm font-medium">{vm.billingStrip.cpfLine}</p>
                    <p className="text-xs text-slate-500">{vm.billingStrip.qualiopi}</p>
                  </div>
                </div>
              </section>

              <section className={sectionClass()}>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <Receipt className="size-4" />
                  Détail du devis
                </h2>
                {devis.lines.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Libellé</th>
                          <th className="px-3 py-2 text-right">Qté</th>
                          <th className="px-3 py-2 text-right">PU HT</th>
                          <th className="px-3 py-2 text-right">TVA</th>
                          <th className="px-3 py-2 text-right">Montant HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devis.lines.map((line, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-medium">{line.label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {fmtMoney(line.unitPriceHt, devis.currency)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{line.vatRate} %</td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums">
                              {fmtMoney(line.quantity * line.unitPriceHt, devis.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-slate-200 bg-slate-50/80 text-sm">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-right text-slate-600">
                            Total TTC
                          </td>
                          <td className="px-3 py-2 text-right font-bold tabular-nums">
                            {fmtMoney(devis.totalTtc, devis.currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">Montants indicatifs — détail des lignes à confirmer avec votre conseiller.</p>
                )}
                {variant === 'crm' && devisHubUrl ? (
                  <a
                    href={devisHubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground',
                      'hover:bg-primary/90 print:hidden',
                    )}
                  >
                    Ouvrir la fiche devis CRM
                    <ExternalLink className="size-4 opacity-80" />
                  </a>
                ) : null}
              </section>

              <section className={sectionClass()}>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <MessageSquareText className="size-4" />
                  Votre demande
                </h2>
                {lead ? (
                  <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4">
                    <p className="text-sm font-semibold">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-sm text-slate-600">{lead.email}</p>
                    {lead.phone ? <p className="text-sm text-slate-600">{lead.phone}</p> : null}
                    {lead.notes?.trim() ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed border-t border-slate-200 pt-3">
                        {lead.notes}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">Contact à renseigner dans la fiche devis.</p>
                )}
                {clientNeeds.length > 0 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {clientNeeds.map((row) => (
                      <div key={row.label} className="rounded-lg border border-slate-200/60 bg-slate-50/50 px-3 py-2.5 text-sm">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</span>
                        <p className="mt-0.5 font-medium">{row.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {formationSession ? (
                  <p className="mt-4 text-sm">
                    <span className="font-semibold">Session visée :</span> {formationSession.dateDisplayLabel} —{' '}
                    {formationSession.location}
                  </p>
                ) : null}
              </section>

              <section className={sectionClass()}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Présentation</h2>
                <h3 className="mt-3 text-xl font-semibold">{pres.title}</h3>
                {pres.body ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{pres.body}</p>
                ) : null}
                {pres.bullets.length > 0 ? (
                  <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                    {pres.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{b.replace(/^\-\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>

              <section className={sectionClass()}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Programme (aperçu)</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {vm.programModules.slice(0, 8).map((m) => (
                    <div key={m.id} className="rounded-lg border border-slate-200/70 bg-slate-50/30 p-4">
                      <p className="text-sm font-semibold">{m.title}</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-600">
                        {m.details.slice(0, 3).map((d) => (
                          <li key={d}>· {d}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section className={sectionClass()}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Prérequis</h2>
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Critère</th>
                        <th className="px-3 py-2">Détail</th>
                        <th className="px-3 py-2">Importance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vm.prerequisiteRows.slice(0, 12).map((r, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium">{r.item}</td>
                          <td className="px-3 py-2 text-slate-600">{r.detail}</td>
                          <td className="px-3 py-2 text-slate-600">{r.importance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={sectionClass()}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Financement</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {vm.fundingBlocks.map((b) => (
                    <div key={b.label} className="rounded-lg border border-slate-200/60 bg-slate-50/50 px-3 py-2.5">
                      <p className="text-xs font-semibold">{b.label}</p>
                      <p className="mt-1 text-xs text-slate-600">{b.info}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="hidden print:block rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <PenLine className="size-4" />
                  Signature
                </h2>
                <p className="mt-2 text-xs text-slate-600">
                  Engagement sous réserve d&apos;acceptation du devis {devis.referenceCode}.
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold">Le client</p>
                    <div className="mt-8 h-24 rounded-lg border-2 border-dashed border-slate-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">L&apos;organisme</p>
                    <div className="mt-8 h-24 rounded-lg border-2 border-dashed border-slate-300" />
                  </div>
                </div>
              </section>

              <section className="hidden rounded-xl border border-slate-200 bg-slate-50 p-4 print:block">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fil commercial — impression</h2>
                <ol className="mt-2 space-y-1.5 text-[11px]">
                  {timelinePrint.map((ev) => (
                    <li key={`p-${ev.id}`}>
                      <span className="font-semibold">{ev.title}</span>
                      <span className="text-slate-500"> — {fmtDate(ev.atIso)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </ReportDocumentShell>

          <aside className="min-w-0 print:hidden lg:sticky lg:top-6">
            {variant === 'public' && publicToken ? (
              <PlaquettePublicWorkspace
                devisId={devis.id}
                publicToken={publicToken}
                devisStatus={devis.status}
                initialMessages={plaquetteMessages}
              />
            ) : (
              <PlaquetteInteractiveRail
                variant={variant}
                statusLabel={devis.statusLabel}
                timeline={timeline}
                acceptanceHint={acceptanceHint}
                messages={plaquetteMessages}
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
