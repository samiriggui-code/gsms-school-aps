'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

type ProviderOption = { id: string; code: string; label: string };

export function CreateFundingCaseForm({ providers }: { providers: ProviderOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [providerId, setProviderId] = useState(providers[0]?.id ?? '');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (providers.length === 0) return null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const response = await apiFetch(
          '/api/sections/administration-facturation/finance/financeurs/cases',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId,
              reference: reference.trim() || undefined,
            }),
          },
        );
        const json = (await response.json()) as { success?: boolean; error?: string };
        if (!response.ok || json.success === false) {
          throw new Error(json.error || `HTTP ${response.status}`);
        }
        setReference('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Création impossible');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-md border p-3">
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="fc-provider">
          Financeur
        </label>
        <select
          id="fc-provider"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={providerId}
          onChange={(ev) => setProviderId(ev.target.value)}
          required
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({p.code})
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="fc-ref">
          Référence (optionnel)
        </label>
        <input
          id="fc-ref"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={reference}
          onChange={(ev) => setReference(ev.target.value)}
          placeholder="FUND-…"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || !providerId}>
        {pending ? 'Création…' : 'Nouveau dossier DRAFT'}
      </Button>
      {error ? <p className="text-destructive w-full text-sm">{error}</p> : null}
    </form>
  );
}
