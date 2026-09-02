'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

type Item = {
  id: string;
  code: string;
  label: string;
  status: string;
  rejectionReason: string | null;
  validatedAt: Date | string | null;
};

export function ChecklistActions({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function markDone(itemId: string) {
    setError(null);
    setPendingId(itemId);
    startTransition(async () => {
      try {
        const response = await apiFetch(
          '/api/sections/gestion-ressources/rh/referent-handicap',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId }),
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
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action impossible');
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="p-2 font-medium">Code</th>
            <th className="p-2 font-medium">Pièce / action</th>
            <th className="p-2 font-medium">Statut</th>
            <th className="p-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const done = item.status === 'VALIDATED' || item.status === 'WAIVED';
            return (
              <tr key={item.id} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{item.code}</td>
                <td className="p-2">{item.label}</td>
                <td className="p-2 font-mono text-xs">{item.status}</td>
                <td className="p-2">
                  {done ? (
                    <span className="text-muted-foreground text-xs">Fait</span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pendingId === item.id}
                      onClick={() => markDone(item.id)}
                    >
                      {pendingId === item.id ? '…' : 'Marquer fait'}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error ? <p className="text-destructive p-2 text-xs">{error}</p> : null}
    </div>
  );
}
