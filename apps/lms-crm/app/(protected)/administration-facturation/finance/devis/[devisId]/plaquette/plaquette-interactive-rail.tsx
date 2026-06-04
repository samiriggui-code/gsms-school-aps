'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ListTree, MessageCircle, PenLine, ShieldCheck } from 'lucide-react';
import type { PlaquetteMessageRow, PlaquetteTimelineEvent } from '@/lib/devis-plaquette-types';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function PlaquetteInteractiveRail({
  variant,
  statusLabel,
  timeline,
  acceptanceHint,
  messages,
}: {
  variant: 'crm' | 'public';
  statusLabel: string;
  timeline: PlaquetteTimelineEvent[];
  acceptanceHint: string;
  messages: PlaquetteMessageRow[];
}) {
  const [openId, setOpenId] = useState<string | null>(timeline[0]?.id ?? null);

  const sorted = useMemo(
    () => [...timeline].sort((a, b) => new Date(b.atIso).getTime() - new Date(a.atIso).getTime()),
    [timeline],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Acceptation</p>
        <p className="mt-2 text-lg font-semibold text-foreground">{statusLabel}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{acceptanceHint}</p>
        {variant === 'public' ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-primary/25 bg-primary/[0.04] p-2.5 text-[11px] text-foreground/90">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Cette page est ouverte via un lien personnel sécurisé. Ne le transmettez pas à des tiers.
          </p>
        ) : (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
            <PenLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            Les échanges (client + réponses depuis la fiche devis, onglet « Échanges plaquette ») apparaissent dans le
            bloc « Messages » ci-dessous et dans cette même fiche.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <MessageCircle className="size-3.5" />
          Messages (plaquette)
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {variant === 'public'
            ? 'Historique : vos messages et les réponses de l’équipe commerciale (rafraîchissez la page pour voir les nouveaux messages).'
            : 'Messages laissés par le client via son lien plaquette — visibles ici et dans la fiche devis.'}
        </p>
        {messages.length === 0 ? (
          <p className="mt-2 text-xs italic text-muted-foreground">Aucun message pour l’instant.</p>
        ) : (
          <ul className="mt-2 max-h-[280px] space-y-2 overflow-y-auto pe-1">
            {[...messages].reverse().map((m) => (
              <li key={m.id} className="rounded-lg border border-border/60 bg-muted/10 px-2.5 py-2 text-[11px]">
                <p className="font-medium text-foreground">{m.authorLabel ?? m.authorKind}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{fmtDate(m.createdAt)}</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-foreground/90">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <ListTree className="size-3.5" />
          Fil &amp; jalons
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Jalons issus du devis — ouvrez chaque ligne pour le détail.
        </p>
        <ul className="mt-3 space-y-1">
          {sorted.map((ev) => {
            const open = openId === ev.id;
            return (
              <li key={ev.id}>
                <Collapsible
                  open={open}
                  onOpenChange={(next) => setOpenId(next ? ev.id : null)}
                  className={cn(
                    'rounded-xl border px-2.5 py-1 transition-colors',
                    ev.highlight
                      ? 'border-primary/35 bg-primary/[0.06]'
                      : 'border-border/70 bg-muted/10',
                  )}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-medium text-foreground">
                    <span className="min-w-0 truncate">{ev.title}</span>
                    <ChevronDown
                      className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border/50 pb-2 pt-1.5 text-[11px] text-muted-foreground">
                      <p className="font-mono text-[10px] text-muted-foreground/90">{fmtDate(ev.atIso)}</p>
                      {ev.body ? <p className="mt-1 leading-relaxed text-foreground/85">{ev.body}</p> : null}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
