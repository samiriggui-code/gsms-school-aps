'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { flattenMenuPaths } from '@/lib/menu-search';
import { useTranslation } from '@/hooks/useTranslation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export function SearchDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const entries = useMemo(() => flattenMenuPaths(MENU_SIDEBAR, t), [t]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <span
        className="inline-flex"
        role="presentation"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {trigger}
      </span>
      <CommandDialog open={open} onOpenChange={setOpen} className="lg:max-w-[560px]">
        <CommandInput placeholder={t('layout.search.placeholder')} />
        <CommandList>
          <CommandEmpty>{t('layout.search.empty')}</CommandEmpty>
          <CommandGroup heading={t('layout.search.pages')}>
            {entries.map((entry) => (
              <CommandItem
                key={entry.path}
                value={`${entry.title} ${entry.path} ${entry.section ?? ''}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(entry.path);
                }}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium">{entry.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {entry.section ? `${entry.section} · ` : ''}
                    {entry.path}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
