'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type LookupOption = { id: string; label: string; subtitle?: string };

type Props = {
  type: 'tickets' | 'equipment';
  label: string;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
};

export function SupportEntityCombobox({ type, label, value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['support-lookup', type, search] as const,
    queryFn: async () => {
      const sp = new URLSearchParams({ type, limit: '25' });
      if (search.trim()) sp.set('q', search.trim());
      const res = await apiFetch(`/api/sections/support-qualite/lookups?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return [];
      return unwrapSectionApiData<LookupOption[]>(json) ?? [];
    },
    staleTime: 15_000,
  });

  const selected = useMemo(
    () => options.find((o) => o.id === value),
    [options, value],
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selected?.label ?? placeholder ?? 'Sélectionner…'}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>{isLoading ? 'Chargement…' : 'Aucun résultat'}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 size-4', !value ? 'opacity-100' : 'opacity-0')} />
                  Aucun
                </CommandItem>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.id}
                    onSelect={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('mr-2 size-4', value === opt.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm">{opt.label}</p>
                      {opt.subtitle && (
                        <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
