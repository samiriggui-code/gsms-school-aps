'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FormationExamQuickEditProps = {
  examId: string;
  field: 'scheduledAt' | 'juryPresidentName';
  value: string | null;
  className?: string;
};

export function FormationExamQuickEdit({
  examId,
  field,
  value,
  className,
}: FormationExamQuickEditProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(field === 'scheduledAt' ? toDatetimeLocalValue(value) : value ?? '');

  useEffect(() => {
    setDraft(field === 'scheduledAt' ? toDatetimeLocalValue(value) : value ?? '');
  }, [field, value]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body =
        field === 'scheduledAt'
          ? { scheduledAt: draft ? new Date(draft).toISOString() : null }
          : { juryPresidentName: draft.trim() || null };
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formation-exams/${examId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Enregistrement impossible');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'formation-exams'] });
      queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'formation-exams', examId, 'detail'] });
      toast.success('Examen mis à jour');
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const display =
    field === 'scheduledAt'
      ? value
        ? formatDateTime(value)
        : '—'
      : value?.trim() || '—';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'group inline-flex max-w-full items-center gap-1 rounded px-1 py-0.5 text-left text-xs hover:bg-muted/60',
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate">{display}</span>
          <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <p className="text-xs font-medium">
            {field === 'scheduledAt' ? 'Date et heure d\'examen' : 'Président du jury / examinateur'}
          </p>
          {field === 'scheduledAt' ? (
            <Input
              type="datetime-local"
              className="h-9"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : (
            <Input
              className="h-9"
              placeholder="Nom du président de jury"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
