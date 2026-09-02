'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SubcontractorQualificationStatus } from '@repo/database/browser';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';
import { subcontractorStatusActions } from '@/lib/organisation/subcontractor-transitions';

function actionLabel(to: SubcontractorQualificationStatus): string {
  switch (to) {
    case SubcontractorQualificationStatus.PENDING_VALIDATION:
      return 'Remettre en validation';
    case SubcontractorQualificationStatus.APPROVED:
      return 'Approuver';
    case SubcontractorQualificationStatus.ACTIVE:
      return 'Activer';
    case SubcontractorQualificationStatus.REVIEW_REQUIRED:
      return 'Revue requise';
    case SubcontractorQualificationStatus.SUSPENDED:
      return 'Suspendre';
    default: {
      const _exhaustive: never = to;
      return _exhaustive;
    }
  }
}

export function SubcontractorStatusActions({
  id,
  status,
}: {
  id: string;
  status: SubcontractorQualificationStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const actions = subcontractorStatusActions(status);

  if (actions.length === 0) return null;

  function setStatus(next: SubcontractorQualificationStatus) {
    startTransition(async () => {
      const response = await apiFetch(
        `/api/sections/gestion-ressources/rh/sous-traitants/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        },
      );
      if (!response.ok) return;
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {actions.map((to) => (
        <Button
          key={to}
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setStatus(to)}
        >
          {actionLabel(to)}
        </Button>
      ))}
    </div>
  );
}
