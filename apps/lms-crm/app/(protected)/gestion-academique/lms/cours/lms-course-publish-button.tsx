'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

export function LmsCoursePublishButton({
  courseId,
  isPublished,
}: {
  courseId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const response = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/cours/${encodeURIComponent(courseId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !isPublished }),
        },
      );
      if (!response.ok) return;
      router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={toggle}>
      {pending ? '…' : isPublished ? 'Dépublier' : 'Publier'}
    </Button>
  );
}
