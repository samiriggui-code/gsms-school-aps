'use client';

import { useQuery } from '@tanstack/react-query';
import { Library } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { portalMuted } from '@/components/portal/layout/portal-ui';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';

type BankItem = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
};

type Bank = {
  id: string;
  title: string;
  items: BankItem[];
};

export function InstructorQuizBankPicker({
  courseId,
  onImport,
}: {
  courseId: string;
  onImport: (items: BankItem[]) => void;
}) {
  const query = useQuery({
    queryKey: ['instructor-question-bank', courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const res = await apiFetch(`/api/instructor/courses/${courseId}/question-bank`);
      const json = (await res.json()) as { success?: boolean; data?: { banks: Bank[] } };
      if (!res.ok || !json.success) return [] as Bank[];
      return json.data?.banks ?? [];
    },
  });

  const banks = query.data ?? [];
  const allItems = banks.flatMap((b) => b.items);

  if (query.isLoading) return null;
  if (allItems.length === 0) {
    return (
      <p className={cn('text-[11px]', portalMuted)}>
        Banque QCM vide — l&apos;administration peut en alimenter une via le seed ou le CRM.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-dashed p-3">
      <p className="mb-2 flex items-center gap-1 text-[12px] font-medium">
        <Library className="size-3.5" />
        Banque de questions ({allItems.length})
      </p>
      <ul className="max-h-40 space-y-1 overflow-y-auto text-[12px]">
        {allItems.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2 rounded bg-muted/40 px-2 py-1">
            <span className="line-clamp-2">{item.prompt}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 shrink-0 text-[11px]"
              onClick={() => onImport([item])}
            >
              + Ajouter
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2 w-full text-[11px]"
        onClick={() => onImport(allItems)}
      >
        Importer toute la banque
      </Button>
    </div>
  );
}
