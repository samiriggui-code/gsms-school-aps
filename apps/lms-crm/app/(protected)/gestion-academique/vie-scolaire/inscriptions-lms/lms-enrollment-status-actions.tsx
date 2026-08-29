'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { EnrollmentStatus } from '@repo/database/browser';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { lmsEnrollmentStatusActions } from '@/lib/lms/lms-enrollment-transitions';

function actionLabel(to: EnrollmentStatus): string {
  switch (to) {
    case EnrollmentStatus.PENDING:
      return 'Remettre en attente';
    case EnrollmentStatus.VALIDATED:
      return 'Valider';
    case EnrollmentStatus.REJECTED:
      return 'Rejeter';
    case EnrollmentStatus.COMPLETED:
      return 'Terminer';
    case EnrollmentStatus.ARCHIVED:
      return 'Archiver';
    default: {
      const _exhaustive: never = to;
      return _exhaustive;
    }
  }
}

export function LmsEnrollmentStatusActions({
  enrollmentId,
  status,
}: {
  enrollmentId: string;
  status: EnrollmentStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const actions = lmsEnrollmentStatusActions(status);

  if (actions.length === 0) return null;

  function setStatus(next: EnrollmentStatus) {
    startTransition(async () => {
      const response = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/inscriptions-lms/${encodeURIComponent(enrollmentId)}`,
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
