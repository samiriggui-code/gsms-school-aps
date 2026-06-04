import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, FileText, MessageSquareText, PenLine } from 'lucide-react';
import type { PlaquettePayload } from '@/lib/devis-plaquette-types';
import { cn } from '@/lib/utils';
import { PlaquetteClientEngagement } from './plaquette-client-engagement';
import { PlaquetteInteractiveRail } from './plaquette-interactive-rail';

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

export function DevisPlaquetteDocument({
  data,
  devisHubUrl,
  variant,
  publicToken = null,
}: {
  data: PlaquettePayload;
  devisHubUrl: string | null;
  variant: 'crm' | 'public';
  /** Jeton du lien public — active formulaire + acceptation côté client. */
  publicToken?: string | null;
}) {
  const { devis, lead, formation, formationSession, hasCatalogOffer, issuer, viewModel: vm, clientNeeds, timeline, plaquetteMessages } = data;
  const pres = vm.presentation;

  const acceptanceHint =
    variant === 'public'
      ? 'Lorsque la proposition est « Envoyée », vous pouvez l’accepter via le bouton sous ce panneau. Posez vos questions par message ou par e-mail à votre conseiller.'
      : 'Les messages client depuis la plaquette publique s’affichent ici. Mettez à jour le statut dans la fiche devis après retour.';

  const timelinePrint = [...timeline].sort(
    (a, b) => new Date(a.atIso).getTime() - new Date(b.atIso).getTime(),
  );

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <div className="mx-auto w-full max-w-[1360px] px-4 py-8 print:max-w-none print:px-6 print:py-4">
        <div className="grid items-start gap-8 text-left lg:grid-cols-[minmax(0,1fr)_min(320px,34vw)] lg:gap-10">
          <div className="min-w-0 space-y-8">
            <section className="flex flex-wrap items-stretch gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm print:shadow-none print:border-muted">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {issuer.logoUrl ? (
                  <img
                    src={issuer.logoUrl}
                    alt={issuer.name}
                    className="h-16 max-h-20 w-auto max-w-[160px] shrink-0 object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-muted-foreground/35 bg-muted/15 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Logo
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Émetteur</p>
                  <p className="text-lg font-semibold leading-tight text-foreground">{issuer.name}</p>
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {issuer.email ? <p>{issuer.email}</p> : null}
                    {issuer.phone ? <p>{issuer.phone}</p> : null}
                    {issuer.address ? <p className="whitespace-pre-wrap leading-snug">{issuer.address}</p> : null}
                  </div>
                </div>
              </div>
            </section>

            <header className="rounded-2xl border border-border bg-gradient-to-br from-background via-background to-primary/[0.06] p-6 shadow-sm print:shadow-none print:border-muted">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Proposition commerciale</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{formation.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-3 py-1 font-mono text-xs font-medium text-foreground">
                  {devis.referenceCode}
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs">
                  {devis.statusLabel}
                </span>
                {!hasCatalogOffer ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900">
                    Fiche formation hors catalogue vitrine
                  </span>
                ) : null}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/80 bg-background/80 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tarif indicatif</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{vm.billingStrip.price}</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-background/80 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Volume &amp; rythme</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{vm.programStrip.volume}</p>
                  <p className="text-xs text-muted-foreground">
                    Théorie {vm.programStrip.theory} · Pratique {vm.programStrip.practice}
                  </p>
                </div>
                <div className="rounded-xl border border-border/80 bg-background/80 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CPF / qualité</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{vm.billingStrip.cpfLine}</p>
                  <p className="text-xs text-muted-foreground">{vm.billingStrip.qualiopi}</p>
                </div>
              </div>
            </header>

            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm print:shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    <FileText className="size-4" />
                    {variant === 'crm' ? 'Devis dans le CRM' : 'Votre proposition'}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    {variant === 'crm'
                      ? 'Accédez à la fiche devis pour modifier les lignes, envoyer au client ou suivre le statut.'
                      : 'Ce document résume la formation et les besoins exprimés. Les montants et la contractualisation sont formalisés sur le devis transmis par votre organisme.'}
                  </p>
                </div>
                {variant === 'crm' && devisHubUrl ? (
                  <a
                    href={devisHubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm',
                      'hover:bg-primary/90 print:border print:border-primary print:bg-transparent print:text-primary',
                    )}
                  >
                    Ouvrir le devis {devis.referenceCode}
                    <ExternalLink className="size-4 opacity-80" />
                  </a>
                ) : null}
              </div>
              {variant === 'crm' && devisHubUrl ? (
                <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{devisHubUrl}</p>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/15 p-3 text-xs text-muted-foreground">
                  L’accès au logiciel interne (CRM) n’est pas inclus dans ce lien : vous consultez uniquement la plaquette
                  de présentation.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm print:shadow-none">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <MessageSquareText className="size-4" />
                Besoins &amp; demande (formulaire client)
              </h2>
              {lead ? (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                  {lead.phone ? <p className="text-sm text-muted-foreground">{lead.phone}</p> : null}
                  {lead.source ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Source : <span className="font-medium text-foreground">{lead.source}</span>
                    </p>
                  ) : null}
                  {lead.notes?.trim() ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Message / notes lead
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{lead.notes}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Aucun lead lié à ce devis.</p>
              )}
              {clientNeeds.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {clientNeeds.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-col gap-0.5 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5 text-sm"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="font-medium text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Aucun champ complémentaire enregistré sur le snapshot client du devis.
                </p>
              )}
              {formationSession ? (
                <p className="mt-4 text-sm text-foreground">
                  <span className="font-semibold">Session visée :</span> {formationSession.dateDisplayLabel} —{' '}
                  {formationSession.location}
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm print:shadow-none">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Présentation</h2>
              <h3 className="mt-3 text-xl font-semibold text-foreground">{pres.title}</h3>
              {pres.body ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{pres.body}</p>
              ) : null}
              {pres.bullets.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm text-foreground">
                  {pres.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{b.replace(/^\-\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm print:shadow-none">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Programme (aperçu)</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {vm.programModules.slice(0, 8).map((m) => (
                  <div key={m.id} className="rounded-xl border border-border/70 bg-muted/5 p-4">
                    <p className="text-sm font-semibold text-foreground">{m.title}</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {m.details.slice(0, 3).map((d) => (
                        <li key={d}>· {d}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm print:shadow-none">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Prérequis</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Critère</th>
                      <th className="px-3 py-2">Détail</th>
                      <th className="px-3 py-2">Importance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vm.prerequisiteRows.slice(0, 12).map((r, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="px-3 py-2 font-medium text-foreground">{r.item}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.detail}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.importance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm print:shadow-none">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Financement</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {vm.fundingBlocks.map((b) => (
                  <div key={b.label} className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5">
                    <p className="text-xs font-semibold text-foreground">{b.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{b.info}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="hidden rounded-2xl border border-border bg-background p-6 shadow-sm print:block print:shadow-none">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <PenLine className="size-4" />
                Signature
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Engagement sous réserve d’acceptation du devis {devis.referenceCode}. Signature électronique ou manuscrite
                selon le process de votre organisme.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">Le client</p>
                  <div className="mt-8 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/5" />
                  <p className="mt-2 text-[10px] text-muted-foreground">Nom, fonction, date</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">L’organisme de formation</p>
                  <div className="mt-8 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/5" />
                  <p className="mt-2 text-[10px] text-muted-foreground">Cachet / signature</p>
                </div>
              </div>
            </section>

            <section className="hidden rounded-xl border border-border bg-muted/10 p-4 print:block">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Fil commercial — résumé pour impression
              </h2>
              <ol className="mt-2 space-y-1.5 text-[11px] text-foreground">
                {timelinePrint.map((ev) => (
                  <li key={`p-${ev.id}`}>
                    <span className="font-semibold">{ev.title}</span>
                    <span className="text-muted-foreground"> — {fmtDate(ev.atIso)}</span>
                    {ev.body ? <span className="block text-muted-foreground">{ev.body}</span> : null}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[10px] text-muted-foreground">
                Montants : {fmtMoney(devis.subtotalHt, devis.currency)} HT → {fmtMoney(devis.totalTtc, devis.currency)}{' '}
                TTC
              </p>
            </section>

            <footer className="border-t border-border pt-6 text-left text-[11px] text-muted-foreground print:pt-4">
              <p>
                {issuer.name} — document pour la formation « {formation.name} » — devis {devis.referenceCode} —{' '}
                {devis.title}
              </p>
            </footer>
          </div>

          <aside className="min-w-0 print:hidden lg:sticky lg:top-24">
            <PlaquetteInteractiveRail
              variant={variant}
              statusLabel={devis.statusLabel}
              timeline={timeline}
              acceptanceHint={acceptanceHint}
              messages={plaquetteMessages}
            />
            {variant === 'public' && publicToken ? (
              <PlaquetteClientEngagement devisId={devis.id} publicToken={publicToken} devisStatus={devis.status} />
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
