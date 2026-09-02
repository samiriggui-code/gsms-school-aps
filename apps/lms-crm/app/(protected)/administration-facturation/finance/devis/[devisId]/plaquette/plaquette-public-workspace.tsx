'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Textarea } from '@repo/ui/textarea';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';
import { toast } from 'sonner';
import type { PlaquetteMessageRow } from '@/lib/devis-plaquette-types';
import { DevisWorkflowStepper } from '@/app/(protected)/administration-facturation/finance/devis/components/devis-workflow-stepper';
import { cn } from '@/lib/utils';

function publicApiUrl(devisId: string, action: 'plaquette-messages' | 'plaquette-accept', token: string) {
  const pre = nextPublicPathPrefix();
  const base = `${pre}/api/public/finance/devis/${encodeURIComponent(devisId)}/${action}`;
  return `${base}?t=${encodeURIComponent(token)}`;
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function PlaquettePublicWorkspace({
  devisId,
  publicToken,
  devisStatus,
  initialMessages,
}: {
  devisId: string;
  publicToken: string;
  devisStatus: string;
  initialMessages: PlaquetteMessageRow[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [polling, setPolling] = useState(false);

  const canAccept = devisStatus === 'SENT';
  const isAccepted = devisStatus === 'ACCEPTED';

  const refreshMessages = useCallback(async () => {
    setPolling(true);
    try {
      const res = await fetch(publicApiUrl(devisId, 'plaquette-messages', publicToken));
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const data = (json as { data?: { items?: PlaquetteMessageRow[] } }).data;
      if (data?.items) setMessages(data.items);
    } finally {
      setPolling(false);
    }
  }, [devisId, publicToken]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const id = window.setInterval(() => void refreshMessages(), 25_000);
    return () => window.clearInterval(id);
  }, [refreshMessages]);

  const sendMessage = async () => {
    const body = draft.trim();
    if (!body) {
      toast.error('Saisissez un message.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(publicApiUrl(devisId, 'plaquette-messages', publicToken), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Envoi impossible.';
        toast.error(msg);
        return;
      }
      setDraft('');
      toast.success('Message transmis à l’équipe RH.');
      await refreshMessages();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    setAcceptBusy(true);
    try {
      const res = await fetch(publicApiUrl(devisId, 'plaquette-accept', publicToken), { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Action impossible.';
        toast.error(msg);
        return;
      }
      toast.success(
        'Merci — votre acceptation est enregistrée. Notre équipe prépare la facture et vous recontacte.',
      );
      window.location.reload();
    } finally {
      setAcceptBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 print:hidden">
      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suivi de votre devis</p>
        <div className="mt-3">
          <DevisWorkflowStepper status={devisStatus} />
        </div>
        {isAccepted ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            Proposition acceptée — la facture sera émise par notre équipe. Vous serez contacté pour le règlement.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <MessageCircle className="size-3.5" />
            Échanges avec l&apos;équipe RH
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px]"
            disabled={polling}
            onClick={() => void refreshMessages()}
          >
            <RefreshCw className={cn('size-3', polling && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Posez vos questions ici : un conseiller RH vous répond sur ce fil (actualisation automatique toutes les 25 s).
        </p>

        <ul className="mt-3 max-h-[240px] space-y-2 overflow-y-auto pe-1">
          {messages.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-3 py-4 text-center text-xs text-muted-foreground">
              Aucun message — écrivez votre première question ci-dessous.
            </li>
          ) : (
            messages.map((m) => (
              <li
                key={m.id}
                className={cn(
                  'rounded-lg border px-2.5 py-2 text-[11px]',
                  m.authorKind === 'CLIENT'
                    ? 'border-primary/20 bg-primary/[0.04] ms-2'
                    : 'border-border/60 bg-muted/10 me-2',
                )}
              >
                <p className="font-medium text-foreground">{m.authorLabel ?? m.authorKind}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{fmtDate(m.createdAt)}</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-foreground/90">{m.body}</p>
              </li>
            ))
          )}
        </ul>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ex. dates de session, financement OPCO, effectif…"
          className="mt-3 min-h-[80px] text-sm"
          maxLength={8000}
        />
        <Button type="button" size="sm" className="mt-2 gap-1.5" disabled={busy} onClick={() => void sendMessage()}>
          <Send className="size-3.5" />
          {busy ? 'Envoi…' : 'Envoyer à l’équipe RH'}
        </Button>
      </div>

      {canAccept ? (
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.04] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Accepter le devis</p>
          <p className="mt-2 text-xs leading-relaxed text-foreground/90">
            En validant, vous confirmez l&apos;accord sur les montants affichés. Notre équipe transforme le devis en
            facture et vous contacte pour la suite (signature, paiement).
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="mt-3 w-full sm:w-auto"
            disabled={acceptBusy}
            onClick={() => void accept()}
          >
            {acceptBusy ? 'Enregistrement…' : 'J’accepte ce devis'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
