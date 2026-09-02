'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

export function LmsAssignmentGradeForm({
  assignmentId,
  submissionId,
  maxPoints,
  currentGrade,
}: {
  assignmentId: string;
  submissionId: string;
  maxPoints: number;
  currentGrade: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function grade(value: number) {
    startTransition(async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/devoirs/${encodeURIComponent(assignmentId)}/submissions`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId, grade: value }),
        },
      );
      if (!res.ok) return;
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-muted-foreground text-xs">
        {currentGrade != null ? `${currentGrade}/${maxPoints}` : 'Non noté'}
      </span>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => grade(maxPoints)}>
        Valider
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => grade(0)}>
        0
      </Button>
    </div>
  );
}

export function LmsAssignmentDetailLink({ id }: { id: string }) {
  return (
    <Button size="sm" variant="outline" asChild>
      <Link href={`/gestion-academique/vie-scolaire/devoirs/${id}`}>Soumissions</Link>
    </Button>
  );
}
