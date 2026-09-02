'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/button';
import { Textarea } from '@repo/ui/textarea';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';
import { toast } from 'sonner';

function publicApiUrl(devisId: string, action: 'plaquette-messages' | 'plaquette-accept', token: string) {
  const pre = nextPublicPathPrefix();
  const base = `${pre}/api/public/finance/devis/${encodeURIComponent(devisId)}/${action}`;
  return `${base}?t=${encodeURIComponent(token)}`;
}

export function PlaquetteClientEngagement({
  devisId,
  publicToken,
  devisStatus,
}: {
  devisId: string;
  publicToken: string;
  devisStatus: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [acceptBusy, setAcceptBusy] = useState(false);

  const canAccept = devisStatus === 'SENT';

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
      toast.success('Message transmis à l’organisme.');
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
      toast.success('Merci — votre acceptation a été enregistrée. Votre conseiller vous contactera pour la suite.');
      window.location.reload();
    } finally {
      setAcceptBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Écrire à l’organisme</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Votre message est transmis à l’équipe commerciale. Les réponses apparaissent dans l’historique ci-contre
          (rafraîchissez la page). Ce n’est pas un chat en temps réel.
        </p>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ex. question sur les dates, financement, effectif…"
          className="mt-2 min-h-[88px] text-sm"
          maxLength={8000}
        />
        <Button type="button" size="sm" className="mt-2" disabled={busy} onClick={() => void sendMessage()}>
          {busy ? 'Envoi…' : 'Envoyer le message'}
        </Button>
      </div>

      {canAccept ? (
        <div className="border-t border-border pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Accepter la proposition</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            En cliquant, vous confirmez l’acceptation du devis côté organisme (sans valeur contractuelle complète : la
            suite se fait avec votre conseiller).
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="mt-2"
            disabled={acceptBusy}
            onClick={() => void accept()}
          >
            {acceptBusy ? 'Enregistrement…' : 'J’accepte cette proposition'}
          </Button>
        </div>
      ) : devisStatus === 'ACCEPTED' ? (
        <p className="border-t border-border pt-3 text-xs font-medium text-emerald-800">Proposition déjà acceptée.</p>
      ) : null}
    </div>
  );
}
