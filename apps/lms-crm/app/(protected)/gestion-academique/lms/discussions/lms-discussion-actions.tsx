'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

export function LmsDiscussionModerationActions({
  discussionId,
  isPinned,
  isLocked,
}: {
  discussionId: string;
  isPinned: boolean;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function patch(data: { isPinned?: boolean; isLocked?: boolean }) {
    startTransition(async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/discussions/${encodeURIComponent(discussionId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) return;
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm('Supprimer cette discussion ?')) return;
    startTransition(async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/discussions/${encodeURIComponent(discussionId)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) return;
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => patch({ isPinned: !isPinned })}
      >
        {isPinned ? 'Désépingler' : 'Épingler'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => patch({ isLocked: !isLocked })}
      >
        {isLocked ? 'Déverrouiller' : 'Verrouiller'}
      </Button>
      <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={remove}>
        Supprimer
      </Button>
    </div>
  );
}
