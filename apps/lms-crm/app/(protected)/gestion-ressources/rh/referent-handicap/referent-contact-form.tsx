'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

type Props = {
  initial: {
    disabilityReferentName: string | null;
    disabilityReferentEmail: string | null;
    disabilityReferentPhone: string | null;
  } | null;
};

export function ReferentContactForm({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.disabilityReferentName ?? '');
  const [email, setEmail] = useState(initial?.disabilityReferentEmail ?? '');
  const [phone, setPhone] = useState(initial?.disabilityReferentPhone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      try {
        const response = await apiFetch(
          '/api/sections/gestion-ressources/rh/referent-handicap',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              disabilityReferentName: name,
              disabilityReferentEmail: email,
              disabilityReferentPhone: phone,
            }),
          },
        );
        const json = (await response.json()) as {
          success?: boolean;
          error?: string | { message?: string };
        };
        if (!response.ok || json.success === false) {
          const msg =
            typeof json.error === 'string'
              ? json.error
              : json.error?.message || `HTTP ${response.status}`;
          throw new Error(msg);
        }
        setOkMsg('Contact référent enregistré');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Enregistrement impossible');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-md border p-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="ref-name">
          Nom du référent
        </label>
        <input
          id="ref-name"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="ref-email">
          Email
        </label>
        <input
          id="ref-email"
          type="email"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="ref-phone">
          Téléphone
        </label>
        <input
          id="ref-phone"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={phone}
          onChange={(ev) => setPhone(ev.target.value)}
        />
      </div>
      <div className="flex items-center gap-3 sm:col-span-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer le contact'}
        </Button>
        {okMsg ? <p className="text-muted-foreground text-xs">{okMsg}</p> : null}
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
      </div>
    </form>
  );
}
