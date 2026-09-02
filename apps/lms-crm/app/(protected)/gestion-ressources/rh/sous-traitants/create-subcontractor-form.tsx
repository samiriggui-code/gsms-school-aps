'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

export function CreateSubcontractorForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState('');
  const [siret, setSiret] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const response = await apiFetch(
          '/api/sections/gestion-ressources/rh/sous-traitants',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: label.trim(),
              siret: siret.trim() || undefined,
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
        setLabel('');
        setSiret('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Création impossible');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-md border p-3">
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="st-label">
          Libellé
        </label>
        <input
          id="st-label"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={label}
          onChange={(ev) => setLabel(ev.target.value)}
          required
        />
      </div>
      <div className="flex min-w-[10rem] flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="st-siret">
          SIRET (optionnel)
        </label>
        <input
          id="st-siret"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={siret}
          onChange={(ev) => setSiret(ev.target.value)}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || !label.trim()}>
        {pending ? 'Création…' : 'Nouveau sous-traitant'}
      </Button>
      {error ? <p className="text-destructive w-full text-xs">{error}</p> : null}
    </form>
  );
}
