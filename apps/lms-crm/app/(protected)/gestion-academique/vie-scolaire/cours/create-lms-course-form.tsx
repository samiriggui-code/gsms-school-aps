'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

export function CreateLmsCourseForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const response = await apiFetch(
          '/api/sections/gestion-academique/vie-scolaire/cours',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim() || undefined,
            }),
          },
        );
        const json = (await response.json()) as { success?: boolean; error?: string };
        if (!response.ok || json.success === false) {
          throw new Error(json.error || `HTTP ${response.status}`);
        }
        setTitle('');
        setDescription('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Création impossible');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-md border p-3">
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="lms-course-title">
          Titre
        </label>
        <input
          id="lms-course-title"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          required
          placeholder="Nouveau parcours LMS"
        />
      </div>
      <div className="flex min-w-[12rem] flex-[2] flex-col gap-1">
        <label className="text-muted-foreground text-xs" htmlFor="lms-course-desc">
          Description (optionnel)
        </label>
        <input
          id="lms-course-desc"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || !title.trim()}>
        {pending ? 'Création…' : 'Nouveau cours'}
      </Button>
      {error ? <p className="text-destructive w-full text-xs">{error}</p> : null}
    </form>
  );
}
