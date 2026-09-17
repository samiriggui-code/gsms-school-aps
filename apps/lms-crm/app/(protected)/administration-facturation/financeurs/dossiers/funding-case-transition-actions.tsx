'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

type Props = {
  caseId: string;
  nextStatus: string | null;
  canCancel: boolean;
};

export function FundingCaseTransitionActions({ caseId, nextStatus, canCancel }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(body: { advance?: boolean; cancel?: boolean }) {
    setError(null);
    startTransition(async () => {
      try {
        const response = await apiFetch(
          `/api/sections/administration-facturation/finance/financeurs/cases/${caseId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        );
        const json = (await response.json()) as { success?: boolean; error?: string };
        if (!response.ok || json.success === false) {
          throw new Error(json.error || `HTTP ${response.status}`);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Transition impossible');
      }
    });
  }

  if (!nextStatus && !canCancel) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {nextStatus ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run({ advance: true })}
            title={`→ ${nextStatus}`}
          >
            {pending ? '…' : `→ ${nextStatus}`}
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run({ cancel: true })}
          >
            Annuler
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
