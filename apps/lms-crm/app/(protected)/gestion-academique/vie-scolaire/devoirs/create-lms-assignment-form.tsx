'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';

export function CreateLmsAssignmentForm({
  chapters,
}: {
  chapters: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!chapterId || !title.trim()) return;
    startTransition(async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/devoirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, title: title.trim(), description }),
      });
      if (!res.ok) return;
      setTitle('');
      setDescription('');
      router.refresh();
    });
  }

  if (chapters.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun chapitre LMS — créer d&apos;abord un cours et des chapitres.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mb-6 grid max-w-xl gap-2 rounded-md border p-4">
      <label className="text-sm font-medium">
        Chapitre
        <select
          className="border-input bg-background mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
        >
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Titre du devoir
        <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="text-sm font-medium">
        Consignes
        <Textarea className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Création…' : 'Créer le devoir'}
      </Button>
    </form>
  );
}
