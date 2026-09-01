'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type DiscussionRow = {
  id: string;
  title: string;
  content: string | null;
  isPinned: boolean;
  authorName: string | null;
  isOwn: boolean;
  commentCount: number;
  createdAt: string;
};

export function LmsCourseDiscussions({ courseId }: { courseId: string }) {
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/portal/apprendre/courses/${courseId}/discussions`);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { discussions: DiscussionRow[] };
      };
      if (res.ok && json.success && json.data) {
        setDiscussions(json.data.discussions);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDiscussion() {
    if (!title.trim()) return;
    setPending(true);
    try {
      const res = await apiFetch(`/api/portal/apprendre/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content }),
      });
      if (res.ok) {
        setTitle('');
        setContent('');
        await load();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Discussions</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Échangez avec les autres apprenants sur ce parcours.
      </p>

      <div className="mt-4 space-y-2 rounded-lg border bg-muted/20 p-3">
        <Input
          placeholder="Sujet de la discussion"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          rows={2}
          placeholder="Message (optionnel)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="button" size="sm" disabled={pending || !title.trim()} onClick={() => void createDiscussion()}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Publier
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Chargement…
        </div>
      ) : discussions.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">Aucune discussion pour l&apos;instant.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {discussions.map((d) => (
            <li key={d.id} className="rounded-lg border px-3 py-2 text-sm">
              <div className="font-medium">
                {d.isPinned ? '📌 ' : ''}
                {d.title}
              </div>
              {d.content ? <p className="text-muted-foreground mt-1 text-xs">{d.content}</p> : null}
              <div className="text-muted-foreground mt-1 text-[10px]">
                {d.authorName ?? 'Apprenant'} · {d.commentCount} commentaire(s) ·{' '}
                {new Date(d.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
